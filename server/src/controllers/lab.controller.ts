import { Request, Response } from 'express';
import { pool, query } from '../config/db';

export const runExplain = async (req: Request, res: Response) => {
  try {
    const { queryType, params = {} } = req.body;
    let sql = '';
    let queryParams: any[] = [];

    switch (queryType) {
      case 'reachability': {
        const userId = params.userId || 1;
        const maxDepth = params.maxDepth || 3;
        sql = `
          WITH RECURSIVE network AS (
            SELECT following_id AS user_id, 1 AS depth, ARRAY[follower_id, following_id] AS path
            FROM follows WHERE follower_id = $1
            UNION ALL
            SELECT f.following_id, n.depth + 1, n.path || f.following_id
            FROM network n
            JOIN follows f ON f.follower_id = n.user_id
            WHERE n.depth < $2 AND NOT (f.following_id = ANY(n.path))
          )
          SELECT u.name, MIN(n.depth) AS distance, COUNT(*) AS paths_count
          FROM network n
          JOIN users u ON u.user_id = n.user_id
          GROUP BY u.user_id, u.name
          ORDER BY distance ASC;
        `;
        queryParams = [userId, maxDepth];
        break;
      }

      case 'comment_tree': {
        const postId = params.postId || 1;
        sql = `
          WITH RECURSIVE comment_tree AS (
            SELECT comment_id, post_id, user_id, parent_id, content, 0 AS depth, ARRAY[comment_id] AS sort_path
            FROM comments WHERE post_id = $1 AND parent_id IS NULL
            UNION ALL
            SELECT c.comment_id, c.post_id, c.user_id, c.parent_id, c.content, ct.depth + 1, ct.sort_path || c.comment_id
            FROM comments c JOIN comment_tree ct ON c.parent_id = ct.comment_id
          )
          SELECT * FROM comment_tree ORDER BY sort_path ASC;
        `;
        queryParams = [postId];
        break;
      }

      case 'shortest_path': {
        const sourceId = params.sourceId || 1;
        const targetId = params.targetId || 3;
        sql = `
          WITH RECURSIVE path_finder AS (
            SELECT follower_id AS current_node, following_id AS next_node, 1 AS depth, ARRAY[follower_id, following_id] AS path, (following_id = $2) AS found
            FROM follows WHERE follower_id = $1
            UNION ALL
            SELECT f.follower_id, f.following_id, pf.depth + 1, pf.path || f.following_id, (f.following_id = $2) AS found
            FROM path_finder pf
            JOIN follows f ON f.follower_id = pf.next_node
            WHERE pf.depth < 5 AND NOT (f.following_id = ANY(pf.path)) AND pf.found = FALSE
          )
          SELECT depth, path FROM path_finder WHERE next_node = $2 ORDER BY depth ASC LIMIT 10;
        `;
        queryParams = [sourceId, targetId];
        break;
      }

      case 'recommendation': {
        const userId = params.userId || 1;
        sql = `
          WITH user_followings AS (SELECT following_id FROM follows WHERE follower_id = $1),
          user_groups AS (SELECT group_id FROM group_members WHERE user_id = $1),
          candidate_pool AS (
            SELECT f.following_id AS candidate_id, 1.5 AS weight, 'mutual_follow' AS reason
            FROM follows f
            WHERE f.follower_id IN (SELECT following_id FROM user_followings)
              AND f.following_id <> $1 AND f.following_id NOT IN (SELECT following_id FROM user_followings)
            UNION ALL
            SELECT gm.user_id AS candidate_id, 2.0 AS weight, 'shared_group' AS reason
            FROM group_members gm
            WHERE gm.group_id IN (SELECT group_id FROM user_groups)
              AND gm.user_id <> $1 AND gm.user_id NOT IN (SELECT following_id FROM user_followings)
          )
          SELECT u.user_id, u.name, SUM(cp.weight) AS score
          FROM candidate_pool cp
          JOIN users u ON u.user_id = cp.candidate_id
          GROUP BY u.user_id, u.name
          ORDER BY score DESC LIMIT 10;
        `;
        queryParams = [userId];
        break;
      }

      case 'cycle_detection': {
        const userId = params.userId || 1;
        sql = `
          WITH RECURSIVE cycle_finder AS (
            SELECT follower_id, following_id, 1 AS depth, ARRAY[follower_id, following_id] AS path, (following_id = $1) AS is_cycle
            FROM follows WHERE follower_id = $1
            UNION ALL
            SELECT f.follower_id, f.following_id, cf.depth + 1, cf.path || f.following_id, (f.following_id = $1) AS is_cycle
            FROM cycle_finder cf
            JOIN follows f ON f.follower_id = cf.following_id
            WHERE cf.depth < 4 AND cf.is_cycle = FALSE AND (f.following_id = $1 OR NOT (f.following_id = ANY(cf.path)))
          )
          SELECT depth, path FROM cycle_finder WHERE is_cycle = TRUE;
        `;
        queryParams = [userId];
        break;
      }

      default:
        return res.status(400).json({ error: 'Unknown queryType.' });
    }

    // 1. JSON format EXPLAIN
    const explainJsonSql = `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${sql}`;
    const jsonRes = await query(explainJsonSql, queryParams);

    // 2. Text format EXPLAIN
    const explainTextSql = `EXPLAIN (ANALYZE, BUFFERS) ${sql}`;
    const textRes = await query(explainTextSql, queryParams);
    const textOutput = textRes.rows.map((r: any) => Object.values(r)[0]).join('\n');

    const planData = jsonRes.rows[0]['QUERY PLAN'][0];

    return res.json({
      queryType,
      rawSql: sql,
      planningTimeMs: planData['Planning Time'],
      executionTimeMs: planData['Execution Time'],
      planTree: planData['Plan'],
      explainText: textOutput
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Benchmark: Index Scan vs Sequential Scan
 */
export const benchmarkIndexes = async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const { target = 'network' } = req.body;

    let testSql = '';
    let testParams: any[] = [];

    if (target === 'comments') {
      testSql = `
        WITH RECURSIVE ct AS (
          SELECT comment_id, post_id, parent_id, 0 AS depth FROM comments WHERE post_id = 1 AND parent_id IS NULL
          UNION ALL
          SELECT c.comment_id, c.post_id, c.parent_id, ct.depth + 1 FROM comments c JOIN ct ON c.parent_id = ct.comment_id
        ) SELECT * FROM ct;
      `;
      testParams = [];
    } else {
      testSql = `
        WITH RECURSIVE net AS (
          SELECT following_id, 1 AS depth, ARRAY[follower_id, following_id] AS path FROM follows WHERE follower_id = 1
          UNION ALL
          SELECT f.following_id, net.depth + 1, net.path || f.following_id FROM net JOIN follows f ON f.follower_id = net.following_id
          WHERE net.depth < 3 AND NOT (f.following_id = ANY(net.path))
        ) SELECT * FROM net;
      `;
      testParams = [];
    }

    // 1. With Index Scan Enabled
    await client.query('SET enable_indexscan = on; SET enable_bitmapscan = on; SET enable_indexonlyscan = on;');
    const withIndexRes = await client.query(`EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${testSql}`, testParams);
    const withIndexPlan = withIndexRes.rows[0]['QUERY PLAN'][0];

    // 2. Forced Sequential Scan (Disable Index Scan)
    await client.query('SET enable_indexscan = off; SET enable_bitmapscan = off; SET enable_indexonlyscan = off;');
    const noIndexRes = await client.query(`EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${testSql}`, testParams);
    const noIndexPlan = noIndexRes.rows[0]['QUERY PLAN'][0];

    // Reset settings
    await client.query('SET enable_indexscan = on; SET enable_bitmapscan = on; SET enable_indexonlyscan = on;');

    return res.json({
      target,
      withIndex: {
        planningTimeMs: withIndexPlan['Planning Time'],
        executionTimeMs: withIndexPlan['Execution Time'],
        nodeType: withIndexPlan['Plan']['Node Type'],
        sharedHitBlocks: withIndexPlan['Plan']['Shared Hit Blocks'] || 0,
        sharedReadBlocks: withIndexPlan['Plan']['Shared Read Blocks'] || 0
      },
      withoutIndex: {
        planningTimeMs: noIndexPlan['Planning Time'],
        executionTimeMs: noIndexPlan['Execution Time'],
        nodeType: noIndexPlan['Plan']['Node Type'],
        sharedHitBlocks: noIndexPlan['Plan']['Shared Hit Blocks'] || 0,
        sharedReadBlocks: noIndexPlan['Plan']['Shared Read Blocks'] || 0
      },
      speedupFactor: Number((noIndexPlan['Execution Time'] / Math.max(withIndexPlan['Execution Time'], 0.001)).toFixed(2))
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
};

/**
 * Benchmark: Keyset vs Offset Pagination
 */
export const benchmarkPagination = async (req: Request, res: Response) => {
  try {
    const offsetLimitSql = `
      EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
      SELECT post_id, title, created_at
      FROM posts
      ORDER BY created_at DESC, post_id DESC
      LIMIT 10 OFFSET 50;
    `;

    const keysetSql = `
      EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
      SELECT post_id, title, created_at
      FROM posts
      WHERE (created_at, post_id) < (NOW(), 999999)
      ORDER BY created_at DESC, post_id DESC
      LIMIT 10;
    `;

    const offsetRes = await query(offsetLimitSql);
    const keysetRes = await query(keysetSql);

    const offsetPlan = offsetRes.rows[0]['QUERY PLAN'][0];
    const keysetPlan = keysetRes.rows[0]['QUERY PLAN'][0];

    return res.json({
      offsetMethod: {
        name: 'OFFSET / LIMIT (Deep page)',
        executionTimeMs: offsetPlan['Execution Time'],
        planningTimeMs: offsetPlan['Planning Time'],
        nodeType: offsetPlan['Plan']['Node Type'],
        sharedHitBlocks: offsetPlan['Plan']['Shared Hit Blocks'] || 0
      },
      keysetMethod: {
        name: 'Keyset / Seek Method (B-tree Seek)',
        executionTimeMs: keysetPlan['Execution Time'],
        planningTimeMs: keysetPlan['Planning Time'],
        nodeType: keysetPlan['Plan']['Node Type'],
        sharedHitBlocks: keysetPlan['Plan']['Shared Hit Blocks'] || 0
      }
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Benchmark: Full-Text Search (GIN Index) vs ILIKE
 */
export const benchmarkSearch = async (req: Request, res: Response) => {
  try {
    const term = (req.query.term as string) || 'recursive';

    const ftsSql = `
      EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
      SELECT post_id, title, ts_rank(search_vector, plainto_tsquery('english', $1)) as rank
      FROM posts
      WHERE search_vector @@ plainto_tsquery('english', $1)
      ORDER BY rank DESC;
    `;

    const ilikeSql = `
      EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
      SELECT post_id, title
      FROM posts
      WHERE title ILIKE $1 OR content ILIKE $1;
    `;

    const ftsRes = await query(ftsSql, [term]);
    const ilikeRes = await query(ilikeSql, [`%${term}%`]);

    const ftsPlan = ftsRes.rows[0]['QUERY PLAN'][0];
    const ilikePlan = ilikeRes.rows[0]['QUERY PLAN'][0];

    return res.json({
      term,
      fullTextSearch: {
        name: 'PostgreSQL GIN Index Full-Text Search',
        executionTimeMs: ftsPlan['Execution Time'],
        planningTimeMs: ftsPlan['Planning Time'],
        nodeType: ftsPlan['Plan']['Node Type']
      },
      regularILike: {
        name: 'Traditional ILIKE (Sequential Scan)',
        executionTimeMs: ilikePlan['Execution Time'],
        planningTimeMs: ilikePlan['Planning Time'],
        nodeType: ilikePlan['Plan']['Node Type']
      }
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Scale Data Generator: Expand synthetic graph for real benchmark curves
 */
export const scaleData = async (req: Request, res: Response) => {
  try {
    const { count = 100 } = req.body;
    const client = await pool.connect();
    try {
      const currentCountRes = await client.query(`SELECT COUNT(*) FROM users`);
      const startIdx = parseInt(currentCountRes.rows[0].count, 10) + 1;
      const endIdx = startIdx + Math.min(count, 500);

      for (let i = startIdx; i < endIdx; i++) {
        await client.query(`
          INSERT INTO users (name, email, institution, bio, research_fields)
          VALUES (
            'Synthetic Scholar ' || $1,
            'scholar' || $1 || '@research-lab.org',
            'Institute of Advanced Computation ' || ($1 % 8 + 1),
            'Automated profile generated for PostgreSQL graph scaling benchmarks.',
            ARRAY['Database Optimization', 'PostgreSQL', 'Artificial Intelligence']
          )
        `, [i]);

        // Add 4-8 random follows edges
        const followCount = 4 + Math.floor(Math.random() * 5);
        for (let j = 0; j < followCount; j++) {
          const target = Math.max(1, Math.floor(Math.random() * endIdx));
          if (target !== i) {
            await client.query(`
              INSERT INTO follows (follower_id, following_id)
              VALUES ($1, $2)
              ON CONFLICT DO NOTHING
            `, [i, target]);
          }
        }
      }

      const totalUsers = await client.query(`SELECT COUNT(*) FROM users`);
      const totalFollows = await client.query(`SELECT COUNT(*) FROM follows`);

      return res.json({
        message: `Successfully scaled dataset with ${count} synthetic researchers and associated graph edges.`,
        currentStats: {
          totalUsers: parseInt(totalUsers.rows[0].count, 10),
          totalFollows: parseInt(totalFollows.rows[0].count, 10)
        }
      });
    } finally {
      client.release();
    }
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};
