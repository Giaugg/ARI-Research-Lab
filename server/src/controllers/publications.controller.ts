import { Request, Response } from 'express';
import { query } from '../config/db';

export const getPublications = async (req: Request, res: Response) => {
  try {
    const { search } = req.query;

    let sql = `
      SELECT 
        p.publication_id,
        p.title,
        p.doi,
        p.venue,
        p.abstract,
        p.published_at,
        p.created_at,
        COALESCE(
          (SELECT json_agg(
            json_build_object(
              'user_id', u.user_id,
              'name', u.name,
              'institution', u.institution,
              'avatar_url', u.avatar_url,
              'author_order', pa.author_order
            ) ORDER BY pa.author_order ASC
          )
          FROM publication_authors pa
          JOIN users u ON u.user_id = pa.user_id
          WHERE pa.publication_id = p.publication_id),
          '[]'::json
        ) AS authors
      FROM publications p
    `;

    const params: any[] = [];
    if (search) {
      sql += ` WHERE p.title ILIKE $1 OR p.venue ILIKE $1 OR p.abstract ILIKE $1`;
      params.push(`%${search}%`);
    }

    sql += ` ORDER BY p.published_at DESC`;

    const result = await query(sql, params);
    return res.json({ publications: result.rows });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Co-authorship network: Returns edges between researchers who published together
 */
export const getCoauthorshipGraph = async (req: Request, res: Response) => {
  try {
    const sql = `
      SELECT 
        pa1.user_id AS researcher_1_id,
        u1.name AS researcher_1_name,
        pa2.user_id AS researcher_2_id,
        u2.name AS researcher_2_name,
        COUNT(DISTINCT pa1.publication_id) AS coauthor_count,
        json_agg(p.title) AS joint_publications
      FROM publication_authors pa1
      JOIN publication_authors pa2 
        ON pa1.publication_id = pa2.publication_id 
       AND pa1.user_id < pa2.user_id
      JOIN users u1 ON u1.user_id = pa1.user_id
      JOIN users u2 ON u2.user_id = pa2.user_id
      JOIN publications p ON p.publication_id = pa1.publication_id
      GROUP BY pa1.user_id, u1.name, pa2.user_id, u2.name
      ORDER BY coauthor_count DESC;
    `;
    const result = await query(sql);
    return res.json({ coauthorships: result.rows });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};
