import { Request, Response } from 'express';
import { query } from '../config/db';

export const getNotifications = async (req: Request, res: Response) => {
  try {
    const currentUserId = req.headers['x-user-id'] ? parseInt(req.headers['x-user-id'] as string, 10) : 1;

    const listRes = await query(
      `SELECT 
        n.notification_id,
        n.user_id,
        n.sender_id,
        n.type,
        n.title,
        n.message,
        n.link,
        n.is_read,
        n.created_at,
        u.name AS sender_name,
        u.avatar_url AS sender_avatar,
        u.institution AS sender_institution
       FROM notifications n
       LEFT JOIN users u ON u.user_id = n.sender_id
       WHERE n.user_id = $1
       ORDER BY n.created_at DESC
       LIMIT 60`,
      [currentUserId]
    );

    const countRes = await query(
      `SELECT COUNT(*)::int AS unread_count 
       FROM notifications 
       WHERE user_id = $1 AND is_read = FALSE`,
      [currentUserId]
    );

    return res.json({
      notifications: listRes.rows,
      unreadCount: countRes.rows[0]?.unread_count || 0
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const markAsRead = async (req: Request, res: Response) => {
  try {
    const currentUserId = req.headers['x-user-id'] ? parseInt(req.headers['x-user-id'] as string, 10) : 1;
    const { id } = req.params;

    await query(
      `UPDATE notifications 
       SET is_read = TRUE 
       WHERE notification_id = $1 AND user_id = $2`,
      [id, currentUserId]
    );

    return res.json({ success: true, message: 'Đã đánh dấu là đã đọc.' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const markAllAsRead = async (req: Request, res: Response) => {
  try {
    const currentUserId = req.headers['x-user-id'] ? parseInt(req.headers['x-user-id'] as string, 10) : 1;

    await query(
      `UPDATE notifications 
       SET is_read = TRUE 
       WHERE user_id = $1`,
      [currentUserId]
    );

    return res.json({ success: true, message: 'Đã đánh dấu tất cả thông báo là đã đọc.' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

