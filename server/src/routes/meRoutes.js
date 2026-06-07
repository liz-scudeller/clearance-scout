import { Router } from 'express';
import {
  deleteSavedDeal,
  deleteHiddenDeal,
  getAlertPreferences,
  getHiddenDeals,
  getProfile,
  getSavedDeals,
  putAlertPreferences,
  putHiddenDeal,
  putProfile,
  putSavedDeal
} from '../controllers/meController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);
router.get('/profile', getProfile);
router.put('/profile', putProfile);
router.get('/alerts', getAlertPreferences);
router.put('/alerts', putAlertPreferences);
router.get('/saved-deals', getSavedDeals);
router.put('/saved-deals/:id', putSavedDeal);
router.delete('/saved-deals/:id', deleteSavedDeal);
router.get('/hidden-deals', getHiddenDeals);
router.put('/hidden-deals/:id', putHiddenDeal);
router.delete('/hidden-deals/:id', deleteHiddenDeal);

export default router;
