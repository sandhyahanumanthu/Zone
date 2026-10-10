import { Router } from 'express';
import {
  getCollaboration,
  addNote,
  resolveCollaboration,
  leaveCollaboration,
} from '../controllers/collaboration.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.js';
import {
  idParamSchema,
  addNoteSchema,
  resolveTaskSchema,
} from '../validators/index.js';

const router = Router();

router.get('/:id', requireAuth, validate(idParamSchema, 'params'), getCollaboration);
router.post(
  '/:id/notes',
  requireAuth,
  validate(idParamSchema, 'params'),
  validate(addNoteSchema),
  addNote
);
router.patch(
  '/:id/resolve',
  requireAuth,
  validate(idParamSchema, 'params'),
  validate(resolveTaskSchema),
  resolveCollaboration
);
router.patch(
  '/:id/leave',
  requireAuth,
  validate(idParamSchema, 'params'),
  leaveCollaboration
);

export default router;
