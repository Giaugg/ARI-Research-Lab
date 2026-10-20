import { Request, Response } from 'express';
import crypto from 'crypto';
import { query } from '../config/db';

export const getMe = async (req: Request, res: Response) => {
  try {
    const currentUserId = req.headers['x-user-id'] ? parseInt(req.headers['x-user-id'] as string, 10) : 1;
    const result = await query(
      `SELECT user_id, name, email, role, institution, bio, research_fields, avatar_url, created_at 
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
      `SELECT user_id, name, email, role, institution, bio, research_fields, avatar_url, created_at 
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

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const result = await query(
      `SELECT user_id, name, email, role, password_hash, institution, bio, research_fields, avatar_url, created_at 
       FROM users WHERE LOWER(email) = $1`,
      [cleanEmail]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy tài khoản với email này.' });
    }

    const user = result.rows[0];

    // Password verification:
    // If user has a set password and password is provided, check matching hash
    if (password && user.password_hash && user.password_hash !== 'hashed_pwd_default') {
      const inputHash = crypto.createHash('sha256').update(password).digest('hex');
      if (inputHash !== user.password_hash && password !== user.password_hash) {
        return res.status(401).json({ error: 'Mật khẩu không chính xác.' });
      }
    }

    // Return safe user object (omit password_hash)
    const { password_hash, ...safeUser } = user;
    return res.json({ message: 'Đăng nhập thành công', user: safeUser });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role = 'researcher', institution, bio, research_fields } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Họ tên và email là bắt buộc.' });
    }

    const validRoles = ['admin', 'pi', 'researcher', 'student'];
    const assignedRole = validRoles.includes(role) ? role : 'researcher';

    const cleanEmail = email.trim().toLowerCase();
    const existing = await query('SELECT user_id FROM users WHERE LOWER(email) = $1', [cleanEmail]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email này đã được đăng ký trong hệ thống.' });
    }

    const passwordHash = password
      ? crypto.createHash('sha256').update(password).digest('hex')
      : 'hashed_pwd_default';

    const avatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name.trim())}`;
    const result = await query(
      `INSERT INTO users (name, email, password_hash, role, institution, bio, research_fields, avatar_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING user_id, name, email, role, institution, bio, research_fields, avatar_url, created_at`,
      [
        name.trim(), 
        cleanEmail, 
        passwordHash, 
        assignedRole,
        institution || 'Independent Researcher', 
        bio || '', 
        Array.isArray(research_fields) ? research_fields : [], 
        avatar
      ]
    );
    return res.status(201).json({ message: 'Đăng ký tài khoản thành công', user: result.rows[0] });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};
