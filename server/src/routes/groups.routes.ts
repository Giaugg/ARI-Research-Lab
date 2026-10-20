import { Router } from 'express';
import { 
  getGroups, 
  getGroupById, 
  createGroup, 
  toggleJoinGroup,
  getGroupByInviteCode,
  joinGroupByLink,
  inviteUserToGroup
} from '../controllers/groups.controller';

const router = Router();
router.get('/', getGroups);
router.post('/', createGroup);
router.get('/invite/:code', getGroupByInviteCode);
router.post('/join-by-link', joinGroupByLink);
router.get('/:id', getGroupById);
router.post('/:id/join', toggleJoinGroup);
router.post('/:id/invite', inviteUserToGroup);

export default router;
