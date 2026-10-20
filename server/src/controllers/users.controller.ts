import { Request, Response } from 'express';
import { query } from '../config/db';

export const getUsers = async (req: Request, res: Response) => {
  try {
    const currentUserId = req.headers['x-user-id'] ? parseInt(req.headers['x-user-id'] as string, 10) : 1;
    const { search } = req.query;

    let sql = `
      SELECT 
        u.user_id, u.name, u.email, u.institution, u.bio, u.research_fields, u.avatar_url,
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
