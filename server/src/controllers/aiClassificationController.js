import { supabaseAdmin } from '../config/supabase.js';
import {
  classifyNewRawDealMentions,
  classifyRawDealMention,
  listAiClassificationResults
} from '../services/aiDealClassifierService.js';

export async function postClassifyRawMention(req, res, next) {
  try {
    const { data, error } = await supabaseAdmin
      .from('raw_deal_mentions')
      .select('*')
      .eq('id', req.params.rawMentionId)
      .single();
    if (error) throw error;

    const result = await classifyRawDealMention(data);
    res.status(201).json({ result });
  } catch (error) {
    next(error);
  }
}

export async function postClassifyBatch(req, res, next) {
  try {
    const limit = Number(req.body?.limit || 20);
    const results = await classifyNewRawDealMentions(limit);
    res.status(201).json({ results });
  } catch (error) {
    next(error);
  }
}

export async function getClassificationResults(req, res, next) {
  try {
    const results = await listAiClassificationResults();
    res.json({ results });
  } catch (error) {
    next(error);
  }
}
