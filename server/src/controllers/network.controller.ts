import { Request, Response } from 'express';
import { query } from '../config/db';

/**
 * Returns complete network topology (nodes & edges) for interactive graph visualization
 */
export const getNetworkGraph = async (req: Request, res: Response) => {
  try {
    const nodesRes = await query(`
      SELECT 
        u.user_id AS id, 
        u.name AS label, 
        u.institution,
        u.avatar_url,
        u.research_fields,
        (SELECT COUNT(*) FROM follows WHERE follower_id = u.user_id) AS out_degree,
        (SELECT COUNT(*) FROM follows WHERE following_id = u.user_id) AS in_degree
      FROM users u
      ORDER BY u.user_id ASC
      LIMIT 100
    `);

    const edgesRes = await query(`
      SELECT 
        f.follower_id AS source, 
        f.following_id AS target,
        f.created_at
      FROM follows f
      JOIN users u1 ON u1.user_id = f.follower_id
      JOIN users u2 ON u2.user_id = f.following_id
      LIMIT 300
    `);

    return res.json({
      nodes: nodesRes.rows,
      edges: edgesRes.rows
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Problem 1: N-Hop Follower Reachability using WITH RECURSIVE
 */
export const getReachability = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(String(req.params.userId), 10);
    const maxDepth = Math.min(parseInt((req.query.maxDepth as string) || '3', 10), 6);

    const sql = `
      WITH RECURSIVE network AS (
        -- Anchor: direct followings (depth = 1)
        SELECT 
          following_id AS user_id, 
          1 AS depth, 
          ARRAY[follower_id, following_id] AS path
        FROM follows 
        WHERE follower_id = $1

        UNION ALL

        -- Recursive step: traverse next hop
        SELECT 
          f.following_id, 
          n.depth + 1, 
          n.path || f.following_id
        FROM network n
        JOIN follows f ON f.follower_id = n.user_id
        WHERE n.depth < $2 
          AND NOT (f.following_id = ANY(n.path))
      )
      SELECT 
        u.user_id,
        u.name,
        u.email,
        u.institution,
        u.research_fields,
        u.avatar_url,
        MIN(n.depth) AS distance,
        COUNT(n.path) AS total_paths_count,
        json_agg(n.path) AS sample_paths
      FROM network n
      JOIN users u ON u.user_id = n.user_id
      GROUP BY u.user_id, u.name, u.email, u.institution, u.research_fields, u.avatar_url
      ORDER BY distance ASC, u.name ASC;
    `;

    const start = Date.now();
    const result = await query(sql, [userId, maxDepth]);
    const executionMs = Date.now() - start;

    return res.json({
      startUserId: userId,
      maxDepth,
      reachableNodesCount: result.rows.length,
      executionMs,
      results: result.rows
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Problem 2: Shortest Path & All Paths Between Two Researchers
 */
export const findPathBetweenResearchers = async (req: Request, res: Response) => {
  try {
    const sourceId = parseInt(req.query.sourceId as string, 10);
    const targetId = parseInt(req.query.targetId as string, 10);
    const maxDepth = Math.min(parseInt((req.query.maxDepth as string) || '5', 10), 6);

    if (!sourceId || !targetId) {
      return res.status(400).json({ error: 'sourceId and targetId query parameters are required.' });
    }

    if (sourceId === targetId) {
      return res.status(400).json({ error: 'Source and target cannot be the same researcher.' });
    }

    const sql = `
      WITH RECURSIVE path_finder AS (
        -- Anchor
        SELECT 
          follower_id AS current_node,
          following_id AS next_node,
          1 AS depth,
          ARRAY[follower_id, following_id] AS path,
          (following_id = $2) AS found
        FROM follows
        WHERE follower_id = $1

        UNION ALL

        -- Recursive step
        SELECT 
          f.follower_id,
          f.following_id,
          pf.depth + 1,
          pf.path || f.following_id,
          (f.following_id = $2) AS found
        FROM path_finder pf
        JOIN follows f ON f.follower_id = pf.next_node
        WHERE pf.depth < $3
          AND NOT (f.following_id = ANY(pf.path))
          AND pf.found = FALSE
      )
      SELECT 
        depth AS distance,
        path,
        (
          SELECT json_agg(json_build_object(
            'user_id', u.user_id, 
            'name', u.name, 
            'institution', u.institution,
            'avatar_url', u.avatar_url
          ))
          FROM unnest(path) WITH ORDINALITY AS p(uid, ord)
          JOIN users u ON u.user_id = p.uid
        ) AS path_nodes
      FROM path_finder
      WHERE next_node = $2
      ORDER BY depth ASC
      LIMIT 10;
    `;

    const start = Date.now();
    const result = await query(sql, [sourceId, targetId, maxDepth]);
    const executionMs = Date.now() - start;

    return res.json({
      sourceId,
      targetId,
      maxDepth,
      pathsFound: result.rows.length,
      shortestDistance: result.rows.length > 0 ? result.rows[0].distance : null,
      executionMs,
      paths: result.rows
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Problem 4: Academic Collaborative Recommendation
 */
export const getRecommendations = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(String(req.params.userId), 10);
    const limit = parseInt((req.query.limit as string) || '10', 10);

    const sql = `
      WITH user_followings AS (
        SELECT following_id FROM follows WHERE follower_id = $1
      ),
      user_groups AS (
        SELECT group_id FROM group_members WHERE user_id = $1
      ),
      user_fields AS (
        SELECT unnest(research_fields) AS field FROM users WHERE user_id = $1
      ),
      candidate_pool AS (
        -- 1. Candidates followed by people I follow (2-hop friends-of-friends)
        SELECT 
          f.following_id AS candidate_id,
          1.5 AS weight,
          'mutual_follow' AS reason
        FROM follows f
        WHERE f.follower_id IN (SELECT following_id FROM user_followings)
          AND f.following_id <> $1
          AND f.following_id NOT IN (SELECT following_id FROM user_followings)

        UNION ALL

        -- 2. Candidates in the same research group
        SELECT 
          gm.user_id AS candidate_id,
          2.0 AS weight,
          'shared_group' AS reason
        FROM group_members gm
        WHERE gm.group_id IN (SELECT group_id FROM user_groups)
          AND gm.user_id <> $1
          AND gm.user_id NOT IN (SELECT following_id FROM user_followings)

        UNION ALL

        -- 3. Candidates sharing research fields
        SELECT 
          u.user_id AS candidate_id,
          1.0 AS weight,
          'shared_topic' AS reason
        FROM users u, unnest(u.research_fields) f
        WHERE f IN (SELECT field FROM user_fields)
          AND u.user_id <> $1
          AND u.user_id NOT IN (SELECT following_id FROM user_followings)
      )
      SELECT 
        u.user_id,
        u.name,
        u.institution,
        u.avatar_url,
        u.research_fields,
        ROUND(SUM(cp.weight)::numeric, 2) AS recommendation_score,
        COUNT(DISTINCT CASE WHEN cp.reason = 'mutual_follow' THEN 1 END) AS mutual_connections_count,
        COUNT(DISTINCT CASE WHEN cp.reason = 'shared_group' THEN 1 END) AS shared_groups_count,
        COUNT(DISTINCT CASE WHEN cp.reason = 'shared_topic' THEN 1 END) AS shared_fields_count
      FROM candidate_pool cp
      JOIN users u ON u.user_id = cp.candidate_id
      GROUP BY u.user_id, u.name, u.institution, u.avatar_url, u.research_fields
      ORDER BY recommendation_score DESC, mutual_connections_count DESC
      LIMIT $2;
    `;

    const result = await query(sql, [userId, limit]);
    return res.json({ recommendations: result.rows });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Problem 5: Cycle Detection in Academic Follows Graph
 */
export const detectCycles = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(String(req.params.userId), 10);
    const maxDepth = Math.min(parseInt((req.query.maxDepth as string) || '4', 10), 5);

    const sql = `
      WITH RECURSIVE cycle_finder AS (
        SELECT 
          follower_id,
          following_id,
          1 AS depth,
          ARRAY[follower_id, following_id] AS path,
          (following_id = $1) AS is_cycle
        FROM follows
        WHERE follower_id = $1

        UNION ALL

        SELECT 
          f.follower_id,
          f.following_id,
          cf.depth + 1,
          cf.path || f.following_id,
          (f.following_id = $1) AS is_cycle
        FROM cycle_finder cf
        JOIN follows f ON f.follower_id = cf.following_id
        WHERE cf.depth < $2
          AND cf.is_cycle = FALSE
          AND (f.following_id = $1 OR NOT (f.following_id = ANY(cf.path)))
      )
      SELECT 
        depth AS cycle_length,
        path,
        (
          SELECT json_agg(json_build_object('user_id', u.user_id, 'name', u.name))
          FROM unnest(path) WITH ORDINALITY AS p(uid, ord)
          JOIN users u ON u.user_id = p.uid
        ) AS cycle_members
      FROM cycle_finder
      WHERE is_cycle = TRUE AND depth > 1
      ORDER BY depth ASC
      LIMIT 20;
    `;

    const result = await query(sql, [userId, maxDepth]);
    return res.json({
      startUserId: userId,
      cyclesFound: result.rows.length,
      cycles: result.rows
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Community Detection: Pairs of researchers sharing the most research groups
 */
export const getCommunityClusters = async (req: Request, res: Response) => {
  try {
    const sql = `
      SELECT 
        gm1.user_id AS researcher_1_id,
        u1.name AS researcher_1_name,
        gm2.user_id AS researcher_2_id,
        u2.name AS researcher_2_name,
        COUNT(DISTINCT gm1.group_id) AS shared_group_count,
        json_agg(rg.name) AS shared_groups
      FROM group_members gm1
      JOIN group_members gm2 ON gm1.group_id = gm2.group_id AND gm1.user_id < gm2.user_id
      JOIN users u1 ON u1.user_id = gm1.user_id
      JOIN users u2 ON u2.user_id = gm2.user_id
      JOIN research_groups rg ON rg.group_id = gm1.group_id
      GROUP BY gm1.user_id, u1.name, gm2.user_id, u2.name
      HAVING COUNT(DISTINCT gm1.group_id) >= 1
      ORDER BY shared_group_count DESC, u1.name ASC
      LIMIT 15;
    `;
    const result = await query(sql);
    return res.json({ communities: result.rows });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};
