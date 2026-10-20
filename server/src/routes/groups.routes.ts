import { Router } from 'express';
import { getGroups, getGroupById, createGroup, toggleJoinGroup } from '../controllers/groups.controller';

const router = Router();
router.get('/', getGroups);
router.get('/:id', getGroupById);
router.post('/', createGroup);
router.post('/:id/join', toggleJoinGroup);

export default router;
