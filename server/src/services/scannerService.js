import { eventbriteScanner } from '../scanners/eventbriteScanner.js';
import { googleScanner } from '../scanners/googleScanner.js';
import { mallScanner } from '../scanners/mallScanner.js';
import { env } from '../config/env.js';
import { supabaseAdmin } from '../config/supabase.js';
import { classifyMention } from './dealClassifierService.js';
import { findDuplicateDeal, findDuplicateRawMention } from './dealDeduplicationService.js';
import { classifyNewRawDealMentions } from './aiDealClassifierService.js';
import { buildDealFromAiClassification } from './dealEnrichmentService.js';

const scanners = [googleScanner, eventbriteScanner, mallScanner];

export async function runAllScanners() {
  const results = [];
  for (const scanner of scanners) {
    results.push(await runScanner(scanner));
  }
  return results;
}

export async function runScanner(scanner) {
  const run = await createScannerRun(scanner.name);
  try {
    const mentions = await scanner.scan();
    let saved = 0;

    for (const mention of mentions) {
      const created = await saveRawMention(mention);
      if (created) saved += 1;
    }

    if (env.aiClassificationEnabled && saved > 0) {
      await classifyNewRawDealMentions(Math.max(saved, env.aiClassificationBatchLimit));
    }

    return finishScannerRun(run.id, {
      status: 'success',
      resultsFound: mentions.length,
      resultsSaved: saved
    });
  } catch (error) {
    return finishScannerRun(run.id, {
      status: 'failed',
      errorMessage: error.message
    });
  }
}

export async function saveRawMention(mention) {
  const duplicate = await findDuplicateRawMention(mention);
  if (duplicate) return null;

  const classification = classifyMention(mention);
  const payload = {
    source_id: mention.source_id || null,
    title: mention.title,
    snippet: mention.snippet || null,
    raw_text: mention.raw_text || mention.snippet || mention.title,
    source_url: mention.source_url || null,
    source_type: mention.source_type,
    source_published_at: mention.source_published_at || null,
    city: mention.city || null,
    province: mention.province || 'BC',
    detected_keywords: classification.detectedKeywords,
    classification_status: 'new',
    classification_result: null,
    confidence_score: 0
  };

  const { data, error } = await insertRawMention(payload);
  if (error) throw error;

  if (!env.aiClassificationEnabled && classification.shouldCreateDeal) {
    await supabaseAdmin
      .from('raw_deal_mentions')
      .update({
        classification_status: 'classified',
        classification_result: classification,
        confidence_score: classification.confidenceScore,
        updated_at: new Date().toISOString()
      })
      .eq('id', data.id);
    await convertRawMentionToDeal(data.id, classification.dealStatus);
  }

  return data;
}

export const saveAndClassifyMention = saveRawMention;

export async function listScannerRuns() {
  const { data, error } = await supabaseAdmin
    .from('scanner_runs')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return data;
}

export async function listRawDealMentions(filters = {}) {
  let query = supabaseAdmin
    .from('raw_deal_mentions')
    .select('*, deal_sources(name)')
    .order('created_at', { ascending: false })
    .limit(100);

  if (filters.status) query = query.eq('classification_status', filters.status);
  if (filters.city) query = query.ilike('city', `%${filters.city}%`);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function ignoreRawMention(id) {
  const { data, error } = await supabaseAdmin
    .from('raw_deal_mentions')
    .update({ classification_status: 'ignored', updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function convertRawMentionToDeal(id, forcedStatus = null) {
  const { data: mention, error } = await supabaseAdmin
    .from('raw_deal_mentions')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;

  if (mention.converted_deal_id) return mention.converted_deal_id;

  const classification = mention.classification_result || classifyMention(mention);
  const duplicate = await findDuplicateDeal({
    title: mention.title,
    sourceUrl: mention.source_url,
    city: mention.city,
    storeName: detectStoreName(mention.title)
  });
  if (duplicate) {
    await markMentionConverted(id, duplicate.id);
    return duplicate.id;
  }

  const deal = classification.userFacingSummary
    ? {
      ...buildDealFromAiClassification(mention, {
        ...classification,
        suggestedStatus: forcedStatus || classification.suggestedStatus || 'pending'
      }),
      status: forcedStatus || classification.suggestedStatus || 'pending'
    }
    : {
      title: mention.title,
      store_name: detectStoreName(mention.title),
      address: 'Address to verify',
      city: mention.city || 'Metro Vancouver',
      province: mention.province || 'BC',
      postal_code: null,
      category: classification.category || 'other',
      sale_type: classification.saleType || 'other',
      discount_text: detectDiscountText(mention),
      description: mention.snippet || mention.raw_text || mention.title,
      source_type: mention.source_type || 'other',
      source_url: mention.source_url,
      source_published_at: mention.source_published_at || null,
      status: forcedStatus || classification.dealStatus || 'pending',
      confidence_score: 50,
      source_confidence: mention.confidence_score || classification.confidenceScore || 50,
      source_id: mention.source_id,
      raw_mention_id: mention.id,
      detection_method: 'scanner'
    };

  const { data: createdDeal, error: createError } = await insertDeal(deal, '*');
  if (createError) throw createError;

  await markMentionConverted(id, createdDeal.id);
  return createdDeal.id;
}

async function insertRawMention(payload) {
  const result = await supabaseAdmin
    .from('raw_deal_mentions')
    .insert(payload)
    .select('*')
    .single();

  if (!isMissingSourcePublishedAt(result.error)) return result;
  const { source_published_at, ...fallbackPayload } = payload;
  return supabaseAdmin.from('raw_deal_mentions').insert(fallbackPayload).select('*').single();
}

async function insertDeal(deal, select = '*') {
  const result = await supabaseAdmin.from('deals').insert(deal).select(select).single();
  if (!isMissingSourcePublishedAt(result.error)) return result;
  const { source_published_at, ...fallbackDeal } = deal;
  return supabaseAdmin.from('deals').insert(fallbackDeal).select(select).single();
}

function isMissingSourcePublishedAt(error) {
  return String(error?.message || '').includes('source_published_at');
}

async function createScannerRun(scannerName) {
  const { data, error } = await supabaseAdmin
    .from('scanner_runs')
    .insert({ scanner_name: scannerName, status: 'running' })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

async function finishScannerRun(id, result) {
  const { data, error } = await supabaseAdmin
    .from('scanner_runs')
    .update({
      status: result.status,
      finished_at: new Date().toISOString(),
      results_found: result.resultsFound || 0,
      results_saved: result.resultsSaved || 0,
      error_message: result.errorMessage || null
    })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

async function markMentionConverted(id, dealId) {
  await supabaseAdmin
    .from('raw_deal_mentions')
    .update({
      classification_status: 'converted',
      converted_deal_id: dealId,
      updated_at: new Date().toISOString()
    })
    .eq('id', id);
}

function detectStoreName(title) {
  return title.split(/[-|:]/)[0].trim().slice(0, 120) || 'Store to verify';
}

function detectDiscountText(mention) {
  const text = [mention.title, mention.snippet].filter(Boolean).join(' ');
  const match = text.match(/(?:up to\s*)?\d{1,2}%\s*off/i);
  return match ? match[0] : 'Deal details to verify';
}
