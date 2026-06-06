import { env } from '../config/env.js';
import { getOpenAiClient } from '../config/openaiClient.js';
import { buildDealClassificationPrompt } from '../prompts/dealClassificationPrompt.js';
import { supabaseAdmin } from '../config/supabase.js';
import { classifyMention } from './dealClassifierService.js';
import { findAiDuplicate } from './aiDeduplicationService.js';
import { buildDealFromAiClassification } from './dealEnrichmentService.js';

const saleTypes = ['store_closing', 'clearance', 'warehouse_sale', 'relocation_sale', 'final_sale', 'floor_model_sale', 'other'];
const categories = ['clothing', 'shoes', 'sports', 'furniture', 'home', 'electronics', 'toys', 'baby', 'beauty', 'grocery', 'tools', 'other'];
const statuses = ['active', 'pending', 'ignored'];

export async function classifyRawDealMention(rawMention) {
  validateRawMention(rawMention);

  if (!env.aiClassificationEnabled) {
    return classifyWithRules(rawMention);
  }

  try {
    const classification = await classifyWithOpenAi(rawMention);
    await saveAiClassification(rawMention.id, classification);

    if (!classification.shouldCreateDeal || classification.suggestedStatus === 'ignored') {
      await markIgnoredIfNeeded(rawMention.id, classification);
      return classification;
    }

    const duplicate = await findAiDuplicate(classification);
    if (duplicate.isDuplicate && duplicate.duplicateDealId) {
      await markMentionConverted(rawMention.id, duplicate.duplicateDealId, classification);
      return { ...classification, duplicate };
    }

    const dealId = await createDealFromAiClassification(rawMention, classification);
    return { ...classification, createdDealId: dealId };
  } catch (error) {
    await saveAiError(rawMention.id, error.message);
    return {
      isRelevant: false,
      relevanceReason: 'AI classification failed.',
      saleType: 'other',
      category: 'other',
      confidenceScore: 0,
      shouldCreateDeal: false,
      suggestedStatus: 'ignored',
      userFacingSummary: '',
      adminNotes: error.message,
      possibleDuplicateHints: []
    };
  }
}

export async function classifyNewRawDealMentions(limit = env.aiClassificationBatchLimit) {
  const { data, error } = await supabaseAdmin
    .from('raw_deal_mentions')
    .select('*')
    .eq('classification_status', 'new')
    .order('created_at', { ascending: true })
    .limit(limit);
  if (error) throw error;

  const results = [];
  for (const mention of data) {
    results.push({ id: mention.id, result: await classifyRawDealMention(mention) });
  }
  return results;
}

