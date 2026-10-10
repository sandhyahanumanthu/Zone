import { Router } from 'express';
import { getUserProfile } from '../controllers/user.controller.js';
import { validate } from '../middleware/validate.js';
import { idParamSchema } from '../validators/index.js';

const router = Router();

router.get('/:id', validate(idParamSchema, 'params'), getUserProfile);

export default router;
