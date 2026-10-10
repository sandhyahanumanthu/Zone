import { Router } from 'express';
import {
  createReport,
  getModerationQueue,
  moderateReport,
  blockUser,
  getBlockedUsers,
} from '../controllers/moderation.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.js';
import {
  createReportSchema,
  moderateReportSchema,
  idParamSchema,
} from '../validators/index.js';

const router = Router();

router.post('/reports', requireAuth, validate(createReportSchema), createReport);
router.get('/queue', requireAuth, getModerationQueue);
router.patch(
  '/reports/:id',
  requireAuth,
  validate(idParamSchema, 'params'),
  validate(moderateReportSchema),
  moderateReport
);
router.post('/block', requireAuth, blockUser);
router.get('/blocked', requireAuth, getBlockedUsers);

export default router;
