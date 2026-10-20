import { Router } from 'express';
import { getPosts, getPostById, createPost, toggleLike, getTags } from '../controllers/posts.controller';

const router = Router();
router.get('/', getPosts);
router.get('/tags', getTags);
router.get('/:id', getPostById);
router.post('/', createPost);
router.post('/:id/like', toggleLike);

export default router;
