-- ==============================================================================
-- BỘ TRUY VẤN SQL NÂNG CAO & NGHIỆP VỤ HỌC THUẬT (ARI RESEARCH LAB)
-- Hệ Quản Trị Cơ Sở Dữ Liệu: PostgreSQL 18+
-- ==============================================================================
-- Bao gồm 12 mục nghiệp vụ nâng cao đáp ứng chuẩn đầu ra môn học:
-- 1. Correlated Subquery (Truy vấn con tương quan)
-- 2. Nested Subquery with NOT EXISTS (Truy vấn lồng kiểm tra tồn tại / Phép chia)
-- 3. Multi-table JOIN (INNER, LEFT, FULL OUTER JOIN)
-- 4. Aggregations & Window Functions (ROW_NUMBER, DENSE_RANK, PARTITION BY)
-- 5. Business Constraints & Domain Rules (CHECK, FOREIGN KEYS ON DELETE CASCADE)
-- 6. Stored Procedure & Function với PL/pgSQL
-- 7. Dynamic SQL (Thực thi truy vấn động phòng chống SQL Injection)
-- 8. Recursive SQL 1: Cây thảo luận phân cấp vô hạn bậc (Threaded Comments)
-- 9. Recursive SQL 2: Mạng lưới tiếp cận đa bước N-Hop Reachability
-- 10. Recursive SQL 3: Tìm đường đi học thuật ngắn nhất (Shortest Path BFS)
-- 11. Recursive SQL 4: Phát hiện chu trình khép kín trong đồ thị (Cycle Detection)
-- 12. Embedded SQL / Client API Interface (Minh họa tầng nhúng TypeScript / pg)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. CORRELATED SUBQUERY (Truy vấn con tương quan)
-- Nghiệp vụ: Tìm những bài viết có số lượt like vượt trên mức trung bình lượt like
-- của chính tác giả đó. Giúp phát hiện các bài viết nổi bật (outlier) của từng học giả.
-- ------------------------------------------------------------------------------
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
) > (
    SELECT AVG(author_likes.cnt)
    FROM (
        SELECT COUNT(pl2.post_id) AS cnt
        FROM posts p2
        LEFT JOIN post_likes pl2 ON p2.post_id = pl2.post_id
        WHERE p2.author_id = p.author_id
        GROUP BY p2.post_id
    ) author_likes
)
ORDER BY like_count DESC;


-- ------------------------------------------------------------------------------
-- 2. NESTED SUBQUERY VỚI NOT EXISTS (Mô phỏng phép chia quan hệ - Phép lượng từ phổ dụng ∀)
-- Nghiệp vụ: Tìm các nhà nghiên cứu đã tham gia vào TẤT CẢ các nhóm nghiên cứu (Lab)
-- do Giáo sư đầu ngành (PI - Principal Investigator) làm chủ nhiệm (owner).
-- ------------------------------------------------------------------------------
SELECT u.user_id, u.name, u.email, u.institution, u.role
FROM users u
WHERE u.role IN ('researcher', 'student')
  AND NOT EXISTS (
      -- Tập các nhóm do PI sở hữu mà người này CHƯA tham gia
      SELECT rg.group_id
      FROM research_groups rg
      JOIN users owner ON rg.owner_id = owner.user_id
      WHERE owner.role = 'pi'
        AND NOT EXISTS (
            SELECT 1 
            FROM group_members gm
            WHERE gm.group_id = rg.group_id
              AND gm.user_id = u.user_id
        )
  );


-- ------------------------------------------------------------------------------
-- 3. PHÉP KẾT ĐA BẢNG (MULTI-TABLE JOIN: INNER, LEFT, FULL OUTER JOIN)
-- Nghiệp vụ: Báo cáo tổng hợp hoạt động nghiên cứu của toàn bộ nhân sự trong viện.
-- Thống kê số bài viết, số nhóm tham gia, số bài báo công bố và số người theo dõi,
-- bảo toàn cả những học giả mới đăng ký chưa có bất kỳ bài đăng nào.
-- ------------------------------------------------------------------------------
SELECT 
    u.user_id,
    u.name,
    u.institution,
    u.role,
    COUNT(DISTINCT p.post_id) AS total_posts,
    COUNT(DISTINCT gm.group_id) AS total_groups_joined,
    COUNT(DISTINCT pa.publication_id) AS total_publications,
    COUNT(DISTINCT f.follower_id) AS total_followers
