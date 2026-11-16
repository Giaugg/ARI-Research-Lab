import { Request, Response } from 'express';
import { pool, query } from '../config/db';

export const getGroups = async (req: Request, res: Response) => {
  try {
    const currentUserId = req.headers['x-user-id'] ? parseInt(req.headers['x-user-id'] as string, 10) : 1;
    const { topic } = req.query;

    let sql = `
      SELECT 
        rg.group_id,
        rg.name,
        rg.topic,
        rg.description,
        rg.avatar_url,
        rg.created_at,
        u.name AS owner_name,
        u.institution AS owner_institution,
        (SELECT COUNT(*) FROM group_members WHERE group_id = rg.group_id) AS members_count,
        (SELECT COUNT(*) FROM posts WHERE group_id = rg.group_id) AS posts_count,
        EXISTS(SELECT 1 FROM group_members WHERE group_id = rg.group_id AND user_id = $1) AS is_member,
        (SELECT role FROM group_members WHERE group_id = rg.group_id AND user_id = $1) AS user_role
      FROM research_groups rg
      LEFT JOIN users u ON u.user_id = rg.owner_id
    `;

    const params: any[] = [currentUserId];
    if (topic) {
      sql += ` WHERE rg.topic ILIKE $2`;
      params.push(`%${topic}%`);
    }

    sql += ` ORDER BY members_count DESC, rg.name ASC`;

    const result = await query(sql, params);
    return res.json({ groups: result.rows });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const getGroupById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const currentUserId = req.headers['x-user-id'] ? parseInt(req.headers['x-user-id'] as string, 10) : 1;

    const groupRes = await query(
      `SELECT 
        rg.*,
        u.name AS owner_name,
        u.institution AS owner_institution,
        (SELECT COUNT(*) FROM group_members WHERE group_id = rg.group_id) AS members_count,
        (SELECT COUNT(*) FROM posts WHERE group_id = rg.group_id) AS posts_count,
        EXISTS(SELECT 1 FROM group_members WHERE group_id = rg.group_id AND user_id = $2) AS is_member,
        (SELECT role FROM group_members WHERE group_id = rg.group_id AND user_id = $2) AS user_role
       FROM research_groups rg
       LEFT JOIN users u ON u.user_id = rg.owner_id
       WHERE rg.group_id = $1`,
      [id, currentUserId]
    );

    if (groupRes.rows.length === 0) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Members list
    const membersRes = await query(
      `SELECT 
        u.user_id, u.name, u.institution, u.avatar_url, u.research_fields,
        gm.role, gm.joined_at
       FROM group_members gm
       JOIN users u ON u.user_id = gm.user_id
       WHERE gm.group_id = $1
       ORDER BY CASE WHEN gm.role = 'owner' THEN 1 WHEN gm.role = 'admin' THEN 2 ELSE 3 END, gm.joined_at ASC`,
      [id]
    );

    // Group posts
    const postsRes = await query(
      `SELECT 
        p.post_id, p.author_id, p.post_type, p.title, p.content, p.created_at,
        u.name AS author_name, u.avatar_url AS author_avatar,
        (SELECT COUNT(*) FROM post_likes WHERE post_id = p.post_id) AS likes_count,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.post_id) AS comments_count
       FROM posts p
       JOIN users u ON u.user_id = p.author_id
       WHERE p.group_id = $1
       ORDER BY p.created_at DESC`,
      [id]
    );

    return res.json({
      group: groupRes.rows[0],
      members: membersRes.rows,
      posts: postsRes.rows
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const createGroup = async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const currentUserId = req.headers['x-user-id'] ? parseInt(req.headers['x-user-id'] as string, 10) : 1;
    const { name, topic, description } = req.body;

    if (!name || !topic) {
      return res.status(400).json({ error: 'Group name and topic are required.' });
    }

    const avatar = `https://images.unsplash.com/photo-1518770660439-4636190af475?w=150&auto=format&fit=crop&q=80`;

    // Khởi tạo Transaction (Bảo đảm tính toàn vẹn giữa Tạo nhóm và Gán quyền Chủ nhiệm Lab)
    await client.query('BEGIN');

    const groupRes = await client.query(
      `INSERT INTO research_groups (name, topic, description, owner_id, avatar_url)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, topic, description || '', currentUserId, avatar]
    );

    const group = groupRes.rows[0];

    // Add owner to group_members trong cùng giao dịch
    await client.query(
      `INSERT INTO group_members (group_id, user_id, role)
       VALUES ($1, $2, 'owner')`,
      [group.group_id, currentUserId]
    );

    await client.query('COMMIT');

    return res.status(201).json({ group });
  } catch (error: any) {
    await client.query('ROLLBACK');
    return res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
};

export const toggleJoinGroup = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const currentUserId = req.headers['x-user-id'] ? parseInt(req.headers['x-user-id'] as string, 10) : 1;
    const groupId = parseInt(id, 10);

    const check = await query(
      `SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2`,
      [groupId, currentUserId]
    );

    if (check.rows.length > 0) {
      if (check.rows[0].role === 'owner') {
        return res.status(400).json({ error: 'Group owner cannot leave the group.' });
      }
      await query(`DELETE FROM group_members WHERE group_id = $1 AND user_id = $2`, [groupId, currentUserId]);
      return res.json({ joined: false, message: 'Left the research group.' });
    } else {
      await query(`INSERT INTO group_members (group_id, user_id, role) VALUES ($1, $2, 'member')`, [groupId, currentUserId]);
      return res.json({ joined: true, message: 'Joined research group as a member.' });
    }
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const getGroupByInviteCode = async (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    const currentUserId = req.headers['x-user-id'] ? parseInt(req.headers['x-user-id'] as string, 10) : 1;

    const groupRes = await query(
      `SELECT 
        rg.group_id, rg.name, rg.topic, rg.description, rg.avatar_url, rg.created_at, rg.invite_code,
        u.name AS owner_name, u.institution AS owner_institution,
        (SELECT COUNT(*) FROM group_members WHERE group_id = rg.group_id) AS members_count,
        EXISTS(SELECT 1 FROM group_members WHERE group_id = rg.group_id AND user_id = $2) AS is_member
       FROM research_groups rg
       LEFT JOIN users u ON u.user_id = rg.owner_id
       WHERE rg.invite_code = $1`,
      [code, currentUserId]
    );

    if (groupRes.rows.length === 0) {
      return res.status(404).json({ error: 'Mã liên kết phòng Lab không hợp lệ hoặc đã hết hạn.' });
    }

    return res.json({ group: groupRes.rows[0] });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const joinGroupByLink = async (req: Request, res: Response) => {
  try {
    const currentUserId = req.headers['x-user-id'] ? parseInt(req.headers['x-user-id'] as string, 10) : 1;
    const { invite_code } = req.body;

    if (!invite_code) {
      return res.status(400).json({ error: 'Mã mời tham gia là bắt buộc.' });
    }

    const groupRes = await query(`SELECT group_id, name FROM research_groups WHERE invite_code = $1`, [invite_code]);
    if (groupRes.rows.length === 0) {
      return res.status(404).json({ error: 'Mã liên kết phòng Lab không tồn tại.' });
    }

    const group = groupRes.rows[0];

    // Check membership
    const memberCheck = await query(
      `SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2`,
      [group.group_id, currentUserId]
    );

    if (memberCheck.rows.length > 0) {
      return res.json({ 
        message: 'Bạn đã là thành viên của phòng nghiên cứu này rồi.', 
        group_id: group.group_id,
        already_member: true 
      });
    }

    // Join
    await query(
      `INSERT INTO group_members (group_id, user_id, role) VALUES ($1, $2, 'member')`,
      [group.group_id, currentUserId]
    );

    return res.json({ 
      message: `Chào mừng bạn đã gia nhập phòng nghiên cứu "${group.name}"!`, 
      group_id: group.group_id,
      already_member: false 
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const inviteUserToGroup = async (req: Request, res: Response) => {
  try {
    const currentUserId = req.headers['x-user-id'] ? parseInt(req.headers['x-user-id'] as string, 10) : 1;
    const { id } = req.params;
    const groupId = parseInt(id as string, 10);
    const { target_user_id } = req.body;

    if (!target_user_id) {
      return res.status(400).json({ error: 'Target user ID is required.' });
    }

    const groupRes = await query(`SELECT name FROM research_groups WHERE group_id = $1`, [groupId]);
    if (groupRes.rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy phòng Lab.' });
    }
    const groupName = groupRes.rows[0].name;

    const senderRes = await query(`SELECT name FROM users WHERE user_id = $1`, [currentUserId]);
    const senderName = senderRes.rows[0]?.name || 'Một nhà nghiên cứu';

    // Check if already member
    const memberCheck = await query(`SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2`, [groupId, target_user_id]);
    if (memberCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Nhà nghiên cứu này đã là thành viên phòng Lab rồi.' });
    }

    // Send notification
    await query(`
      INSERT INTO notifications (user_id, sender_id, type, title, message, link)
      VALUES ($1, $2, 'lab_invite', 'Lời mời tham gia phòng Lab', $3, $4)
    `, [target_user_id, currentUserId, `${senderName} đã gửi lời mời bạn tham gia phòng nghiên cứu "${groupName}".`, `/groups/${groupId}`]);

    return res.json({ message: 'Đã gửi lời mời tham gia phòng Lab thành công.' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};
