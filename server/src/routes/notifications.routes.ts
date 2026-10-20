import { Router } from 'express';
import { getNotifications, markAsRead, markAllAsRead } from '../controllers/notifications.controller';

const router = Router();
router.get('/', getNotifications);
router.put('/read-all', markAllAsRead);
router.put('/:id/read', markAsRead);

export default router;