export async function listAiClassificationResults() {
  const { data, error } = await supabaseAdmin
    .from('raw_deal_mentions')
    .select('id,title,city,source_type,classification_status,classification_result,confidence_score,ai_error_message,converted_deal_id,created_at,updated_at')
    .in('classification_status', ['classified', 'ignored', 'converted', 'ai_error'])
    .order('updated_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  return data;
}

async function classifyWithOpenAi(rawMention) {
  const client = getOpenAiClient();
  const prompt = buildDealClassificationPrompt(rawMention, {
    autoApproveThreshold: env.aiAutoApproveThreshold,
    pendingReviewThreshold: env.aiPendingReviewThreshold
  });

  const response = await client.chat.completions.create({
    model: env.openAiModel,
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' }
  });

  const outputText = response.choices?.[0]?.message?.content;
  if (!outputText) throw new Error('AI response was empty.');
  return validateClassification(parseJson(outputText));
}

async function classifyWithRules(rawMention) {
  const ruleResult = classifyMention(rawMention);
  const classification = validateClassification({
    isRelevant: ruleResult.shouldCreateDeal,
    relevanceReason: ruleResult.shouldCreateDeal ? 'Matched rule-based scanner keywords.' : 'No strong scanner keywords found.',
    saleType: ruleResult.saleType,
    category: ruleResult.category,
    storeName: null,
    locationName: null,
    city: rawMention.city,
    province: rawMention.province,
    address: null,
    discountText: null,
    startDate: null,
    expiresAt: null,
    imageUrl: null,
    imageDescription: null,
    confidenceScore: ruleResult.confidenceScore,
    shouldCreateDeal: ruleResult.shouldCreateDeal,
    suggestedStatus: ruleResult.confidenceScore >= env.aiAutoApproveThreshold ? 'active' : ruleResult.confidenceScore >= env.aiPendingReviewThreshold ? 'pending' : 'ignored',
    userFacingSummary: ruleResult.shouldCreateDeal ? 'Detected automatically from a public source. Please confirm with the store before visiting.' : '',
    adminNotes: 'AI disabled; classified with rule-based fallback.',
    possibleDuplicateHints: [rawMention.title].filter(Boolean)
  });

  await saveAiClassification(rawMention.id, classification);
  if (classification.shouldCreateDeal && classification.suggestedStatus !== 'ignored') {
    const dealId = await createDealFromAiClassification(rawMention, classification);
    return { ...classification, createdDealId: dealId };
  }
  await markIgnoredIfNeeded(rawMention.id, classification);
  return classification;
}

function validateRawMention(rawMention) {
  if (!rawMention?.id || !rawMention.title) {
    const error = new Error('rawMention requires id and title.');
    error.statusCode = 400;
    throw error;
  }
}

function parseJson(value) {
  try {
    return JSON.parse(value);
  } catch {
    const error = new Error('AI response was not valid JSON.');
    error.statusCode = 502;
    throw error;
  }
}

function validateClassification(value) {
  const confidenceScore = clamp(Number(value.confidenceScore || 0), 0, 100);
  const suggestedStatus = statuses.includes(value.suggestedStatus)
    ? value.suggestedStatus
    : confidenceScore >= env.aiAutoApproveThreshold
      ? 'active'
      : confidenceScore >= env.aiPendingReviewThreshold
        ? 'pending'
        : 'ignored';

  return {
    isRelevant: Boolean(value.isRelevant),
    relevanceReason: String(value.relevanceReason || ''),
    saleType: saleTypes.includes(value.saleType) ? value.saleType : 'other',
    category: categories.includes(value.category) ? value.category : 'other',
    storeName: value.storeName || null,
    locationName: value.locationName || null,
    city: value.city || null,
    province: value.province || null,
    address: value.address || null,
    discountText: value.discountText || null,
    startDate: value.startDate || null,
    expiresAt: value.expiresAt || null,
    imageUrl: sanitizeImageUrl(value.imageUrl),
    imageDescription: value.imageDescription ? String(value.imageDescription).slice(0, 180) : null,
    confidenceScore,
    shouldCreateDeal: Boolean(value.shouldCreateDeal) && suggestedStatus !== 'ignored',
    suggestedStatus,
    userFacingSummary: String(value.userFacingSummary || ''),
    adminNotes: String(value.adminNotes || ''),
    possibleDuplicateHints: Array.isArray(value.possibleDuplicateHints) ? value.possibleDuplicateHints : []
  };
}

async function saveAiClassification(id, classification) {
  const status = classification.suggestedStatus === 'ignored' ? 'ignored' : 'classified';
  const { error } = await supabaseAdmin
    .from('raw_deal_mentions')
    .update({
      classification_status: status,
      classification_result: classification,
      confidence_score: classification.confidenceScore,
      ai_error_message: null,
      updated_at: new Date().toISOString()
    })
    .eq('id', id);
  if (error) throw error;
}

async function markIgnoredIfNeeded(id, classification) {
  if (classification.suggestedStatus !== 'ignored') return;
  const { error } = await supabaseAdmin
    .from('raw_deal_mentions')
    .update({
      classification_status: 'ignored',
      updated_at: new Date().toISOString()
    })
    .eq('id', id);
  if (error) throw error;
}

async function createDealFromAiClassification(rawMention, classification) {
  const deal = buildDealFromAiClassification(rawMention, classification);
  const { data, error } = await supabaseAdmin
    .from('deals')
    .insert(deal)
    .select('id')
    .single();
  if (error) throw error;

  await markMentionConverted(rawMention.id, data.id, classification);
  return data.id;
}

async function markMentionConverted(id, dealId, classification) {
  const { error } = await supabaseAdmin
    .from('raw_deal_mentions')
    .update({
      classification_status: 'converted',
      classification_result: classification,
      confidence_score: classification.confidenceScore,
      converted_deal_id: dealId,
      updated_at: new Date().toISOString()
    })
    .eq('id', id);
  if (error) throw error;
}

async function saveAiError(id, message) {
  await supabaseAdmin
    .from('raw_deal_mentions')
    .update({
      classification_status: 'ai_error',
      ai_error_message: message,
      updated_at: new Date().toISOString()
    })
    .eq('id', id);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function sanitizeImageUrl(value) {
  if (!value || typeof value !== 'string') return null;
  try {
    const url = new URL(value);
    if (!['https:', 'http:'].includes(url.protocol)) return null;
    return url.toString();
  } catch {
    return null;
  }
}
