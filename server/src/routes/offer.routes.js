import { Router } from 'express';
import {
  createOrUpdateOffer,
  getOffers,
  getMyOffer,
  toggleOfferStatus,
} from '../controllers/offer.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.js';
import { createOfferSchema, idParamSchema } from '../validators/index.js';

const router = Router();

router.post('/', requireAuth, validate(createOfferSchema), createOrUpdateOffer);
router.get('/', getOffers);
router.get('/my', requireAuth, getMyOffer);
router.patch('/:id/toggle', requireAuth, validate(idParamSchema, 'params'), toggleOfferStatus);

export default router;
