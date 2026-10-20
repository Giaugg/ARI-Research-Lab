-- ==============================================================================
-- DATABASE SCHEMA: Academic Research & Collaboration Network (ARI)
-- PostgreSQL 18+ Compatibility
-- ==============================================================================

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) DEFAULT 'hashed_pwd_default',
    bio TEXT,
    institution VARCHAR(200),
    research_fields TEXT[] DEFAULT '{}',
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Follows Table (Directed Graph: users -> follows -> users)
CREATE TABLE IF NOT EXISTS follows (
    follower_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    following_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (follower_id, following_id),
    CONSTRAINT chk_not_self_follow CHECK (follower_id <> following_id)
);

-- 3. Research Groups Table
CREATE TABLE IF NOT EXISTS research_groups (
    group_id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    topic VARCHAR(150) NOT NULL,
    description TEXT,
    owner_id INT REFERENCES users(user_id) ON DELETE SET NULL,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Group Members Table (Many-to-Many: users <-> group_members <-> research_groups)
CREATE TABLE IF NOT EXISTS group_members (
    group_id INT NOT NULL REFERENCES research_groups(group_id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (group_id, user_id)
);

-- 5. Posts Table (Questions, Research Sharing, Paper Discussions)
CREATE TABLE IF NOT EXISTS posts (
    post_id SERIAL PRIMARY KEY,
    author_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    group_id INT REFERENCES research_groups(group_id) ON DELETE SET NULL,
    post_type VARCHAR(30) DEFAULT 'discussion' CHECK (post_type IN ('discussion', 'question', 'research', 'paper_share')),
    title VARCHAR(300) NOT NULL,
    content TEXT NOT NULL,
    search_vector tsvector,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Tags Table (Academic Domains)
CREATE TABLE IF NOT EXISTS tags (
    tag_id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

-- 7. Post Tags Table (Many-to-Many: posts <-> tags)
CREATE TABLE IF NOT EXISTS post_tags (
    post_id INT NOT NULL REFERENCES posts(post_id) ON DELETE CASCADE,
    tag_id INT NOT NULL REFERENCES tags(tag_id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, tag_id)
);

-- 8. Post Likes Table
CREATE TABLE IF NOT EXISTS post_likes (
    post_id INT NOT NULL REFERENCES posts(post_id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (post_id, user_id)
);

-- 9. Comments Table (Hierarchical Tree / Forest: parent_id -> comment_id)
CREATE TABLE IF NOT EXISTS comments (
    comment_id SERIAL PRIMARY KEY,
    post_id INT NOT NULL REFERENCES posts(post_id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    parent_id INT REFERENCES comments(comment_id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Publications Table (Scientific Research Works)
CREATE TABLE IF NOT EXISTS publications (
    publication_id SERIAL PRIMARY KEY,
    title VARCHAR(350) NOT NULL,
    doi VARCHAR(150) UNIQUE,
    venue VARCHAR(200),
    abstract TEXT,
    published_at DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Publication Authors Table (Co-authorship Network)
CREATE TABLE IF NOT EXISTS publication_authors (
    publication_id INT NOT NULL REFERENCES publications(publication_id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    author_order INT DEFAULT 1,
    PRIMARY KEY (publication_id, user_id)
);

-- Automated Full Text Search Vector update trigger
CREATE OR REPLACE FUNCTION posts_tsvector_trigger() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.content, '')), 'B');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tsvectorupdate ON posts;
CREATE TRIGGER tsvectorupdate BEFORE INSERT OR UPDATE
ON posts FOR EACH ROW EXECUTE FUNCTION posts_tsvector_trigger();
