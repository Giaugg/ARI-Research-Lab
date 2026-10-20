import { Request, Response } from 'express';
import { query } from '../config/db';

export const getMe = async (req: Request, res: Response) => {
  try {
    const currentUserId = req.headers['x-user-id'] ? parseInt(req.headers['x-user-id'] as string, 10) : 1;
    const result = await query(
      `SELECT user_id, name, email, institution, bio, research_fields, avatar_url, created_at 
       FROM users WHERE user_id = $1`,
      [currentUserId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.json({ user: result.rows[0] });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const switchUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const result = await query(
      `SELECT user_id, name, email, institution, bio, research_fields, avatar_url, created_at 
       FROM users WHERE user_id = $1`,
      [userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.json({ message: 'Switched active researcher', user: result.rows[0] });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, institution, bio, research_fields } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required.' });
    }
    const avatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`;
    const result = await query(
      `INSERT INTO users (name, email, institution, bio, research_fields, avatar_url)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, email, institution || 'Independent Researcher', bio || '', research_fields || [], avatar]
    );
    return res.status(201).json({ user: result.rows[0] });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};
