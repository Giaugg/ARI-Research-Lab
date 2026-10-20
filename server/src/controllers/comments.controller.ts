import { Request, Response } from 'express';
import { query } from '../config/db';

/**
 * Problem 3: Hierarchical Threaded Comments Tree Query
 * Orders replies directly under their respective parent branch
 */
export const getCommentsByPost = async (req: Request, res: Response) => {
  try {
    const postId = String(req.params.postId);

    const sql = `
      WITH RECURSIVE comment_tree AS (
        -- Anchor member: root comments
        SELECT 
          c.comment_id,
          c.post_id,
          c.user_id,
          c.parent_id,
          c.content,
          c.created_at,
          0 AS depth,
          ARRAY[c.comment_id] AS sort_path,
          c.comment_id AS root_comment_id
        FROM comments c
        WHERE c.post_id = $1 AND c.parent_id IS NULL

        UNION ALL

        -- Recursive member: replies
        SELECT 
          c.comment_id,
          c.post_id,
          c.user_id,
          c.parent_id,
          c.content,
          c.created_at,
          ct.depth + 1,
          ct.sort_path || c.comment_id,
          ct.root_comment_id
        FROM comments c
        JOIN comment_tree ct ON c.parent_id = ct.comment_id
      )
      SELECT 
        ct.comment_id,
        ct.post_id,
        ct.parent_id,
        ct.content,
        ct.depth,
        ct.created_at,
        ct.sort_path,
        u.user_id AS author_id,
        u.name AS author_name,
        u.avatar_url AS author_avatar,
        u.institution AS author_institution,
        (
          SELECT COUNT(*) 
          FROM comments child 
          WHERE child.parent_id = ct.comment_id
        ) AS direct_replies_count
      FROM comment_tree ct
      JOIN users u ON u.user_id = ct.user_id
      ORDER BY ct.sort_path ASC;
    `;

    const start = Date.now();
    const result = await query(sql, [postId]);
    const executionMs = Date.now() - start;

    return res.json({
      postId: parseInt(postId, 10),
      totalComments: result.rows.length,
      executionMs,
      comments: result.rows
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const createComment = async (req: Request, res: Response) => {
  try {
    const postId = String(req.params.postId);
    const currentUserId = req.headers['x-user-id'] ? parseInt(req.headers['x-user-id'] as string, 10) : 1;
    const { parent_id, content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Comment content cannot be empty.' });
    }

    // If parent_id is supplied, verify it exists and belongs to the same post
    if (parent_id) {
      const parentCheck = await query(
        `SELECT post_id FROM comments WHERE comment_id = $1`,
        [parent_id]
      );
      if (parentCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Parent comment not found.' });
      }
      if (parentCheck.rows[0].post_id !== parseInt(postId, 10)) {
        return res.status(400).json({ error: 'Parent comment belongs to a different post.' });
      }
    }

    const insertRes = await query(
      `INSERT INTO comments (post_id, user_id, parent_id, content)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [postId, currentUserId, parent_id || null, content.trim()]
    );

    const comment = insertRes.rows[0];
    const userRes = await query(`SELECT name, avatar_url, institution FROM users WHERE user_id = $1`, [currentUserId]);

    // Notify post author if not self
    const postRes = await query(`SELECT author_id, title FROM posts WHERE post_id = $1`, [postId]);
    if (postRes.rows.length > 0 && postRes.rows[0].author_id !== currentUserId) {
      const commenterName = userRes.rows[0]?.name || 'Một nhà nghiên cứu';
      await query(`
        INSERT INTO notifications (user_id, sender_id, type, title, message, link)
        VALUES ($1, $2, 'comment', 'Bình luận mới về bài viết', $3, $4)
      `, [postRes.rows[0].author_id, currentUserId, `${commenterName} đã bình luận bài viết: "${postRes.rows[0].title.slice(0, 60)}..."`, `/posts/${postId}`]);
    }

    return res.status(201).json({
      comment: {
        ...comment,
        author_id: currentUserId,
        author_name: userRes.rows[0].name,
        author_avatar: userRes.rows[0].avatar_url,
        author_institution: userRes.rows[0].institution
      }
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const deleteComment = async (req: Request, res: Response) => {
  try {
    const { commentId } = req.params;
    // ON DELETE CASCADE automatically removes child comments
    await query(`DELETE FROM comments WHERE comment_id = $1`, [commentId]);
    return res.json({ message: 'Comment and all child responses deleted.' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};