FROM users u
LEFT JOIN posts p ON p.author_id = u.user_id
LEFT JOIN group_members gm ON gm.user_id = u.user_id
LEFT JOIN publication_authors pa ON pa.user_id = u.user_id
LEFT JOIN follows f ON f.following_id = u.user_id
GROUP BY u.user_id, u.name, u.institution, u.role
ORDER BY total_publications DESC, total_posts DESC;


-- ------------------------------------------------------------------------------
-- 4. KẾT GỘP NÂNG CAO VÀ HÀM CỬA SỔ (AGGREGATION & WINDOW FUNCTIONS)
-- Nghiệp vụ: Phân hạng (Ranking) top bài viết nhận được nhiều bình luận nhất
-- trong từng phạm vi đăng tải ('community', 'personal', 'lab') bằng DENSE_RANK()
-- và ROW_NUMBER() để hiển thị lên bảng tin Top Trending của từng chuyên mục.
-- ------------------------------------------------------------------------------
WITH post_comment_stats AS (
    SELECT 
        p.post_id,
        p.title,
        p.scope,
        p.created_at,
        u.name AS author_name,
        COUNT(c.comment_id) AS comment_count,
        COUNT(DISTINCT pl.user_id) AS like_count
    FROM posts p
    JOIN users u ON u.user_id = p.author_id
    LEFT JOIN comments c ON c.post_id = p.post_id
    LEFT JOIN post_likes pl ON pl.post_id = p.post_id
    GROUP BY p.post_id, p.title, p.scope, p.created_at, u.name
)
SELECT 
    post_id,
    title,
    scope,
    author_name,
    comment_count,
    like_count,
    ROW_NUMBER() OVER (PARTITION BY scope ORDER BY comment_count DESC, like_count DESC, created_at DESC) AS rank_in_scope,
    DENSE_RANK() OVER (PARTITION BY scope ORDER BY comment_count DESC) AS dense_rank_by_comments,
    ROUND(AVG(comment_count) OVER (PARTITION BY scope), 2) AS scope_avg_comments
FROM post_comment_stats
ORDER BY scope, rank_in_scope;


-- ------------------------------------------------------------------------------
-- 5. RÀNG BUỘC TOÀN VẸN NÂNG CAO & CHECK CONSTRAINTS
-- Nghiệp vụ: Đảm bảo tính toàn vẹn nghiệp vụ của các bài viết:
-- - Bài đăng 'lab' bắt buộc phải có group_id.
-- - Bài đăng 'community' hoặc 'personal' không được gán group_id.
-- - Không được phép tự theo dõi chính mình (chk_not_self_follow).
-- ------------------------------------------------------------------------------
ALTER TABLE posts 
DROP CONSTRAINT IF EXISTS chk_post_scope_group;

ALTER TABLE posts
ADD CONSTRAINT chk_post_scope_group
CHECK (
    (scope = 'lab' AND group_id IS NOT NULL) OR
    (scope IN ('community', 'personal') AND group_id IS NULL)
);


-- ------------------------------------------------------------------------------
-- 6. STORED PROCEDURE / FUNCTION BẰNG PL/PGSQL
-- Nghiệp vụ: Thủ tục tham gia phòng Lab nghiên cứu bằng mã mời (invite_code)
-- Đảm bảo an toàn giao dịch: kiểm tra mã mời hợp lệ, kiểm tra người dùng đã tham gia chưa,
-- ghi nhận vào bảng group_members và tự động tạo thông báo chào mừng cho người dùng.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION join_lab_by_invite_code(
    p_user_id INT,
    p_invite_code VARCHAR(64)
)
RETURNS TABLE (
    success BOOLEAN,
    group_id INT,
    group_name VARCHAR,
    message TEXT
) 
LANGUAGE plpgsql
AS $$
DECLARE
    v_group_id INT;
    v_group_name VARCHAR(150);
    v_owner_id INT;
    v_already_member BOOLEAN;
