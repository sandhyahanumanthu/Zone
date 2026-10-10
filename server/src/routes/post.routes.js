import { Router } from 'express';
import { getPosts } from '../controllers/post.controller.js';
import { validate } from '../middleware/validate.js';
import { paginationQuerySchema } from '../validators/index.js';

const router = Router();

router.get('/', validate(paginationQuerySchema, 'query'), getPosts);

export default router;
