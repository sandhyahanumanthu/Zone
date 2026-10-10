import { Router } from 'express';
import { getEventAnalytics } from '../controllers/analytics.controller.js';
import { validate } from '../middleware/validate.js';
import { idParamSchema } from '../validators/index.js';

const router = Router();

router.get('/events/:id', validate(idParamSchema, 'params'), (req, res, next) => {
  req.params.zoneId = req.params.id;
  getEventAnalytics(req, res, next);
});

export default router;
