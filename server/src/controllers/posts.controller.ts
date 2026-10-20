import { Request, Response } from 'express';
import { query } from '../config/db';

export const getPosts = async (req: Request, res: Response) => {
  try {
    const currentUserId = req.headers['x-user-id'] ? parseInt(req.headers['x-user-id'] as string, 10) : 1;
    const { 
      group_id, 
      tag, 
      post_type, 
      search, 
      use_fts, 
      pagination_type = 'offset', // 'offset' or 'keyset'
      limit = '10', 
      page = '1',
      last_created_at,
      last_post_id
    } = req.query;

    const limitNum = Math.min(parseInt(limit as string, 10), 50);
    const pageNum = Math.max(parseInt(page as string, 10), 1);
    const offset = (pageNum - 1) * limitNum;

    let whereClauses: string[] = [];
    let params: any[] = [];
    let paramIndex = 1;

    // Filter by group
    if (group_id) {
      whereClauses.push(`p.group_id = $${paramIndex++}`);
      params.push(group_id);
    }

    // Filter by post_type
    if (post_type) {
      whereClauses.push(`p.post_type = $${paramIndex++}`);
      params.push(post_type);
    }

    // Filter by tag
    if (tag) {
      whereClauses.push(`EXISTS (
        SELECT 1 FROM post_tags pt 
        JOIN tags t ON t.tag_id = pt.tag_id 
        WHERE pt.post_id = p.post_id AND t.name = $${paramIndex++}
      )`);
      params.push(tag);
    }

    // Search: Full Text Search vs Regular ILIKE
    if (search) {
      if (use_fts === 'true') {
        // PostgreSQL Full Text Search
        whereClauses.push(`p.search_vector @@ plainto_tsquery('english', $${paramIndex++})`);
        params.push(search);
      } else {
        // Standard ILIKE
        whereClauses.push(`(p.title ILIKE $${paramIndex} OR p.content ILIKE $${paramIndex})`);
        params.push(`%${search}%`);
        paramIndex++;
      }
    }

    // Keyset pagination condition: (created_at, post_id) < ($last_created_at, $last_post_id)
    if (pagination_type === 'keyset' && last_created_at && last_post_id) {
      whereClauses.push(`(p.created_at, p.post_id) < ($${paramIndex++}, $${paramIndex++})`);
      params.push(last_created_at, last_post_id);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    let paginationSql = '';
    if (pagination_type === 'keyset') {
      paginationSql = `ORDER BY p.created_at DESC, p.post_id DESC LIMIT $${paramIndex++}`;
      params.push(limitNum);
    } else {
      paginationSql = `ORDER BY p.created_at DESC, p.post_id DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
      params.push(limitNum, offset);
    }

    const sql = `
      SELECT 
        p.post_id,
        p.author_id,
        p.group_id,
        p.post_type,
        p.title,
        p.content,
        p.created_at,
        u.name AS author_name,
        u.institution AS author_institution,
        u.avatar_url AS author_avatar,
        rg.name AS group_name,
        (SELECT COUNT(*) FROM post_likes WHERE post_id = p.post_id) AS likes_count,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.post_id) AS comments_count,
        EXISTS(SELECT 1 FROM post_likes WHERE post_id = p.post_id AND user_id = ${currentUserId}) AS is_liked,
        COALESCE(
          (SELECT json_agg(t.name) 
           FROM post_tags pt 
           JOIN tags t ON t.tag_id = pt.tag_id 
           WHERE pt.post_id = p.post_id), 
          '[]'::json
        ) AS tags
      FROM posts p
      JOIN users u ON u.user_id = p.author_id
      LEFT JOIN research_groups rg ON rg.group_id = p.group_id
      ${whereSql}
      ${paginationSql}
    `;

    const start = Date.now();
    const result = await query(sql, params);
    const duration = Date.now() - start;

    return res.json({
      paginationType: pagination_type,
      page: pageNum,
      limit: limitNum,
      returnedCount: result.rows.length,
      executionMs: duration,
      posts: result.rows
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const getPostById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const currentUserId = req.headers['x-user-id'] ? parseInt(req.headers['x-user-id'] as string, 10) : 1;

    const sql = `
      SELECT 
        p.post_id,
        p.author_id,
        p.group_id,
        p.post_type,
        p.title,
        p.content,
        p.created_at,
        u.name AS author_name,
        u.institution AS author_institution,
        u.avatar_url AS author_avatar,
        rg.name AS group_name,
        (SELECT COUNT(*) FROM post_likes WHERE post_id = p.post_id) AS likes_count,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.post_id) AS comments_count,
        EXISTS(SELECT 1 FROM post_likes WHERE post_id = p.post_id AND user_id = $2) AS is_liked,
        COALESCE(
          (SELECT json_agg(t.name) 
           FROM post_tags pt 
           JOIN tags t ON t.tag_id = pt.tag_id 
           WHERE pt.post_id = p.post_id), 
          '[]'::json
        ) AS tags
      FROM posts p
      JOIN users u ON u.user_id = p.author_id
      LEFT JOIN research_groups rg ON rg.group_id = p.group_id
      WHERE p.post_id = $1
    `;

    const result = await query(sql, [id, currentUserId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    return res.json({ post: result.rows[0] });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const createPost = async (req: Request, res: Response) => {
  try {
    const currentUserId = req.headers['x-user-id'] ? parseInt(req.headers['x-user-id'] as string, 10) : 1;
    const { title, content, post_type = 'discussion', group_id, tags = [] } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required.' });
    }

    const insertPostRes = await query(
      `INSERT INTO posts (author_id, group_id, post_type, title, content)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [currentUserId, group_id || null, post_type, title, content]
    );

    const post = insertPostRes.rows[0];

    // Associate tags
    if (Array.isArray(tags) && tags.length > 0) {
      for (const tagName of tags) {
        if (!tagName.trim()) continue;
        // Insert tag if not exists
        const tagRes = await query(
          `INSERT INTO tags (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING tag_id`,
          [tagName.trim()]
        );
        const tagId = tagRes.rows[0].tag_id;
        await query(
          `INSERT INTO post_tags (post_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [post.post_id, tagId]
        );
      }
    }

    return res.status(201).json({ post });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const toggleLike = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const currentUserId = req.headers['x-user-id'] ? parseInt(req.headers['x-user-id'] as string, 10) : 1;
    const postId = parseInt(id, 10);

    const check = await query(
      `SELECT 1 FROM post_likes WHERE post_id = $1 AND user_id = $2`,
      [postId, currentUserId]
    );

    if (check.rows.length > 0) {
      await query(`DELETE FROM post_likes WHERE post_id = $1 AND user_id = $2`, [postId, currentUserId]);
      return res.json({ liked: false });
    } else {
      await query(`INSERT INTO post_likes (post_id, user_id) VALUES ($1, $2)`, [postId, currentUserId]);
      return res.json({ liked: true });
    }
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const getTags = async (req: Request, res: Response) => {
  try {
    const result = await query(`
      SELECT t.tag_id, t.name, COUNT(pt.post_id) AS post_count
      FROM tags t
      LEFT JOIN post_tags pt ON pt.tag_id = t.tag_id
      GROUP BY t.tag_id, t.name
      ORDER BY post_count DESC, t.name ASC
    `);
    return res.json({ tags: result.rows });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};