BEGIN
    -- 1. Tìm nhóm nghiên cứu tương ứng với invite_code
    SELECT rg.group_id, rg.name, rg.owner_id
    INTO v_group_id, v_group_name, v_owner_id
    FROM research_groups rg
    WHERE rg.invite_code = p_invite_code;

    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, NULL::INT, NULL::VARCHAR, 'Mã mời tham gia Lab không hợp lệ hoặc không tồn tại.'::TEXT;
        RETURN;
    END IF;

    -- 2. Kiểm tra người dùng đã là thành viên chưa
    SELECT EXISTS (
        SELECT 1 FROM group_members gm 
        WHERE gm.group_id = v_group_id AND gm.user_id = p_user_id
    ) INTO v_already_member;

    IF v_already_member THEN
        RETURN QUERY SELECT FALSE, v_group_id, v_group_name, 'Bạn đã là thành viên của phòng thí nghiệm này.'::TEXT;
        RETURN;
    END IF;

    -- 3. Thêm thành viên mới vào nhóm
    INSERT INTO group_members (group_id, user_id, role, joined_at)
    VALUES (v_group_id, p_user_id, 'member', NOW());

    -- 4. Tự động sinh thông báo cho người dùng
    INSERT INTO notifications (user_id, sender_id, type, title, message, link, is_read, created_at)
    VALUES (
        p_user_id,
        v_owner_id,
        'lab_invite',
        'Gia nhập Lab thành công!',
        format('Bạn đã gia nhập thành công phòng nghiên cứu "%s".', v_group_name),
        format('/groups/%s', v_group_id),
        FALSE,
        NOW()
    );

    RETURN QUERY SELECT TRUE, v_group_id, v_group_name, 'Gia nhập phòng thí nghiệm thành công!'::TEXT;
END;
$$;


