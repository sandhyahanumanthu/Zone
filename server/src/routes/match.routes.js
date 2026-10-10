import { Router } from 'express';
import { getMatches, acceptMatch } from '../controllers/match.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/needs/:needId', requireAuth, getMatches);
router.post('/needs/:needId/accept', requireAuth, acceptMatch);

export default router;
