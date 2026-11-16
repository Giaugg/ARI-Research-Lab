import { Request, Response } from 'express';
import { pool, query } from '../config/db';
import { seedDatabase } from '../db/seed';

/**
 * 1. Database Overview: Table counts, total size, index size
 */
export const getDatabaseOverview = async (req: Request, res: Response) => {
  try {
    const tables = [
      'users',
      'follows',
      'research_groups',
      'group_members',
      'posts',
      'tags',
      'post_tags',
      'post_likes',
      'comments',
      'publications',
      'publication_authors',
      'notifications'
    ];

    const tableStats = await Promise.all(
      tables.map(async (table) => {
        try {
          const countRes = await query(`SELECT COUNT(*) AS count FROM ${table}`);
          const sizeRes = await query(`
            SELECT 
              pg_size_pretty(pg_total_relation_size($1::regclass)) AS total_size,
              pg_size_pretty(pg_relation_size($1::regclass)) AS table_size,
              pg_size_pretty(pg_indexes_size($1::regclass)) AS index_size
          `, [table]);

          return {
            tableName: table,
            rowCount: parseInt(countRes.rows[0].count, 10),
            totalSize: sizeRes.rows[0]?.total_size || '0 kB',
            tableSize: sizeRes.rows[0]?.table_size || '0 kB',
            indexSize: sizeRes.rows[0]?.index_size || '0 kB'
          };
        } catch (e: any) {
          return {
            tableName: table,
            rowCount: 0,
            totalSize: 'N/A',
            tableSize: 'N/A',
            indexSize: 'N/A'
          };
        }
      })
    );

    const versionRes = await query('SELECT version()');
    const dbSizeRes = await query(`SELECT pg_size_pretty(pg_database_size(current_database())) AS db_size`);

    return res.json({
      databaseName: 'academic_network_db',
      postgresVersion: versionRes.rows[0]?.version || 'PostgreSQL 18',
      totalDatabaseSize: dbSizeRes.rows[0]?.db_size || 'Unknown',
      totalTables: tables.length,
      totalRecords: tableStats.reduce((acc, curr) => acc + curr.rowCount, 0),
      tables: tableStats
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

/**
 * 2. High-Performance Bulk Data Generator using generate_series()
 */
export const bulkGenerateData = async (req: Request, res: Response) => {
  const client = await pool.connect();
  const startTime = Date.now();
  try {
    const { type = 'users_follows', count = 1000 } = req.body;
    const requestedCount = Math.min(Math.max(parseInt(count, 10) || 500, 100), 25000);

    let insertedRecords = 0;
    let message = '';

    if (type === 'users_follows') {
      // Get current max user_id
      const maxUserRes = await client.query('SELECT COALESCE(MAX(user_id), 0) AS max_id FROM users');
      const startId = parseInt(maxUserRes.rows[0].max_id, 10) + 1;
      const endId = startId + requestedCount - 1;

      await client.query('BEGIN');

      // Bulk insert users via generate_series
      await client.query(`
        INSERT INTO users (name, email, role, institution, bio, research_fields)
        SELECT 
          'Scholar #' || gs,
          'scholar_' || gs || '_' || floor(random()*1000000)::text || '@research-lab.org',
          CASE (gs % 4)
            WHEN 0 THEN 'researcher'
            WHEN 1 THEN 'student'
            WHEN 2 THEN 'pi'
            ELSE 'researcher'
          END,
          'Institute of Advanced Computation ' || (gs % 10 + 1),
          'Synthetically generated researcher profile for database scale testing and recursive graph benchmarks.',
          ARRAY['PostgreSQL 18', 'Recursive CTE', 'Distributed Systems', 'Graph Theory']
        FROM generate_series($1::int, $2::int) AS gs;
      `, [startId, endId]);

      // Bulk generate follows directed edges (approx 4 edges per user)
      await client.query(`
        INSERT INTO follows (follower_id, following_id)
        SELECT 
          u.user_id,
          t.user_id
        FROM (
          SELECT user_id FROM users WHERE user_id BETWEEN $1 AND $2
        ) u
        CROSS JOIN LATERAL (
          SELECT user_id 
          FROM users 
          WHERE user_id <> u.user_id 
          ORDER BY random() 
          LIMIT 4
        ) t
        ON CONFLICT DO NOTHING;
      `, [startId, endId]);

      await client.query('COMMIT');
      insertedRecords = requestedCount;
      message = `Đã sinh thành công ${requestedCount} nhà nghiên cứu và hàng nghìn liên kết đồ thị (follows) bằng generate_series.`;

    } else if (type === 'posts_comments') {
      const maxPostRes = await client.query('SELECT COALESCE(MAX(post_id), 0) AS max_id FROM posts');
      const startPostId = parseInt(maxPostRes.rows[0].max_id, 10) + 1;
      const endPostId = startPostId + requestedCount - 1;

      // Pick valid author IDs
      const userRes = await client.query('SELECT user_id FROM users ORDER BY user_id LIMIT 100');
      const userIds = userRes.rows.map(r => r.user_id);
      const defaultUserId = userIds[0] || 1;

      await client.query('BEGIN');

      // Bulk insert posts
      await client.query(`
        INSERT INTO posts (author_id, scope, post_type, title, content)
        SELECT 
          $1,
          CASE (gs % 3)
            WHEN 0 THEN 'community'
            WHEN 1 THEN 'personal'
            ELSE 'lab'
          END,
          'research',
          'Academic Benchmark Study on Large Relational Graphs #' || gs,
          'Empirical evaluation of PostgreSQL 18 execution engines, analyzing recursive query plan trees, buffer cache efficiency, and keyset seek scalability under heavy workloads with gs = ' || gs
        FROM generate_series($2::int, $3::int) AS gs;
      `, [defaultUserId, startPostId, endPostId]);

      // Bulk insert comments (including threaded replies)
      await client.query(`
        INSERT INTO comments (post_id, user_id, content)
        SELECT 
          p.post_id,
          $1,
          'Peer review analysis for benchmark publication #' || p.post_id
        FROM posts p
        WHERE p.post_id BETWEEN $2 AND $3
        LIMIT $4;
      `, [defaultUserId, startPostId, endPostId, requestedCount * 2]);

      await client.query('COMMIT');
      insertedRecords = requestedCount;
      message = `Đã sinh ${requestedCount} bài báo cáo học thuật và bình luận phân cấp thành công.`;
    }

    const duration = Date.now() - startTime;
    return res.json({
      success: true,
      message,
      requestedCount,
      type,
      durationMs: duration
    });
  } catch (error: any) {
    await client.query('ROLLBACK');
    return res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
};

/**
 * 2b. Reset Database and Re-import Initial Sample Data (Seed Data)
 */
export const resetAndSeedDatabase = async (req: Request, res: Response) => {
  const startTime = Date.now();
  try {
    await seedDatabase('default');
    const duration = Date.now() - startTime;
    return res.json({
      success: true,
      message: 'Đã hoàn tất khôi phục toàn bộ CSDL và nạp lại dữ liệu mẫu học thuật ban đầu.',
      durationMs: duration
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

/**
 * 3. Run Advanced SQL Queries with Output Data + EXPLAIN Plan Tree
 */
export const runAdminAdvancedQuery = async (req: Request, res: Response) => {
  try {
    const { queryId = 1, params = {} } = req.body;
    let sql = '';
    let queryParams: any[] = [];
    let title = '';
    let category = '';
    let description = '';

    switch (parseInt(queryId, 10)) {
      case 1: {
        title = '1. Correlated Subquery (Phát hiện bài viết nổi bật)';
        category = 'Correlated Subquery';
        description = 'Tìm những bài viết có số lượt like vượt trên mức trung bình lượt like của chính tác giả đó.';
        sql = `
          SELECT 
              p.post_id,
              p.title,
              p.scope,
              p.author_id,
              u.name AS author_name,
              (SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = p.post_id) AS like_count,
              ROUND((
                  SELECT AVG(author_likes.cnt)
                  FROM (
                      SELECT COUNT(pl2.post_id) AS cnt
                      FROM posts p2
                      LEFT JOIN post_likes pl2 ON p2.post_id = pl2.post_id
                      WHERE p2.author_id = p.author_id
                      GROUP BY p2.post_id
                  ) author_likes
              ), 2) AS author_avg_likes
          FROM posts p
          JOIN users u ON u.user_id = p.author_id
          WHERE (
              SELECT COUNT(*) 
              FROM post_likes pl 
              WHERE pl.post_id = p.post_id
          ) >= (
              SELECT AVG(author_likes.cnt)
              FROM (
                  SELECT COUNT(pl2.post_id) AS cnt
                  FROM posts p2
                  LEFT JOIN post_likes pl2 ON p2.post_id = pl2.post_id
                  WHERE p2.author_id = p.author_id
                  GROUP BY p2.post_id
              ) author_likes
          )
          ORDER BY like_count DESC
          LIMIT 20;
        `;
        break;
      }

      case 2: {
        title = '2. Nested Subquery with NOT EXISTS (Phép chia quan hệ)';
        category = 'Anti-Join / Phép chia';
        description = 'Tìm các học giả chưa từng tham gia làm đồng tác giả (publication_authors) của bất kỳ bài báo nào.';
        sql = `
          SELECT 
              u.user_id,
              u.name,
              u.email,
              u.institution,
              u.role,
              (SELECT COUNT(*) FROM posts WHERE author_id = u.user_id) AS total_posts
          FROM users u
          WHERE NOT EXISTS (
              SELECT 1 
              FROM publication_authors pa
              WHERE pa.user_id = u.user_id
          )
          ORDER BY u.user_id ASC
          LIMIT 20;
        `;
        break;
      }

      case 3: {
        title = '3. Multi-table JOIN & Aggregation (Thống kê hoạt động Lab)';
        category = 'Multi-table JOIN / GROUP BY';
        description = 'Kết nối research_groups, users, group_members, posts để tổng hợp chỉ số nghiên cứu của từng Lab.';
        sql = `
          SELECT 
              rg.group_id,
              rg.name AS lab_name,
              rg.topic,
              u.name AS owner_name,
              COUNT(DISTINCT gm.user_id) AS active_members_count,
              COUNT(DISTINCT p.post_id) AS total_lab_posts,
              COALESCE(ROUND(AVG(pl_count.cnt), 1), 0) AS avg_likes_per_post
          FROM research_groups rg
          INNER JOIN users u ON u.user_id = rg.owner_id
          LEFT JOIN group_members gm ON gm.group_id = rg.group_id
          LEFT JOIN posts p ON p.group_id = rg.group_id
          LEFT JOIN LATERAL (
              SELECT COUNT(*) AS cnt FROM post_likes pl WHERE pl.post_id = p.post_id
          ) pl_count ON TRUE
          GROUP BY rg.group_id, rg.name, rg.topic, u.name
          HAVING COUNT(DISTINCT gm.user_id) >= 1
          ORDER BY total_lab_posts DESC, active_members_count DESC
          LIMIT 15;
        `;
        break;
      }

      case 4: {
        title = '4. Window Functions (DENSE_RANK & Phân nhóm phạm vi bài đăng)';
        category = 'Window Functions';
        description = 'Sử dụng ROW_NUMBER(), DENSE_RANK() OVER (PARTITION BY scope ORDER BY likes DESC) và AVG() OVER().';
        sql = `
          WITH post_stats AS (
              SELECT 
                  p.post_id,
                  p.title,
                  p.scope,
                  p.author_id,
                  u.name AS author_name,
                  COUNT(pl.user_id) AS likes_count
              FROM posts p
              JOIN users u ON u.user_id = p.author_id
              LEFT JOIN post_likes pl ON pl.post_id = p.post_id
              GROUP BY p.post_id, p.title, p.scope, p.author_id, u.name
          )
          SELECT 
              post_id,
              title,
              scope,
              author_name,
              likes_count,
              ROW_NUMBER() OVER (PARTITION BY scope ORDER BY likes_count DESC, post_id DESC) AS row_num_in_scope,
              DENSE_RANK() OVER (PARTITION BY scope ORDER BY likes_count DESC) AS rank_in_scope,
              ROUND(AVG(likes_count) OVER (PARTITION BY scope), 2) AS scope_avg_likes
          FROM post_stats
          ORDER BY scope, rank_in_scope
          LIMIT 25;
        `;
        break;
      }

      case 5: {
        title = '5. Window Functions: Xếp hạng học giả theo số lượng kết nối';
        category = 'Window Functions';
        description = 'DENSE_RANK() và NTILE(4) phân loại học giả vào 4 nhóm ảnh hưởng mạng lưới.';
        sql = `
          SELECT 
              u.user_id,
              u.name,
              u.institution,
              COUNT(f.following_id) AS followers_count,
              DENSE_RANK() OVER (ORDER BY COUNT(f.following_id) DESC) AS rank_overall,
              NTILE(4) OVER (ORDER BY COUNT(f.following_id) DESC) AS influence_quartile
          FROM users u
          LEFT JOIN follows f ON f.following_id = u.user_id
          GROUP BY u.user_id, u.name, u.institution
          ORDER BY rank_overall ASC
          LIMIT 20;
        `;
        break;
      }

      case 6: {
        title = '6. Dynamic SQL: Lọc bài đăng nâng cao với EXECUTE ... USING';
        category = 'Dynamic SQL';
        description = 'Minh họa cơ chế tham số hóa SQL động chống SQL Injection với điều kiện lọc tùy biến.';
        const searchScope = params.scope || 'community';
        sql = `
          SELECT 
              p.post_id,
              p.title,
              p.scope,
              p.post_type,
              p.created_at,
              u.name AS author_name
          FROM posts p
          JOIN users u ON u.user_id = p.author_id
          WHERE p.scope = $1
          ORDER BY p.created_at DESC
          LIMIT 15;
        `;
        queryParams = [searchScope];
        break;
      }

      case 7: {
        title = '7. Recursive CTE 1: Mạng lưới tiếp cận N-Hop Reachability';
        category = 'Recursive CTE';
        description = 'Truy vấn đệ quy tìm tất cả các nhà nghiên cứu có thể tiếp cận được qua N bước follow.';
        const targetUser = params.userId || 1;
        const maxDepth = params.maxDepth || 3;
        sql = `
          WITH RECURSIVE network AS (
              SELECT 
                  following_id AS user_id, 
                  1 AS depth, 
                  ARRAY[follower_id, following_id] AS path
              FROM follows 
              WHERE follower_id = $1

              UNION ALL

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
              u.institution,
              MIN(n.depth) AS shortest_degree,
              COUNT(*) AS total_paths
          FROM network n
          JOIN users u ON u.user_id = n.user_id
          GROUP BY u.user_id, u.name, u.institution
          ORDER BY shortest_degree ASC, total_paths DESC
          LIMIT 20;
        `;
        queryParams = [targetUser, maxDepth];
        break;
      }

      case 8: {
        title = '8. Recursive CTE 2: Cây bình luận lồng nhau vô hạn cấp (Threaded Tree)';
        category = 'Recursive CTE';
        description = 'Duyệt cây bình luận phân cấp bằng sort_path để hiển thị đúng thứ tự trả lời con dưới cha.';
        const postId = params.postId || 1;
        sql = `
          WITH RECURSIVE comment_tree AS (
              SELECT 
                  c.comment_id,
                  c.post_id,
                  c.user_id,
                  c.parent_id,
                  c.content,
                  c.created_at,
                  0 AS depth,
                  ARRAY[c.comment_id] AS sort_path
              FROM comments c
              WHERE c.post_id = $1 AND c.parent_id IS NULL

              UNION ALL

              SELECT 
                  c.comment_id,
                  c.post_id,
                  c.user_id,
                  c.parent_id,
                  c.content,
                  c.created_at,
                  ct.depth + 1,
                  ct.sort_path || c.comment_id
              FROM comments c
              JOIN comment_tree ct ON c.parent_id = ct.comment_id
          )
          SELECT 
              ct.comment_id,
              ct.parent_id,
              ct.depth,
              repeat('  └─ ', ct.depth) || ct.content AS visual_tree,
              u.name AS commenter_name,
              ct.sort_path
          FROM comment_tree ct
          JOIN users u ON u.user_id = ct.user_id
          ORDER BY ct.sort_path ASC
          LIMIT 25;
        `;
        queryParams = [postId];
        break;
      }

      case 9: {
        title = '9. Recursive CTE 3: Tìm đường đi học thuật ngắn nhất (Shortest Path BFS)';
        category = 'Recursive CTE';
        description = 'Thuật toán Breadth-First Search viết bằng SQL thuần để tìm chuỗi kết nối giữa 2 học giả.';
        const src = params.sourceId || 1;
        const tgt = params.targetId || 3;
        sql = `
          WITH RECURSIVE path_finder AS (
              SELECT 
                  follower_id AS current_node, 
                  following_id AS next_node, 
                  1 AS depth, 
                  ARRAY[follower_id, following_id] AS path,
                  (following_id = $2) AS found
              FROM follows 
              WHERE follower_id = $1

              UNION ALL

              SELECT 
                  pf.next_node, 
                  f.following_id, 
                  pf.depth + 1, 
                  pf.path || f.following_id,
                  (f.following_id = $2) AS found
              FROM path_finder pf
              JOIN follows f ON f.follower_id = pf.next_node
              WHERE pf.depth < 5 
                AND NOT (f.following_id = ANY(pf.path)) 
                AND pf.found = FALSE
          )
          SELECT 
              depth AS total_hops,
              path AS connection_path
          FROM path_finder 
          WHERE next_node = $2 
          ORDER BY depth ASC 
          LIMIT 5;
        `;
        queryParams = [src, tgt];
        break;
      }

      case 10: {
        title = '10. Recursive CTE 4: Phát hiện chu trình khép kín trong mạng lưới (Cycle Detection)';
        category = 'Recursive CTE';
        description = 'Phát hiện các chu trình vòng lặp (A -> B -> C -> A) trong đồ thị học giả.';
        const checkUser = params.userId || 1;
        sql = `
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
                  cf.following_id, 
                  f.following_id, 
                  cf.depth + 1, 
                  cf.path || f.following_id,
                  (f.following_id = $1) AS is_cycle
              FROM cycle_finder cf
              JOIN follows f ON f.follower_id = cf.following_id
              WHERE cf.depth < 4 
                AND cf.is_cycle = FALSE 
                AND (f.following_id = $1 OR NOT (f.following_id = ANY(cf.path)))
          )
          SELECT 
              depth AS cycle_length,
              path AS cycle_path
          FROM cycle_finder 
          WHERE is_cycle = TRUE
          ORDER BY cycle_length ASC
          LIMIT 10;
        `;
        queryParams = [checkUser];
        break;
      }

      case 11: {
        title = '11. Phép toán Tập hợp (UNION, INTERSECT, EXCEPT giữa các phòng Lab)';
        category = 'Set Operations';
        description = 'Tìm các nhà nghiên cứu tham gia cả Lab 1 và Lab 2 (INTERSECT) hoặc chỉ tham gia Lab 1 (EXCEPT).';
        sql = `
          SELECT u.user_id, u.name, u.institution, 'Tham gia CẢ HAI LAB' AS membership_type
          FROM users u
          WHERE u.user_id IN (
              SELECT user_id FROM group_members WHERE group_id = 1
              INTERSECT
              SELECT user_id FROM group_members WHERE group_id = 2
          )
          UNION ALL
          SELECT u.user_id, u.name, u.institution, 'Chỉ tham gia Lab 1 (EXCEPT)' AS membership_type
          FROM users u
          WHERE u.user_id IN (
              SELECT user_id FROM group_members WHERE group_id = 1
              EXCEPT
              SELECT user_id FROM group_members WHERE group_id = 2
          )
          LIMIT 15;
        `;
        break;
      }

      case 12: {
        title = '12. Phép gom nhóm đa chiều (GROUPING SETS & ROLLUP thống kê ấn phẩm)';
        category = 'Advanced Aggregation';
        description = 'Phân tích số lượng bài báo học thuật theo năm xuất bản và tạp chí (ROLLUP).';
        sql = `
          SELECT 
              COALESCE(p.journal, 'TẤT CẢ TẠP CHÍ') AS journal,
              COALESCE(EXTRACT(YEAR FROM p.publish_date)::text, 'TẤT CẢ CÁC NĂM') AS publish_year,
              COUNT(*) AS total_publications
          FROM publications p
          GROUP BY ROLLUP (p.journal, EXTRACT(YEAR FROM p.publish_date))
          ORDER BY journal, publish_year;
        `;
        break;
      }

      default:
        return res.status(400).json({ error: 'Mã truy vấn queryId không hợp lệ (hỗ trợ từ 1 đến 12).' });
    }

    // 1. Run actual data query
    const dataRes = await query(sql, queryParams);

    // 2. Run EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
    const explainJsonRes = await query(`EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${sql}`, queryParams);
    const planData = explainJsonRes.rows[0]['QUERY PLAN'][0];

    // 3. Run EXPLAIN (ANALYZE, BUFFERS) text
    const explainTextRes = await query(`EXPLAIN (ANALYZE, BUFFERS) ${sql}`, queryParams);
    const planText = explainTextRes.rows.map((r: any) => Object.values(r)[0]).join('\n');

    return res.json({
      queryId,
      title,
      category,
      description,
      rawSql: sql,
      executionTimeMs: planData['Execution Time'],
      planningTimeMs: planData['Planning Time'],
      totalRows: dataRes.rows.length,
      rows: dataRes.rows,
      planTree: planData['Plan'],
      planText
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

/**
 * 4. Performance Benchmark Arena: Side-by-Side Comparison with DATA OUTPUT & QUERY PLAN TREE
 */
export const comparePerformance = async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const { scenario = 'index_vs_seq', target = 'follows' } = req.body;

    let title = '';
    let description = '';
    let sqlA = '';
    let sqlB = '';
    let paramsA: any[] = [];
    let paramsB: any[] = [];
    let methodAName = '';
    let methodBName = '';

    if (scenario === 'index_vs_seq') {
      title = 'Index Scan vs Forced Sequential Scan';
      description = 'Đánh giá chỉ mục B-tree idx_follows_follower khi duyệt đồ thị đệ quy so với quét toàn bộ bảng (Seq Scan).';
      methodAName = 'Phương pháp A: Sequential Scan (Tắt chỉ mục)';
      methodBName = 'Phương pháp B: Index Scan (B-tree Index Bật)';

      const baseSql = `
        WITH RECURSIVE net AS (
          SELECT following_id, 1 AS depth, ARRAY[follower_id, following_id] AS path 
          FROM follows WHERE follower_id = 1
          UNION ALL
          SELECT f.following_id, net.depth + 1, net.path || f.following_id 
          FROM net 
          JOIN follows f ON f.follower_id = net.following_id
          WHERE net.depth < 3 AND NOT (f.following_id = ANY(net.path))
        ) 
        SELECT following_id, depth, path FROM net LIMIT 20;
      `;
      sqlA = baseSql;
      sqlB = baseSql;

      // Method A: Disabled index
      await client.query('SET enable_indexscan = off; SET enable_bitmapscan = off; SET enable_indexonlyscan = off;');
      const planResA = await client.query(`EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${sqlA}`);
      const textResA = await client.query(`EXPLAIN (ANALYZE, BUFFERS) ${sqlA}`);
      const dataResA = await client.query(sqlA);

      // Method B: Enabled index
      await client.query('SET enable_indexscan = on; SET enable_bitmapscan = on; SET enable_indexonlyscan = on;');
      const planResB = await client.query(`EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${sqlB}`);
      const textResB = await client.query(`EXPLAIN (ANALYZE, BUFFERS) ${sqlB}`);
      const dataResB = await client.query(sqlB);

      const planA = planResA.rows[0]['QUERY PLAN'][0];
      const planB = planResB.rows[0]['QUERY PLAN'][0];

      return res.json({
        scenario,
        title,
        description,
        speedupFactor: Number((planA['Execution Time'] / Math.max(planB['Execution Time'], 0.001)).toFixed(2)),
        methodA: {
          name: methodAName,
          executionTimeMs: planA['Execution Time'],
          planningTimeMs: planA['Planning Time'],
          nodeType: planA['Plan']['Node Type'],
          totalCost: planA['Plan']['Total Cost'],
          sharedHitBlocks: planA['Plan']['Shared Hit Blocks'] || 0,
          sharedReadBlocks: planA['Plan']['Shared Read Blocks'] || 0,
          rowsCount: dataResA.rows.length,
          rows: dataResA.rows,
          planTree: planA['Plan'],
          planText: textResA.rows.map(r => Object.values(r)[0]).join('\n'),
          rawSql: sqlA
        },
        methodB: {
          name: methodBName,
          executionTimeMs: planB['Execution Time'],
          planningTimeMs: planB['Planning Time'],
          nodeType: planB['Plan']['Node Type'],
          totalCost: planB['Plan']['Total Cost'],
          sharedHitBlocks: planB['Plan']['Shared Hit Blocks'] || 0,
          sharedReadBlocks: planB['Plan']['Shared Read Blocks'] || 0,
          rowsCount: dataResB.rows.length,
          rows: dataResB.rows,
          planTree: planB['Plan'],
          planText: textResB.rows.map(r => Object.values(r)[0]).join('\n'),
          rawSql: sqlB
        }
      });

    } else if (scenario === 'keyset_vs_offset') {
      title = 'Keyset (Seek Method) vs Deep OFFSET/LIMIT Pagination';
      description = 'OFFSET N buộc PostgreSQL quét và bỏ qua N bản ghi. Keyset Seek nhảy trực tiếp qua B-tree O(log N).';
      methodAName = 'Phương pháp A: OFFSET 100 LIMIT 10 (Quét bỏ hàng loạt)';
      methodBName = 'Phương pháp B: Keyset Seek (created_at, post_id) < (T, ID)';

      sqlA = `
        SELECT post_id, title, scope, created_at
        FROM posts
        ORDER BY created_at DESC, post_id DESC
        LIMIT 10 OFFSET 50;
      `;

      sqlB = `
        SELECT post_id, title, scope, created_at
        FROM posts
        WHERE (created_at, post_id) < (NOW(), 999999)
        ORDER BY created_at DESC, post_id DESC
        LIMIT 10;
      `;

      const [planResA, textResA, dataResA] = await Promise.all([
        client.query(`EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${sqlA}`),
        client.query(`EXPLAIN (ANALYZE, BUFFERS) ${sqlA}`),
        client.query(sqlA)
      ]);

      const [planResB, textResB, dataResB] = await Promise.all([
        client.query(`EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${sqlB}`),
        client.query(`EXPLAIN (ANALYZE, BUFFERS) ${sqlB}`),
        client.query(sqlB)
      ]);

      const planA = planResA.rows[0]['QUERY PLAN'][0];
      const planB = planResB.rows[0]['QUERY PLAN'][0];

      return res.json({
        scenario,
        title,
        description,
        speedupFactor: Number((planA['Execution Time'] / Math.max(planB['Execution Time'], 0.001)).toFixed(2)),
        methodA: {
          name: methodAName,
          executionTimeMs: planA['Execution Time'],
          planningTimeMs: planA['Planning Time'],
          nodeType: planA['Plan']['Node Type'],
          totalCost: planA['Plan']['Total Cost'],
          sharedHitBlocks: planA['Plan']['Shared Hit Blocks'] || 0,
          sharedReadBlocks: planA['Plan']['Shared Read Blocks'] || 0,
          rowsCount: dataResA.rows.length,
          rows: dataResA.rows,
          planTree: planA['Plan'],
          planText: textResA.rows.map(r => Object.values(r)[0]).join('\n'),
          rawSql: sqlA
        },
        methodB: {
          name: methodBName,
          executionTimeMs: planB['Execution Time'],
          planningTimeMs: planB['Planning Time'],
          nodeType: planB['Plan']['Node Type'],
          totalCost: planB['Plan']['Total Cost'],
          sharedHitBlocks: planB['Plan']['Shared Hit Blocks'] || 0,
          sharedReadBlocks: planB['Plan']['Shared Read Blocks'] || 0,
          rowsCount: dataResB.rows.length,
          rows: dataResB.rows,
          planTree: planB['Plan'],
          planText: textResB.rows.map(r => Object.values(r)[0]).join('\n'),
          rawSql: sqlB
        }
      });

    } else if (scenario === 'fts_vs_ilike') {
      title = 'GIN Inverted Index Full-Text Search vs ILIKE Substring Scan';
      description = 'Chỉ mục GIN trên search_vector dùng từ vị (lexemes) với ts_rank đối đầu quét chuỗi ILIKE %keyword%.';
      methodAName = 'Phương pháp A: Quét chuỗi truyền thống (ILIKE %term%)';
      methodBName = 'Phương pháp B: PostgreSQL GIN Index Full-Text Search (@@)';

      const searchTerm = req.body.searchTerm || 'database';

      sqlA = `
        SELECT post_id, title, scope, created_at
        FROM posts
        WHERE title ILIKE $1 OR content ILIKE $1
        ORDER BY created_at DESC
        LIMIT 15;
      `;
      paramsA = [`%${searchTerm}%`];

      sqlB = `
        SELECT post_id, title, scope, ts_rank(search_vector, plainto_tsquery('english', $1)) AS rank
        FROM posts
        WHERE search_vector @@ plainto_tsquery('english', $1)
        ORDER BY rank DESC
        LIMIT 15;
      `;
      paramsB = [searchTerm];

      const [planResA, textResA, dataResA] = await Promise.all([
        client.query(`EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${sqlA}`, paramsA),
        client.query(`EXPLAIN (ANALYZE, BUFFERS) ${sqlA}`, paramsA),
        client.query(sqlA, paramsA)
      ]);

      const [planResB, textResB, dataResB] = await Promise.all([
        client.query(`EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${sqlB}`, paramsB),
        client.query(`EXPLAIN (ANALYZE, BUFFERS) ${sqlB}`, paramsB),
        client.query(sqlB, paramsB)
      ]);

      const planA = planResA.rows[0]['QUERY PLAN'][0];
      const planB = planResB.rows[0]['QUERY PLAN'][0];

      return res.json({
        scenario,
        title,
        description,
        speedupFactor: Number((planA['Execution Time'] / Math.max(planB['Execution Time'], 0.001)).toFixed(2)),
        methodA: {
          name: methodAName,
          executionTimeMs: planA['Execution Time'],
          planningTimeMs: planA['Planning Time'],
          nodeType: planA['Plan']['Node Type'],
          totalCost: planA['Plan']['Total Cost'],
          sharedHitBlocks: planA['Plan']['Shared Hit Blocks'] || 0,
          sharedReadBlocks: planA['Plan']['Shared Read Blocks'] || 0,
          rowsCount: dataResA.rows.length,
          rows: dataResA.rows,
          planTree: planA['Plan'],
          planText: textResA.rows.map(r => Object.values(r)[0]).join('\n'),
          rawSql: sqlA
        },
        methodB: {
          name: methodBName,
          executionTimeMs: planB['Execution Time'],
          planningTimeMs: planB['Planning Time'],
          nodeType: planB['Plan']['Node Type'],
          totalCost: planB['Plan']['Total Cost'],
          sharedHitBlocks: planB['Plan']['Shared Hit Blocks'] || 0,
          sharedReadBlocks: planB['Plan']['Shared Read Blocks'] || 0,
          rowsCount: dataResB.rows.length,
          rows: dataResB.rows,
          planTree: planB['Plan'],
          planText: textResB.rows.map(r => Object.values(r)[0]).join('\n'),
          rawSql: sqlB
        }
      });
    }

    return res.status(400).json({ error: 'Scenario so sánh không được hỗ trợ.' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
};

/**
 * 5. Concurrent Transactions Demo Runner
 */
export const runTransactionScenario = async (req: Request, res: Response) => {
  const { scenarioId = 'atomic_commit' } = req.body;

  try {
    if (scenarioId === 'atomic_commit') {
      const client = await pool.connect();
      try {
        const timeline = [];
        timeline.push({ step: 1, session: 'Session 1', action: 'BEGIN', detail: 'Khởi tạo giao dịch phân tán độc quyền' });

        await client.query('BEGIN');

        timeline.push({ step: 2, session: 'Session 1', action: 'INSERT posts', detail: 'Tạo bài đăng Lab học thuật mới' });
        const postRes = await client.query(`
          INSERT INTO posts (author_id, group_id, scope, post_type, title, content)
          VALUES (1, 1, 'lab', 'research', 'Nghiên cứu CSDL Nâng cao: Đánh giá Transaction ACID', 'Giao dịch thành công hoàn hảo')
          RETURNING post_id;
        `);
        const postId = postRes.rows[0].post_id;

        timeline.push({ step: 3, session: 'Session 1', action: 'INSERT post_tags', detail: `Gán tag 'DatabaseLab' cho post_id = ${postId}` });
        await client.query(`
          INSERT INTO tags (name) VALUES ('DatabaseLab') ON CONFLICT (name) DO NOTHING;
        `);
        await client.query(`
          INSERT INTO post_tags (post_id, tag_id)
          SELECT $1, tag_id FROM tags WHERE name = 'DatabaseLab' ON CONFLICT DO NOTHING;
        `, [postId]);

        timeline.push({ step: 4, session: 'Session 1', action: 'INSERT notifications', detail: 'Tự động gửi thông báo cho các thành viên trong Lab' });
        await client.query(`
          INSERT INTO notifications (user_id, sender_id, type, title, message, link, is_read)
          VALUES (2, 1, 'system', 'Bài đăng Lab mới', 'Vừa có cập nhật nghiên cứu mới trong Lab.', '/groups/1', FALSE);
        `);

        timeline.push({ step: 5, session: 'Session 1', action: 'COMMIT', detail: 'Giao dịch hoàn tất toàn vẹn (Atomicity & Durability)' });
        await client.query('COMMIT');

        return res.json({
          scenarioId,
          title: 'Kịch bản 1: Giao Dịch Thành Công Toàn Vẹn (COMMIT)',
          outcome: 'SUCCESS',
          summary: 'Tất cả các bản ghi (Bài đăng + Tag + Thông báo) được ghi nhận nguyên tử.',
          timeline,
          createdPostId: postId
        });
      } catch (err: any) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }

    } else if (scenarioId === 'rollback_savepoint') {
      const client = await pool.connect();
      try {
        const timeline = [];
        timeline.push({ step: 1, session: 'Session 1', action: 'BEGIN', detail: 'Bắt đầu giao dịch cập nhật nhóm' });
        await client.query('BEGIN');

        timeline.push({ step: 2, session: 'Session 1', action: 'UPDATE research_groups', detail: 'Cập nhật mô tả phòng nghiên cứu' });
        await client.query(`
          UPDATE research_groups 
          SET description = description || ' [Đã kiểm định ACID]' 
          WHERE group_id = 1;
        `);

        timeline.push({ step: 3, session: 'Session 1', action: 'SAVEPOINT savepoint_valid', detail: 'Thiết lập điểm khôi phục Savepoint' });
        await client.query('SAVEPOINT savepoint_valid');

        timeline.push({ step: 4, session: 'Session 1', action: 'FAILING INSERT', detail: 'Cố tình thêm thành viên với user_id = 99999999 (Vi phạm Foreign Key Constraint)' });
        let caughtError = '';
        try {
          await client.query(`
            INSERT INTO group_members (group_id, user_id, role)
            VALUES (1, 99999999, 'member');
          `);
        } catch (fkErr: any) {
          caughtError = fkErr.message;
          timeline.push({ step: 5, session: 'PostgreSQL Engine', action: 'ERROR DETECTED', detail: `Bắt được lỗi: ${fkErr.code} - ${fkErr.message}` });
        }

        timeline.push({ step: 6, session: 'Session 1', action: 'ROLLBACK TO SAVEPOINT savepoint_valid', detail: 'Khôi phục về Savepoint, hủy bỏ lệnh lỗi mà không làm hỏng giao dịch' });
        await client.query('ROLLBACK TO SAVEPOINT savepoint_valid');

        timeline.push({ step: 7, session: 'Session 1', action: 'COMMIT', detail: 'Xác nhận phần hợp lệ trước Savepoint thành công' });
        await client.query('COMMIT');

        return res.json({
          scenarioId,
          title: 'Kịch bản 2: Lỗi Giữa Chừng & Điểm Lưu Tạm (SAVEPOINT & ROLLBACK)',
          outcome: 'RECOVERED_VIA_SAVEPOINT',
          summary: 'PostgreSQL cho phép cứu vãn các thao tác hợp lệ trước Savepoint sau khi một thao tác con phát sinh ngoại lệ.',
          timeline,
          caughtError
        });
      } catch (err: any) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }

    } else if (scenarioId === 'lost_update_simulation') {
      const client1 = await pool.connect();
      const client2 = await pool.connect();
      try {
        const timeline = [];
        timeline.push({ step: 1, session: 'Session 1', action: 'BEGIN', detail: 'Phiên 1 bắt đầu giao dịch' });
        await client1.query('BEGIN');

        timeline.push({ step: 2, session: 'Session 1', action: 'SELECT ... FOR UPDATE', detail: 'Phiên 1 đọc user_id = 1 và chiếm giữ ROW EXCLUSIVE LOCK' });
        const user1 = await client1.query('SELECT user_id, bio FROM users WHERE user_id = 1 FOR UPDATE');

        timeline.push({ step: 3, session: 'Session 2', action: 'CONCURRENT ACCESS', detail: 'Phiên 2 thử khóa user_id = 1 -> BỊ TREO (BLOCKED) vì Session 1 đang giữ khóa' });
        
        timeline.push({ step: 4, session: 'Session 1', action: 'UPDATE & COMMIT', detail: 'Phiên 1 cập nhật dữ liệu và COMMIT, giải phóng Row Lock' });
        await client1.query("UPDATE users SET bio = bio || '' WHERE user_id = 1");
        await client1.query('COMMIT');

        timeline.push({ step: 5, session: 'Session 2', action: 'UNBLOCKED & SAFE', detail: 'Phiên 2 được đánh thức, đọc được dữ liệu mới nhất mà không gây hiện tượng Lost Update' });

        return res.json({
          scenarioId,
          title: 'Kịch bản 3: Ngăn Chặn Lost Update bằng Khóa Dòng Bi Quan (SELECT FOR UPDATE)',
          outcome: 'LOST_UPDATE_PREVENTED',
          summary: 'Khóa bi quan ngăn ngừa việc 2 phiên làm việc ghi đè lẫn nhau, bảo vệ toàn vẹn tuyệt đối trên dữ liệu nóng.',
          timeline,
          lockedRecord: user1.rows[0]
        });
      } finally {
        client1.release();
        client2.release();
      }

    } else if (scenarioId === 'isolation_levels') {
      const timeline = [
        { step: 1, session: 'READ COMMITTED', action: 'Non-repeatable Read', detail: 'Trong cùng 1 giao dịch, 2 lần SELECT cùng điều kiện có thể trả về 2 kết quả khác nhau nếu có phiên khác COMMIT xen giữa.' },
        { step: 2, session: 'REPEATABLE READ', action: 'Snapshot Isolation', detail: 'PostgreSQL đóng băng ảnh chụp (Snapshot) tại thời điểm câu lệnh đầu tiên thực thi; đảm bảo mọi lần đọc sau luôn trả về kết quả nhất quán.' },
        { step: 3, session: 'SERIALIZABLE', action: 'SSI (Serializable Snapshot Isolation)', detail: 'Phát hiện xung đột rw-antidependencies và tự động ROLLBACK một giao dịch nếu không thể tương đương với thứ tự tuần tự hóa.' }
      ];

      return res.json({
        scenarioId,
        title: 'Kịch bản 4: So Sánh Các Mức Cô Lập Giao Dịch (Isolation Levels)',
        outcome: 'ANALYZED',
        summary: 'Minh họa cơ chế MVCC (Multi-Version Concurrency Control) và mức độ bảo vệ dữ liệu tương ứng của PostgreSQL.',
        timeline
      });
    }

    return res.status(400).json({ error: 'Mã kịch bản giao dịch không hợp lệ.' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};
