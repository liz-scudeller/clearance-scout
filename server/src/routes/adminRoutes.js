import { Router } from 'express';
import {
  getPendingDeals,
  getRawDealMentions,
  getScannerRuns,
  patchDealStatus,
  patchIgnoreRawMention,
  postConvertRawMention,
  postRunScanners
} from '../controllers/adminController.js';
import { requireAdmin } from '../middleware/admin.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth, requireAdmin);
router.get('/deals/pending', getPendingDeals);
router.patch('/deals/:id/status', patchDealStatus);
router.post('/scanners/run', postRunScanners);
router.get('/scanners/runs', getScannerRuns);
router.get('/raw-deal-mentions', getRawDealMentions);
router.patch('/raw-deal-mentions/:id/ignore', patchIgnoreRawMention);
router.post('/raw-deal-mentions/:id/convert', postConvertRawMention);

export default router;
