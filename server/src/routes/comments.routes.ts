import { Router } from 'express';
import { getCommentsByPost, createComment, deleteComment } from '../controllers/comments.controller';

const router = Router();
router.get('/post/:postId', getCommentsByPost);
router.post('/post/:postId', createComment);
router.delete('/:commentId', deleteComment);

export default router;
