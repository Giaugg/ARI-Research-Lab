-- ==============================================================================
-- ADVANCED POSTGRESQL RECURSIVE & GRAPH QUERIES
-- Academic Collaboration Network (ARI)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- Problem 1: N-Hop Follower Reachability
-- Explores all researchers reachable from user_id within max_depth hops.
-- Uses path array to prevent cyclic infinite loops.
-- ------------------------------------------------------------------------------
-- Params: $1 = start_user_id, $2 = max_depth
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
    u.email,
    u.institution,
    u.research_fields,
    u.avatar_url,
    MIN(n.depth) AS distance,
    COUNT(n.path) AS reachable_paths_count
FROM network n
JOIN users u ON u.user_id = n.user_id
GROUP BY u.user_id, u.name, u.email, u.institution, u.research_fields, u.avatar_url
ORDER BY distance ASC, u.name ASC;


-- ------------------------------------------------------------------------------
-- Problem 2: Shortest Path & Connection Path Between Two Researchers
-- Finds paths from researcher A ($1) to researcher B ($2).
-- ------------------------------------------------------------------------------
WITH RECURSIVE path_finder AS (
    SELECT 
        follower_id AS current_node,
        following_id AS next_node,
        1 AS depth,
        ARRAY[follower_id, following_id] AS path,
        FALSE AS found
    FROM follows
    WHERE follower_id = $1

    UNION ALL

    SELECT 
        f.follower_id,
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
    depth AS distance,
    path,
    (
        SELECT json_agg(json_build_object('user_id', u.user_id, 'name', u.name, 'institution', u.institution))
        FROM unnest(path) WITH ORDINALITY AS p(uid, ord)
        JOIN users u ON u.user_id = p.uid
    ) AS path_nodes
FROM path_finder
WHERE next_node = $2
ORDER BY depth ASC
LIMIT 10;


-- ------------------------------------------------------------------------------
-- Problem 2B: Mutual Followers / Mutual Followings between Two Researchers
-- ------------------------------------------------------------------------------
-- Mutual followings: People that both A and B are following
SELECT 
    u.user_id, u.name, u.institution, u.avatar_url
FROM users u
JOIN follows fa ON fa.following_id = u.user_id AND fa.follower_id = $1
JOIN follows fb ON fb.following_id = u.user_id AND fb.follower_id = $2;


-- ------------------------------------------------------------------------------
-- Problem 3: Hierarchical Threaded Comments Tree
-- Builds an indented tree where replies are chronologically sequenced
-- directly underneath their respective parent branches.
-- ------------------------------------------------------------------------------
-- Params: $1 = post_id
WITH RECURSIVE comment_tree AS (
    -- Anchor member: top-level comments (parent_id IS NULL)
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

    -- Recursive member: child comments
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
    u.institution AS author_institution
FROM comment_tree ct
JOIN users u ON u.user_id = ct.user_id
ORDER BY ct.sort_path ASC;


-- ------------------------------------------------------------------------------
-- Problem 4: Academic Collaborative Recommendation
-- Suggests researchers based on 2nd-degree mutual connections, shared research
-- groups, and shared research field tags.
-- ------------------------------------------------------------------------------
-- Params: $1 = current_user_id
WITH user_followings AS (
    SELECT following_id FROM follows WHERE follower_id = $1
),
user_groups AS (
    SELECT group_id FROM group_members WHERE user_id = $1
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
)
SELECT 
    u.user_id,
    u.name,
    u.institution,
    u.avatar_url,
    u.research_fields,
    SUM(cp.weight) AS recommendation_score,
    COUNT(DISTINCT CASE WHEN cp.reason = 'mutual_follow' THEN 1 END) AS mutual_connections_count,
    COUNT(DISTINCT CASE WHEN cp.reason = 'shared_group' THEN 1 END) AS shared_groups_count
FROM candidate_pool cp
JOIN users u ON u.user_id = cp.candidate_id
GROUP BY u.user_id, u.name, u.institution, u.avatar_url, u.research_fields
ORDER BY recommendation_score DESC, mutual_connections_count DESC
LIMIT 10;


-- ------------------------------------------------------------------------------
-- Problem 5: Cycle Detection in Academic Follows Graph
-- Finds directed cycles of length 2 to 4 starting from user $1
-- (e.g. A -> B -> C -> A)
-- ------------------------------------------------------------------------------
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
    WHERE cf.depth < 4
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
ORDER BY depth ASC;
