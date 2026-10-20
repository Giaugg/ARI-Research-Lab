import { Request, Response } from 'express';
import { query } from '../config/db';

export const getUsers = async (req: Request, res: Response) => {
  try {
    const currentUserId = req.headers['x-user-id'] ? parseInt(req.headers['x-user-id'] as string, 10) : 1;
    const { search } = req.query;

    let sql = `
      SELECT 
        u.user_id, u.name, u.email, u.role, u.institution, u.bio, u.research_fields, u.avatar_url,
        (SELECT COUNT(*) FROM follows WHERE follower_id = u.user_id) AS following_count,
        (SELECT COUNT(*) FROM follows WHERE following_id = u.user_id) AS followers_count,
        (SELECT COUNT(*) FROM group_members WHERE user_id = u.user_id) AS groups_count,
        (SELECT COUNT(*) FROM publication_authors WHERE user_id = u.user_id) AS publications_count,
        EXISTS(SELECT 1 FROM follows WHERE follower_id = $1 AND following_id = u.user_id) AS is_following
      FROM users u
    `;

    const params: any[] = [currentUserId];
    if (search) {
      sql += ` WHERE u.name ILIKE $2 OR u.institution ILIKE $2 OR u.email ILIKE $2`;
      params.push(`%${search}%`);
    }
    sql += ` ORDER BY u.user_id ASC`;

    const result = await query(sql, params);
    return res.json({ users: result.rows });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const currentUserId = req.headers['x-user-id'] ? parseInt(req.headers['x-user-id'] as string, 10) : 1;

    const userRes = await query(
      `SELECT 
        u.*,
        (SELECT COUNT(*) FROM follows WHERE follower_id = u.user_id) AS following_count,
        (SELECT COUNT(*) FROM follows WHERE following_id = u.user_id) AS followers_count,
        EXISTS(SELECT 1 FROM follows WHERE follower_id = $2 AND following_id = u.user_id) AS is_following
       FROM users u WHERE u.user_id = $1`,
      [id, currentUserId]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get publications
    const pubsRes = await query(
      `SELECT p.*, pa.author_order
       FROM publications p
       JOIN publication_authors pa ON pa.publication_id = p.publication_id
       WHERE pa.user_id = $1
       ORDER BY p.published_at DESC`,
      [id]
    );

    // Get groups
    const groupsRes = await query(
      `SELECT rg.group_id, rg.name, rg.topic, gm.role, rg.avatar_url
       FROM research_groups rg
       JOIN group_members gm ON gm.group_id = rg.group_id
       WHERE gm.user_id = $1
       ORDER BY gm.joined_at DESC`,
      [id]
    );

    // Get followers & following lists
    const followersRes = await query(
      `SELECT u.user_id, u.name, u.institution, u.avatar_url
       FROM follows f JOIN users u ON u.user_id = f.follower_id
       WHERE f.following_id = $1`,
      [id]
    );

    const followingRes = await query(
      `SELECT u.user_id, u.name, u.institution, u.avatar_url
       FROM follows f JOIN users u ON u.user_id = f.following_id
       WHERE f.follower_id = $1`,
      [id]
    );

    return res.json({
      user: userRes.rows[0],
      publications: pubsRes.rows,
      groups: groupsRes.rows,
      followers: followersRes.rows,
      following: followingRes.rows
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const toggleFollow = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const currentUserId = req.headers['x-user-id'] ? parseInt(req.headers['x-user-id'] as string, 10) : 1;
    const targetUserId = parseInt(id, 10);

    if (currentUserId === targetUserId) {
      return res.status(400).json({ error: 'Cannot follow yourself (CHECK constraint chk_not_self_follow).' });
    }

    const check = await query(
      `SELECT 1 FROM follows WHERE follower_id = $1 AND following_id = $2`,
      [currentUserId, targetUserId]
    );

    if (check.rows.length > 0) {
      await query(`DELETE FROM follows WHERE follower_id = $1 AND following_id = $2`, [currentUserId, targetUserId]);
      return res.json({ following: false, message: 'Unfollowed successfully.' });
    } else {
      await query(`INSERT INTO follows (follower_id, following_id) VALUES ($1, $2)`, [currentUserId, targetUserId]);
      
      // Notify target user
      const followerRes = await query(`SELECT name FROM users WHERE user_id = $1`, [currentUserId]);
      const followerName = followerRes.rows[0]?.name || 'Một nhà nghiên cứu';
      await query(`
        INSERT INTO notifications (user_id, sender_id, type, title, message, link)
        VALUES ($1, $2, 'follow', 'Người theo dõi mới', $3, $4)
      `, [targetUserId, currentUserId, `${followerName} đã bắt đầu theo dõi hồ sơ học thuật của bạn.`, `/profile/${currentUserId}`]);

      return res.json({ following: true, message: 'Followed successfully.' });
    }
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const getMutualConnections = async (req: Request, res: Response) => {
  try {
    const { id, targetId } = req.params;

    // People both user A and user B follow
    const mutualFollowings = await query(
      `SELECT u.user_id, u.name, u.institution, u.avatar_url
       FROM users u
       JOIN follows fa ON fa.following_id = u.user_id AND fa.follower_id = $1
       JOIN follows fb ON fb.following_id = u.user_id AND fb.follower_id = $2`,
      [id, targetId]
    );

    // People who follow both user A and user B
    const mutualFollowers = await query(
      `SELECT u.user_id, u.name, u.institution, u.avatar_url
       FROM users u
       JOIN follows fa ON fa.follower_id = u.user_id AND fa.following_id = $1
       JOIN follows fb ON fb.follower_id = u.user_id AND fb.following_id = $2`,
      [id, targetId]
    );

    // Shared research groups
    const sharedGroups = await query(
      `SELECT rg.group_id, rg.name, rg.topic
       FROM research_groups rg
       JOIN group_members gma ON gma.group_id = rg.group_id AND gma.user_id = $1
       JOIN group_members gmb ON gmb.group_id = rg.group_id AND gmb.user_id = $2`,
      [id, targetId]
    );

    return res.json({
      mutualFollowings: mutualFollowings.rows,
      mutualFollowers: mutualFollowers.rows,
      sharedGroups: sharedGroups.rows
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const currentUserId = req.headers['x-user-id'] ? parseInt(req.headers['x-user-id'] as string, 10) : 1;
    const targetUserId = parseInt(id as string, 10);

    if (currentUserId !== targetUserId) {
      return res.status(403).json({ error: 'Bạn chỉ có quyền sửa thông tin hồ sơ của chính mình.' });
    }

    const { name, institution, bio, research_fields, avatar_url, role } = req.body;

    const fieldsToUpdate: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (name !== undefined) {
      fieldsToUpdate.push(`name = $${paramIndex++}`);
      values.push(name.trim());
    }
    if (role !== undefined && ['admin', 'pi', 'researcher', 'student'].includes(role)) {
      fieldsToUpdate.push(`role = $${paramIndex++}`);
      values.push(role);
    }
    if (institution !== undefined) {
      fieldsToUpdate.push(`institution = $${paramIndex++}`);
      values.push(institution.trim());
    }
    if (bio !== undefined) {
      fieldsToUpdate.push(`bio = $${paramIndex++}`);
      values.push(bio.trim());
    }
    if (research_fields !== undefined) {
      const rfArray = Array.isArray(research_fields)
        ? research_fields
        : typeof research_fields === 'string'
          ? research_fields.split(',').map((f: string) => f.trim()).filter(Boolean)
          : [];
      fieldsToUpdate.push(`research_fields = $${paramIndex++}`);
      values.push(rfArray);
    }
    if (avatar_url !== undefined && avatar_url.trim() !== '') {
      fieldsToUpdate.push(`avatar_url = $${paramIndex++}`);
      values.push(avatar_url.trim());
    }

    if (fieldsToUpdate.length === 0) {
      return res.status(400).json({ error: 'Không có thông tin nào để cập nhật.' });
    }

    values.push(targetUserId);
    const sql = `
      UPDATE users 
      SET ${fieldsToUpdate.join(', ')} 
      WHERE user_id = $${paramIndex}
      RETURNING user_id, name, email, role, institution, bio, research_fields, avatar_url, created_at
    `;

    const result = await query(sql, values);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng.' });
    }

    return res.json({ message: 'Cập nhật thông tin thành công', user: result.rows[0] });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};
