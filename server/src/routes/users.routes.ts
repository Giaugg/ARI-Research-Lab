import { Router } from 'express';
import { getUsers, getUserById, toggleFollow, getMutualConnections } from '../controllers/users.controller';

const router = Router();
router.get('/', getUsers);
router.get('/:id', getUserById);
router.post('/:id/follow', toggleFollow);
router.get('/:id/mutual/:targetId', getMutualConnections);

export default router;
