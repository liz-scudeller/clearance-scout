import { Router } from 'express';
import multer from 'multer';
import { confirmDeal, getDeal, getDeals, postDeal } from '../controllers/dealController.js';
import { requireAuth } from '../middleware/auth.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
const router = Router();

router.get('/', getDeals);
router.get('/:id', getDeal);
router.post('/', requireAuth, upload.single('image'), postDeal);
router.post('/:id/confirm', requireAuth, confirmDeal);

export default router;
