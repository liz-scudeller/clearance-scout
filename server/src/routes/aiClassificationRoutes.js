import { Router } from 'express';
import {
  getClassificationResults,
  postClassifyBatch,
  postClassifyRawMention
} from '../controllers/aiClassificationController.js';
import { requireAdmin } from '../middleware/admin.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth, requireAdmin);
router.post('/classify/:rawMentionId', postClassifyRawMention);
router.post('/classify-batch', postClassifyBatch);
router.get('/classification-results', getClassificationResults);

export default router;
