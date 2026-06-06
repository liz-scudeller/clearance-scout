import { Router } from 'express';
import {
  deleteAdminDeal,
  getAdminMe,
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

router.use(requireAuth);
router.get('/me', getAdminMe);

router.use(requireAdmin);
router.get('/deals/pending', getPendingDeals);
router.patch('/deals/:id/status', patchDealStatus);
router.delete('/deals/:id', deleteAdminDeal);
router.post('/scanners/run', postRunScanners);
router.get('/scanners/runs', getScannerRuns);
router.get('/raw-deal-mentions', getRawDealMentions);
router.patch('/raw-deal-mentions/:id/ignore', patchIgnoreRawMention);
router.post('/raw-deal-mentions/:id/convert', postConvertRawMention);

export default router;
