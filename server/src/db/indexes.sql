-- ==============================================================================
-- RESEARCH & OPTIMIZATION INDEXES
-- Designed for Recursive CTEs, Graph Traversal, Tree Hierarchy, and FTS
-- ==============================================================================

-- 1. Network Traversal (Follows Graph)
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows (follower_id, following_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows (following_id, follower_id);

-- 2. Hierarchical Comments (Tree Walk)
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments (parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_post ON comments (post_id, parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_post_created ON comments (post_id, created_at ASC);

-- 3. Posts & Timeline Feed (Keyset vs Offset & Filtering)
CREATE INDEX IF NOT EXISTS idx_posts_author_created ON posts (author_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_group_created ON posts (group_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_created_id ON posts (created_at DESC, post_id DESC);

-- 4. Full Text Search Index (GIN)
CREATE INDEX IF NOT EXISTS idx_posts_search ON posts USING GIN (search_vector);

-- 5. Academic Groups & Co-authors
CREATE INDEX IF NOT EXISTS idx_group_members_user ON group_members (user_id, group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group ON group_members (group_id, user_id);
CREATE INDEX IF NOT EXISTS idx_pub_authors_user ON publication_authors (user_id);
CREATE INDEX IF NOT EXISTS idx_pub_authors_pub ON publication_authors (publication_id);
