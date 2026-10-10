import { Router } from 'express';
import {
  createNeed,
  getNeeds,
  getNeedById,
  extractDraft,
  cancelNeed,
  resolveNeed,
} from '../controllers/need.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.js';
import {
  createNeedSchema,
  extractDraftSchema,
  idParamSchema,
} from '../validators/index.js';

const router = Router();

router.post('/', requireAuth, validate(createNeedSchema), createNeed);
router.get('/', getNeeds);
router.get('/:id', validate(idParamSchema, 'params'), getNeedById);
router.post('/extract-draft', requireAuth, validate(extractDraftSchema), extractDraft);
router.patch('/:id/cancel', requireAuth, validate(idParamSchema, 'params'), cancelNeed);
router.patch('/:id/resolve', requireAuth, validate(idParamSchema, 'params'), resolveNeed);

export default router;