-- ------------------------------------------------------------------------------
-- 7. DYNAMIC SQL (SQL Động an toàn với EXECUTE ... USING)
-- Nghiệp vụ: Tìm kiếm và lọc bài viết học thuật đa tiêu chí (phạm vi, từ khóa tìm kiếm,
-- sắp xếp động theo ngày hoặc lượt tương tác). Sử dụng EXECUTE ... USING để phòng chống
-- tuyệt đối lỗ hổng SQL Injection.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION search_academic_posts_dynamic(
    p_scope VARCHAR DEFAULT NULL,
    p_search_term TEXT DEFAULT NULL,
    p_sort_by VARCHAR DEFAULT 'latest',
    p_limit INT DEFAULT 10,
    p_offset INT DEFAULT 0
)
RETURNS TABLE (
    post_id INT,
    title VARCHAR,
    scope VARCHAR,
    post_type VARCHAR,
    author_name VARCHAR,
    created_at TIMESTAMPTZ,
    rank REAL
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_sql TEXT;
    v_order_clause TEXT;
BEGIN
    -- Xác định điều kiện sắp xếp động
    IF p_sort_by = 'rank' AND p_search_term IS NOT NULL AND p_search_term <> '' THEN
        v_order_clause := 'ts_rank(p.search_vector, plainto_tsquery(''english'', $2)) DESC, p.created_at DESC';
    ELSE
        v_order_clause := 'p.created_at DESC';
    END IF;

    -- Xây dựng chuỗi truy vấn động an toàn
    v_sql := format('
        SELECT 
            p.post_id,
            p.title,
            p.scope,
            p.post_type,
            u.name AS author_name,
            p.created_at,
            CASE 
                WHEN $2 IS NOT NULL AND $2 <> '''' THEN ts_rank(p.search_vector, plainto_tsquery(''english'', $2))
                ELSE 0.0
            END AS rank
        FROM posts p
        JOIN users u ON u.user_id = p.author_id
        WHERE ($1 IS NULL OR p.scope = $1)
          AND ($2 IS NULL OR $2 = '''' OR p.search_vector @@ plainto_tsquery(''english'', $2))
        ORDER BY %s
        LIMIT $3 OFFSET $4
    ', v_order_clause);

    -- Thực thi Dynamic SQL với các tham số truyền qua mệnh đề USING
    RETURN QUERY EXECUTE v_sql
    USING p_scope, p_search_term, p_limit, p_offset;
END;
$$;


-- ------------------------------------------------------------------------------
-- 8. RECURSIVE SQL 1: CÂY THẢO LUẬN PHÂN CẤP VÔ HẠN BẬC (THREADED COMMENTS)
-- Nghiệp vụ: Duyệt cây bình luận dạng Adjacency List (parent_id -> comment_id),
-- tạo mảng sort_path để sắp xếp phân cấp theo thứ tự thời gian trực tiếp dưới
-- bình luận cha mà không cần đệ quy ở tầng ứng dụng.
-- ------------------------------------------------------------------------------
WITH RECURSIVE comment_tree AS (
    -- Anchor: Các bình luận gốc cấp 0 (parent_id IS NULL)
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
    WHERE c.post_id = 1 AND c.parent_id IS NULL

    UNION ALL

    -- Recursive: Các bình luận con cấp n + 1
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
    ct.created_at,
    u.name AS author_name,
    u.role AS author_role
FROM comment_tree ct
JOIN users u ON u.user_id = ct.user_id
ORDER BY ct.sort_path ASC;


-- ------------------------------------------------------------------------------
-- 9. RECURSIVE SQL 2: MẠNG LƯỚI TIẾP CẬN ĐA BƯỚC N-HOP REACHABILITY
-- Nghiệp vụ: Xác định danh sách học giả trong bán kính N bước kết nối từ một học giả
-- xuất phát, ngăn chặn lặp vô tận bằng mảng kiểm tra chu trình `NOT (f.following_id = ANY(n.path))`.
-- ------------------------------------------------------------------------------
WITH RECURSIVE network AS (
    SELECT 
        following_id AS user_id, 
        1 AS depth, 
        ARRAY[follower_id, following_id] AS path
    FROM follows 
    WHERE follower_id = 1

    UNION ALL

    SELECT 
        f.following_id, 
        n.depth + 1, 
        n.path || f.following_id
    FROM network n
    JOIN follows f ON f.follower_id = n.user_id
    WHERE n.depth < 3 
      AND NOT (f.following_id = ANY(n.path))
)
SELECT 
    u.user_id,
    u.name,
    u.institution,
    MIN(n.depth) AS shortest_hop_distance,
    COUNT(n.path) AS reachable_paths_count
FROM network n
JOIN users u ON u.user_id = n.user_id
GROUP BY u.user_id, u.name, u.institution
ORDER BY shortest_hop_distance ASC, u.name ASC;


-- ------------------------------------------------------------------------------
-- 10. RECURSIVE SQL 3: TÌM ĐƯỜNG ĐI HỌC THUẬT NGẮN NHẤT (SHORTEST PATH BFS)
-- Nghiệp vụ: Tìm chuỗi kết nối trực tiếp ngắn nhất giữa Nhà nghiên cứu A (user_id = 1)
-- và Nhà nghiên cứu B (user_id = 5) bằng thuật toán BFS trong SQL.
-- ------------------------------------------------------------------------------
WITH RECURSIVE path_finder AS (
    SELECT 
        follower_id AS current_node,
        following_id AS next_node,
        1 AS depth,
        ARRAY[follower_id, following_id] AS path,
        (following_id = 5) AS found
    FROM follows
    WHERE follower_id = 1

    UNION ALL

    SELECT 
        f.follower_id,
        f.following_id,
        pf.depth + 1,
        pf.path || f.following_id,
        (f.following_id = 5) AS found
    FROM path_finder pf
    JOIN follows f ON f.follower_id = pf.next_node
    WHERE pf.depth < 5
      AND NOT (f.following_id = ANY(pf.path))
      AND pf.found = FALSE
)
SELECT 
    depth AS distance,
    path,
    (
        SELECT json_agg(json_build_object('user_id', u.user_id, 'name', u.name, 'institution', u.institution))
        FROM unnest(path) WITH ORDINALITY AS p(uid, ord)
        JOIN users u ON u.user_id = p.uid
    ) AS path_nodes
FROM path_finder
WHERE next_node = 5
ORDER BY depth ASC
LIMIT 1;


-- ------------------------------------------------------------------------------
-- 11. RECURSIVE SQL 4: PHÁT HIỆN CHU TRÌNH KHÉP KÍN TRONG ĐỒ THỊ (CYCLE DETECTION)
-- Nghiệp vụ: Phát hiện các chu trình theo dõi khép kín có độ dài từ 2 đến 4
-- (ví dụ: A theo dõi B, B theo dõi C, C theo dõi A).
-- ------------------------------------------------------------------------------
WITH RECURSIVE cycle_finder AS (
    SELECT 
        follower_id,
        following_id,
        1 AS depth,
        ARRAY[follower_id, following_id] AS path,
        (following_id = 1) AS is_cycle
    FROM follows
    WHERE follower_id = 1

    UNION ALL

    SELECT 
        f.follower_id,
        f.following_id,
        cf.depth + 1,
        cf.path || f.following_id,
        (f.following_id = 1) AS is_cycle
    FROM cycle_finder cf
    JOIN follows f ON f.follower_id = cf.following_id
    WHERE cf.depth < 4
      AND cf.is_cycle = FALSE
      AND (f.following_id = 1 OR NOT (f.following_id = ANY(cf.path)))
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
ORDER BY depth ASC;


-- ------------------------------------------------------------------------------
-- 12. EMBEDDED SQL / CLIENT API INTERFACE TRONG TYPESCRIPT & NODE-POSTGRES
-- Minh họa cách ứng dụng gọi thực thi SQL tham số hóa (Parameterized Query)
-- với quản lý kết nối Connection Pool, Transaction và Exception Handling.
-- ------------------------------------------------------------------------------
/*
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Tối đa 20 kết nối đồng thời trong pool
  idleTimeoutMillis: 30000,
});

export async function createPostWithTransaction(
  authorId: number,
  title: string,
  content: string,
  scope: 'community' | 'personal' | 'lab',
  groupId: number | null,
  tags: string[]
) {
  const client = await pool.connect();
  try {
    // 1. Khởi tạo Giao dịch (Transaction)
    await client.query('BEGIN');

    // 2. Thêm bài viết mới
    const postRes = await client.query(
      `INSERT INTO posts (author_id, group_id, scope, post_type, title, content)
       VALUES ($1, $2, $3, 'discussion', $4, $5)
       RETURNING post_id, title, created_at`,
      [authorId, groupId, scope, title, content]
    );
    const newPostId = postRes.rows[0].post_id;

    // 3. Gán thẻ tags (Many-to-Many post_tags)
    for (const tagName of tags) {
      const tagRes = await client.query(
        `INSERT INTO tags (name) VALUES ($1)
         ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
         RETURNING tag_id`,
        [tagName.trim()]
      );
      const tagId = tagRes.rows[0].tag_id;

      await client.query(
        `INSERT INTO post_tags (post_id, tag_id) VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [newPostId, tagId]
      );
    }

    // 4. Xác nhận Giao dịch thành công
    await client.query('COMMIT');
    return postRes.rows[0];
  } catch (error) {
    // 5. Khôi phục trạng thái nguyên vẹn nếu gặp sự cố
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
*/
