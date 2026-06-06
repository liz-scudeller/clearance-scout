import { deleteDeal, listPendingDeals, updateDealStatus } from '../services/dealService.js';
import {
  convertRawMentionToDeal,
  ignoreRawMention,
  listRawDealMentions,
  listScannerRuns,
  runAllScanners
} from '../services/scannerService.js';
import { isAdminUser } from '../middleware/admin.js';

export async function getAdminMe(req, res, next) {
  try {
    res.json({ isAdmin: await isAdminUser(req.user) });
  } catch (error) {
    next(error);
  }
}

export async function getPendingDeals(req, res, next) {
  try {
    const deals = await listPendingDeals();
    res.json({ deals });
  } catch (error) {
    next(error);
  }
}

export async function patchDealStatus(req, res, next) {
  try {
    const deal = await updateDealStatus(req.params.id, req.body.status);
    res.json({ deal });
  } catch (error) {
    next(error);
  }
}

export async function deleteAdminDeal(req, res, next) {
  try {
    const deal = await deleteDeal(req.params.id);
    res.json({ deal });
  } catch (error) {
    next(error);
  }
}

export async function postRunScanners(req, res, next) {
  try {
    const runs = await runAllScanners();
    res.status(201).json({ runs });
  } catch (error) {
    next(error);
  }
}

export async function getScannerRuns(req, res, next) {
  try {
    const runs = await listScannerRuns();
    res.json({ runs });
  } catch (error) {
    next(error);
  }
}

export async function getRawDealMentions(req, res, next) {
  try {
    const mentions = await listRawDealMentions(req.query);
    res.json({ mentions });
  } catch (error) {
    next(error);
  }
}

export async function patchIgnoreRawMention(req, res, next) {
  try {
    const mention = await ignoreRawMention(req.params.id);
    res.json({ mention });
  } catch (error) {
    next(error);
  }
}

export async function postConvertRawMention(req, res, next) {
  try {
    const dealId = await convertRawMentionToDeal(req.params.id, req.body?.status);
    res.status(201).json({ dealId });
  } catch (error) {
    next(error);
  }
}
