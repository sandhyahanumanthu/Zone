import { Router } from 'express';
import {
  getZones,
  getZoneById,
  joinZone,
  addAnnouncement,
  updateZoneLocation,
} from '../controllers/zone.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.js';
import {
  idParamSchema,
  zoneQuerySchema,
  announcementSchema,
  joinEventSchema,
  updateZoneLocationSchema,
} from '../validators/index.js';

const router = Router();

router.get('/', validate(zoneQuerySchema, 'query'), getZones);
router.get('/:id', validate(idParamSchema, 'params'), getZoneById);
router.patch(
  '/:id/location',
  requireAuth,
  validate(idParamSchema, 'params'),
  validate(updateZoneLocationSchema),
  updateZoneLocation
);
router.post(
  '/:id/join',
  requireAuth,
  validate(idParamSchema, 'params'),
  validate(joinEventSchema),
  joinZone
);
router.post(
  '/:id/announcements',
  requireAuth,
  validate(idParamSchema, 'params'),
  validate(announcementSchema),
  addAnnouncement
);

export default router;
