import { Router } from 'express';
import { getMe, switchUser, register, login } from '../controllers/auth.controller';

const router = Router();
router.get('/me', getMe);
router.post('/switch/:userId', switchUser);
router.post('/register', register);
router.post('/login', login);

export default router;
