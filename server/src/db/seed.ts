import { pool } from '../config/db';

export async function seedDatabase(scale: 'default' | 'large' = 'default') {
  const client = await pool.connect();
  try {
    console.log(`--- Seeding Academic Database (scale: ${scale}) ---`);

    // Clean tables in reverse dependency order
    await client.query(`
      TRUNCATE TABLE 
        publication_authors, publications, 
        comments, post_likes, post_tags, tags, posts, 
        group_members, research_groups, 
        follows, users 
      RESTART IDENTITY CASCADE;
    `);

    // 1. Insert Initial Tags
    const tags = [
      'PostgreSQL', 'Recursive CTE', 'Database Optimization', 
      'Artificial Intelligence', 'Graph Theory', 'Distributed Systems', 
      'Cybersecurity', 'Machine Learning', 'Big Data', 'Quantum Computing'
    ];
    for (const tag of tags) {
      await client.query(`INSERT INTO tags (name) VALUES ($1) ON CONFLICT DO NOTHING`, [tag]);
    }
    console.log('✓ Tags seeded.');

    // 2. Insert Core Academic Researchers
    const coreUsers = [
      {
        name: 'Prof. Michael Stonebraker',
        email: 'stonebraker@mit.edu',
        institution: 'MIT CSAIL',
        bio: 'Pioneer in database systems, Turing Award Laureate. Researching modern HTAP, column-stores, and PostgreSQL foundations.',
        research_fields: ['PostgreSQL', 'Database Optimization', 'Distributed Systems'],
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
      },
      {
        name: 'Dr. Jennifer Widom',
        email: 'widom@stanford.edu',
        institution: 'Stanford University',
        bio: 'Dean of Stanford Engineering. Specializing in query languages, graph databases, and recursive relational algebra.',
        research_fields: ['Database Optimization', 'Graph Theory', 'Recursive CTE'],
        avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
      },
      {
        name: 'Dr. Yann LeCun',
        email: 'lecun@nyu.edu',
        institution: 'NYU & Meta AI',
        bio: 'Chief AI Scientist, Turing Award Laureate. Focusing on self-supervised learning, deep representation, and energy-based models.',
        research_fields: ['Artificial Intelligence', 'Machine Learning'],
        avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
      },
      {
        name: 'Dr. Jeffrey Ullman',
        email: 'ullman@stanford.edu',
        institution: 'Stanford University',
        bio: 'Turing Award Laureate. Co-author of Database System Concepts, database theory, Datalog, and graph analytics.',
        research_fields: ['Database Optimization', 'Graph Theory', 'Big Data'],
        avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
      },
      {
        name: 'Dr. Christopher Manning',
        email: 'manning@stanford.edu',
        institution: 'Stanford NLP Lab',
        bio: 'Director of Stanford Artificial Intelligence Laboratory. Deep learning for natural language processing.',
        research_fields: ['Artificial Intelligence', 'Machine Learning'],
        avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'
      },
      {
        name: 'Dr. Dawn Song',
        email: 'dawnsong@berkeley.edu',
        institution: 'UC Berkeley',
        bio: 'Professor in EECS. Researching AI security, privacy-preserving machine learning, and blockchain architectures.',
        research_fields: ['Cybersecurity', 'Artificial Intelligence', 'Distributed Systems'],
        avatar_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80'
      },
      {
        name: 'Dr. Andy Pavlo',
        email: 'pavlo@cs.cmu.edu',
        institution: 'Carnegie Mellon University',
        bio: 'Associate Professor of Database Systems. Autonomous databases, query performance, and indexing internals.',
        research_fields: ['PostgreSQL', 'Database Optimization', 'Distributed Systems'],
        avatar_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80'
      },
      {
        name: 'Nguyen Van An (PhD Candidate)',
        email: 'an.nguyen@vnu.edu.vn',
        institution: 'VNU University of Engineering and Technology',
        bio: 'PhD candidate in Computer Science. Researching recursive graph traversal optimizations and indexing in PostgreSQL.',
        research_fields: ['PostgreSQL', 'Recursive CTE', 'Graph Theory'],
        avatar_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80'
      },
      {
        name: 'Le Thi Mai (Research Fellow)',
        email: 'mai.le@hust.edu.vn',
        institution: 'Hanoi University of Science and Technology',
        bio: 'Lecturer & Researcher in Data Engineering. Large-scale academic knowledge graphs and relational indexing.',
        research_fields: ['Database Optimization', 'Big Data', 'PostgreSQL'],
        avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80'
      },
      {
        name: 'Tran Hoang Nam (Grad Student)',
        email: 'nam.tran@uit.edu.vn',
        institution: 'VNU University of Information Technology',
        bio: 'Master student exploring Full Text Search, GIN indices, and collaborative recommendation algorithms.',
        research_fields: ['Database Optimization', 'Artificial Intelligence'],
        avatar_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80'
      }
    ];

    for (const u of coreUsers) {
      await client.query(`
        INSERT INTO users (name, email, institution, bio, research_fields, avatar_url)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [u.name, u.email, u.institution, u.bio, u.research_fields, u.avatar_url]);
    }
    console.log(`✓ Seeded ${coreUsers.length} core researchers.`);

    // 3. Insert Follows (Intentional Graph with paths, mutuals, and cycles)
    // Structure:
    // 1 (Stonebraker) -> 2 (Widom), 7 (Pavlo), 8 (An)
    // 2 (Widom) -> 4 (Ullman), 8 (An), 9 (Mai)
    // 4 (Ullman) -> 1 (Stonebraker) [Creates Cycle 1 -> 2 -> 4 -> 1 !]
    // 7 (Pavlo) -> 1 (Stonebraker), 8 (An), 6 (Song)
    // 8 (An) -> 9 (Mai), 7 (Pavlo), 10 (Nam)
    // 9 (Mai) -> 8 (An) [Mutual follow 8 <-> 9], 10 (Nam), 2 (Widom)
    // 3 (LeCun) -> 5 (Manning), 6 (Song)
    // 5 (Manning) -> 3 (LeCun), 6 (Song)
    // 6 (Song) -> 3 (LeCun), 7 (Pavlo)
    // 10 (Nam) -> 8 (An), 1 (Stonebraker)
    const followsRelations = [
      [1, 2], [1, 7], [1, 8],
      [2, 4], [2, 8], [2, 9],
      [4, 1], [4, 2],
      [7, 1], [7, 8], [7, 6],
      [8, 9], [8, 7], [8, 10],
      [9, 8], [9, 10], [9, 2],
      [3, 5], [3, 6],
      [5, 3], [5, 6],
      [6, 3], [6, 7],
      [10, 8], [10, 1]
    ];

    for (const [follower, following] of followsRelations) {
      await client.query(`
        INSERT INTO follows (follower_id, following_id) 
        VALUES ($1, $2) 
        ON CONFLICT DO NOTHING
      `, [follower, following]);
    }
    console.log(`✓ Seeded ${followsRelations.length} follow relationships.`);

    // 4. Research Groups
    const groups = [
      {
        name: 'Advanced Database Systems & Query Optimization Lab',
        topic: 'Database Optimization',
        description: 'Focusing on query execution engines, index structures, recursive CTE performance, and buffer management in PostgreSQL.',
        owner_id: 1,
        avatar_url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=150&auto=format&fit=crop&q=80'
      },
      {
        name: 'Graph Theory & Recursive Relational Algebra Consortium',
        topic: 'Graph Theory',
        description: 'Investigating graph algorithms implemented in pure relational SQL, cycle detection, transitive closure, and shortest paths.',
        owner_id: 2,
        avatar_url: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=150&auto=format&fit=crop&q=80'
      },
      {
        name: 'Deep Learning & Foundation Models Lab',
        topic: 'Artificial Intelligence',
        description: 'Exploring neural architectures, self-supervised representation, and scalable parameter-efficient fine-tuning.',
        owner_id: 3,
        avatar_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80'
      },
      {
        name: 'Privacy-Preserving & Secure Distributed Systems',
        topic: 'Cybersecurity',
        description: 'Cryptographic guarantees, zero-knowledge proofs, and secure collaborative research computations.',
        owner_id: 6,
        avatar_url: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=150&auto=format&fit=crop&q=80'
      }
    ];

    for (const g of groups) {
      const res = await client.query(`
        INSERT INTO research_groups (name, topic, description, owner_id, avatar_url)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING group_id
      `, [g.name, g.topic, g.description, g.owner_id, g.avatar_url]);
      const groupId = res.rows[0].group_id;

      // Add owner as owner member
      await client.query(`
        INSERT INTO group_members (group_id, user_id, role)
        VALUES ($1, $2, 'owner')
      `, [groupId, g.owner_id]);
    }

    // Additional members
    const groupMemberships = [
      [1, 7, 'admin'], [1, 8, 'member'], [1, 9, 'member'], [1, 10, 'member'],
      [2, 4, 'admin'], [2, 1, 'member'], [2, 8, 'member'], [2, 9, 'member'],
      [3, 5, 'admin'], [3, 6, 'member'], [3, 10, 'member'],
      [4, 7, 'member'], [4, 8, 'member']
    ];

    for (const [gid, uid, role] of groupMemberships) {
      await client.query(`
        INSERT INTO group_members (group_id, user_id, role)
        VALUES ($1, $2, $3)
        ON CONFLICT DO NOTHING
      `, [gid, uid, role]);
    }
    console.log('✓ Seeded research groups and memberships.');

    // 5. Publications & Co-authors
    const pubs = [
      {
        title: 'Recursive Relational Algebra and Transitive Closure in Modern DBMS',
        doi: '10.1145/3448016.3452811',
        venue: 'ACM SIGMOD 2024',
        abstract: 'An in-depth empirical evaluation of WITH RECURSIVE query plans, memory footprint, and memoization techniques in PostgreSQL.',
        published_at: '2024-06-15',
        authors: [1, 2, 8]
      },
      {
        title: 'Autonomous Index Tuning and Keyset Pagination in Distributed OLTP',
        doi: '10.14778/3551793.3551800',
        venue: 'PVLDB 2024',
        abstract: 'Benchmarking B-Tree vs GIN vs Hash index behavior under heavy multi-hop graph reachability queries.',
        published_at: '2024-08-20',
        authors: [7, 1, 9]
      },
      {
        title: 'Collaborative Filtering on Academic Citation and Follow Graphs',
        doi: '10.1109/ICDE53760.2025.00042',
        venue: 'IEEE ICDE 2025',
        abstract: 'Ranking candidate collaborators via graph distance, mutual cluster intersection, and shared field embeddings.',
        published_at: '2025-03-10',
        authors: [8, 9, 10]
      },
      {
        title: 'Deep Representation Learning in Academic Knowledge Graphs',
        doi: '10.18653/v1/2024.emnlp-main.812',
        venue: 'NeurIPS 2024',
        abstract: 'Combining semantic text vector spaces with topological graph structures to predict academic research partnerships.',
        published_at: '2024-12-05',
        authors: [3, 5, 6]
      }
    ];

    for (const p of pubs) {
      const res = await client.query(`
        INSERT INTO publications (title, doi, venue, abstract, published_at)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING publication_id
      `, [p.title, p.doi, p.venue, p.abstract, p.published_at]);
      const pubId = res.rows[0].publication_id;

      let order = 1;
      for (const authorId of p.authors) {
        await client.query(`
          INSERT INTO publication_authors (publication_id, user_id, author_order)
          VALUES ($1, $2, $3)
        `, [pubId, authorId, order++]);
      }
    }
    console.log('✓ Seeded scientific publications and co-authorships.');

    // 6. Posts
    const posts = [
      {
        author_id: 8,
        group_id: 1,
        post_type: 'question',
        title: 'Tối ưu hóa truy vấn WITH RECURSIVE khi duyệt đồ thị theo dõi sâu hơn 4 bậc?',
        content: `Trong nghiên cứu về mạng xã hội học thuật, khi mình thực thi CTE đệ quy để tìm tất cả các nhà nghiên cứu trong phạm vi 4 bước:
WITH RECURSIVE network AS (
  SELECT following_id, 1 AS depth, ARRAY[follower_id, following_id] AS path FROM follows WHERE follower_id = 1
  UNION ALL
  SELECT f.following_id, n.depth + 1, n.path || f.following_id FROM network n JOIN follows f ON f.follower_id = n.following_id
  WHERE n.depth < 4 AND NOT f.following_id = ANY(n.path)
)
Khi số lượng follows tăng lên, WorkTable memory tràn ra đĩa (disk spill) và thời gian thực thi tăng theo hàm số mũ. Liệu tạo composite index (follower_id, following_id) hay áp dụng Hash Join có thể cải thiện tình trạng này? Xin ý kiến từ các chuyên gia!`,
        tags: ['PostgreSQL', 'Recursive CTE', 'Database Optimization']
      },
      {
        author_id: 7,
        group_id: 1,
        post_type: 'research',
        title: 'So sánh Keyset Pagination và OFFSET/LIMIT trên tập dữ liệu hàng triệu bản ghi',
        content: `Một trong những sai lầm phổ biến nhất trong các hệ thống mạng xã hội học thuật là sử dụng OFFSET LIMIT cho việc tải trang bài viết và hoạt động dòng thời gian.
Khi OFFSET lên đến 100,000, PostgreSQL vẫn phải quét qua 100,000 index entries trước khi trả về 20 dòng mong muốn.
Thay vào đó, Keyset Pagination (Seek Method) sử dụng (created_at, post_id) < ($last_created_at, $last_post_id) tận dụng B-tree index hoàn hảo với độ phức tạp O(log N) bất kể độ sâu của trang.`,
        tags: ['Database Optimization', 'PostgreSQL']
      },
      {
        author_id: 2,
        group_id: 2,
        post_type: 'discussion',
        title: 'Mô hình hóa chuỗi bình luận nhiều cấp: Adjacency List vs Nested Sets vs Path Enumeration',
        content: `Chúng ta có nhiều cách để lưu trữ cây thảo luận phân cấp trong cơ sở dữ liệu quan hệ:
1. Adjacency List (parent_id) kết hợp WITH RECURSIVE: Cực kỳ linh hoạt khi thêm mới (O(1)), xóa nhánh theo ON DELETE CASCADE dễ dàng.
2. Path Enumeration (lưu chuỗi path = '1.4.12'): Tối ưu cho việc SELECT cây con nhưng cồng kềnh khi di chuyển nhánh.
3. Nested Sets (lft, rgt): Rất nhanh khi đọc nhưng chi phí INSERT/UPDATE lại quá lớn.
Trong dự án này, chúng ta nghiên cứu kỹ Adjacency List với WITH RECURSIVE và B-tree index trên parent_id.`,
        tags: ['Database Optimization', 'Recursive CTE', 'Graph Theory']
      },
      {
        author_id: 3,
        group_id: 3,
        post_type: 'paper_share',
        title: 'Khảo sát các phương pháp Graph Neural Networks cho gợi ý cộng tác viên khoa học',
        content: `Chúng tôi vừa xuất bản bài báo mới về việc kết hợp cấu trúc liên kết mạng theo dõi và nội dung tóm tắt bài báo khoa học. Mô hình kết hợp truy vấn 2-hop neighbor trên SQL với vector embedding mang lại độ chính xác cao hơn 34% so với mô hình thuần heuristic.`,
        tags: ['Artificial Intelligence', 'Machine Learning', 'Graph Theory']
      }
    ];

    for (const p of posts) {
      const res = await client.query(`
        INSERT INTO posts (author_id, group_id, post_type, title, content)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING post_id
      `, [p.author_id, p.group_id, p.post_type, p.title, p.content]);
      const postId = res.rows[0].post_id;

      // Link tags
      for (const tagName of p.tags) {
        const tagRes = await client.query(`SELECT tag_id FROM tags WHERE name = $1`, [tagName]);
        if (tagRes.rows.length > 0) {
          await client.query(`
            INSERT INTO post_tags (post_id, tag_id)
            VALUES ($1, $2)
            ON CONFLICT DO NOTHING
          `, [postId, tagRes.rows[0].tag_id]);
        }
      }

      // Add likes
      await client.query(`
        INSERT INTO post_likes (post_id, user_id)
        VALUES ($1, $2), ($1, $3)
        ON CONFLICT DO NOTHING
      `, [postId, 1, 2]);
    }
    console.log('✓ Seeded academic posts and tags.');

    // 7. Seed Multi-level Nested Comments on Post 1 (The Recursive CTE Question)
    // Structure:
    // C1 (Stonebraker, root)
    //  └── C2 (Pavlo, reply to C1)
    //       └── C3 (An, reply to C2)
    //            └── C4 (Pavlo, reply to C3)
    // C5 (Widom, root)
    //  └── C6 (Mai, reply to C5)
    //  └── C7 (Nam, reply to C5)
    //       └── C8 (Widom, reply to C7)
    const c1 = await client.query(`
      INSERT INTO comments (post_id, user_id, parent_id, content)
      VALUES (1, 1, NULL, 'Chào An, câu hỏi rất hay. Composite index (follower_id, following_id) là bắt buộc. Ngoài ra bạn nên kiểm tra xem planner có chọn Index Only Scan hay không. Nếu có thể, hãy dùng EXPLAIN (ANALYZE, BUFFERS) để đo số Shared Hit Blocks.')
      RETURNING comment_id
    `);
    const c1Id = c1.rows[0].comment_id;

    const c2 = await client.query(`
      INSERT INTO comments (post_id, user_id, parent_id, content)
      VALUES (1, 7, $1, 'Đồng ý với giáo sư Stonebraker! Ngoài ra tại CMU bọn mình nhận thấy khi depth >= 4, số lượng nhánh bùng nổ tổ hợp. Bạn cần chặn chu trình bằng array check NOT f.following_id = ANY(path), nếu không vòng lặp vô hạn sẽ làm sập bộ nhớ.')
      RETURNING comment_id
    `, [c1Id]);
    const c2Id = c2.rows[0].comment_id;

    const c3 = await client.query(`
      INSERT INTO comments (post_id, user_id, parent_id, content)
      VALUES (1, 8, $1, 'Cảm ơn thầy Pavlo và thầy Stonebraker! Em đã thêm mảng path và thấy CPU time giảm 70% trên tập 10,000 quan hệ. Em sẽ bổ sung bảng so sánh Buffers trong bài báo.')
      RETURNING comment_id
    `, [c2Id]);
    const c3Id = c3.rows[0].comment_id;

    await client.query(`
      INSERT INTO comments (post_id, user_id, parent_id, content)
      VALUES (1, 7, $1, 'Tuyệt vời, nhớ test cả trường hợp đồ thị dạng sao (star graph) và đồ thị đầy đủ (complete graph) nhé!')
    `, [c3Id]);

    const c5 = await client.query(`
      INSERT INTO comments (post_id, user_id, parent_id, content)
      VALUES (1, 2, NULL, 'Từ góc độ Datalog và đại số quan hệ đệ quy, bạn cũng có thể thử nghiệm biến thể Semi-naïve Evaluation mà PostgreSQL sử dụng cho WITH RECURSIVE. WorkTable chỉ lưu delta của vòng lặp trước đó.')
      RETURNING comment_id
    `);
    const c5Id = c5.rows[0].comment_id;

    await client.query(`
      INSERT INTO comments (post_id, user_id, parent_id, content)
      VALUES (1, 9, $1, 'Em cũng đang đọc tài liệu của cô Widom về Datalog. Cơ chế Semi-naïve giúp giảm đáng kể phép JOIN trùng lặp ở mỗi bước đệ quy.')
    `, [c5Id]);

    const c7 = await client.query(`
      INSERT INTO comments (post_id, user_id, parent_id, content)
      VALUES (1, 10, $1, 'Em có thử viết bằng Python ORM trước đây nhưng chậm gấp 50 lần so với chạy trực tiếp CTE trên PostgreSQL!')
      RETURNING comment_id
    `, [c5Id]);
    const c7Id = c7.rows[0].comment_id;

    await client.query(`
      INSERT INTO comments (post_id, user_id, parent_id, content)
      VALUES (1, 2, $1, 'Chính xác! Đưa logic duyệt đồ thị trực tiếp vào trong database engine loại bỏ hoàn toàn chi phí network round-trips và serialization.')
    `, [c7Id]);

    console.log('✓ Seeded multi-level hierarchical threaded comments (4 levels deep).');

    // 8. If scale == 'large', generate 100 extra synthetic users and hundreds of follows for benchmark experiments
    if (scale === 'large') {
      console.log('Generating 150 synthetic academic researchers and 1,000 follow edges...');
      for (let i = 11; i <= 160; i++) {
        await client.query(`
          INSERT INTO users (name, email, institution, bio, research_fields)
          VALUES (
            'Researcher ' || $1, 
            'researcher' || $1 || '@academic-lab.edu',
            'University of Technology ' || ($1 % 10 + 1),
            'Automated synthetic academic researcher profile for PostgreSQL benchmarking experiment.',
            ARRAY['Database Optimization', 'PostgreSQL', 'Artificial Intelligence']
          )
        `, [i]);
      }

      // Generate dense follows
      for (let i = 1; i <= 160; i++) {
        const count = 5 + Math.floor(Math.random() * 8);
        for (let j = 0; j < count; j++) {
          const target = 1 + Math.floor(Math.random() * 160);
          if (target !== i) {
            await client.query(`
              INSERT INTO follows (follower_id, following_id)
              VALUES ($1, $2)
              ON CONFLICT DO NOTHING
            `, [i, target]);
          }
        }
      }
      console.log('✓ Large synthetic dataset created successfully.');
    }

    console.log('=== Academic Database Seeding Completed Successfully! ===');
  } catch (err) {
    console.error('Error during seeding:', err);
    throw err;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  const scale = process.argv.includes('--large') ? 'large' : 'default';
  seedDatabase(scale)
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
