# 03. THIẾT KẾ CƠ SỞ DỮ LIỆU: MÔ HÌNH EER, SƠ ĐỒ QUAN HỆ & TỪ ĐIỂN DỮ LIỆU

---

## 1. Mô hình Thực thể Mở rộng (Enhanced Entity-Relationship Diagram - EER)

Mô hình EER của **ARI Research Lab** mở rộng mô hình ER truyền thống bằng việc tích hợp cơ chế **Tổng quát hóa / Chuyên biệt hóa (Generalization / Specialization)** cho hai thực thể trung tâm: **Người dùng (`User`)** và **Bài viết (`Post`)**.

### 1.1. Phân tích Chuyên biệt hóa (Specialization / Generalization)

```mermaid
graph TD
    User["Thực thể Cha: User<br/>(user_id, name, email, password_hash, institution, bio, avatar_url, created_at)"]
    Post["Thực thể Cha: Post<br/>(post_id, title, content, post_type, created_at, search_vector)"]

    %% User Specialization
    User -->|d, total| UserDisjoint{"(d, t)"}
    UserDisjoint --> Admin["Admin<br/>- admin_level<br/>- audit_log_access"]
    UserDisjoint --> PI["PrincipalInvestigator (PI)<br/>- grant_number<br/>- h_index<br/>- leads_lab"]
    UserDisjoint --> Researcher["Researcher<br/>- research_fields<br/>- lab_affiliation"]
    UserDisjoint --> Student["Student<br/>- student_id<br/>- degree_level<br/>- advisor_id"]

    %% Post Specialization
    Post -->|d, total| PostDisjoint{"(d, t)"}
    PostDisjoint --> CommunityPost["CommunityPost (Phạm vi: community)<br/>- Thảo luận mở khoa học toàn viện<br/>- group_id = NULL"]
    PostDisjoint --> PersonalPost["PersonalPost (Phạm vi: personal)<br/>- Chia sẻ học thuật trang cá nhân tác giả<br/>- group_id = NULL"]
    PostDisjoint --> LabPost["LabPost (Phạm vi: lab)<br/>- Báo cáo tiến độ nội bộ phòng Lab<br/>- group_id NOT NULL (FK)"]

    classDef entity fill:#eef2ff,stroke:#6366f1,stroke-width:2px;
    classDef disjoint fill:#fef3c7,stroke:#f59e0b,stroke-width:2px;
    classDef subEntity fill:#f0fdf4,stroke:#22c55e,stroke-width:2px;

    class User,Post entity;
    class UserDisjoint,PostDisjoint disjoint;
    class Admin,PI,Researcher,Student,CommunityPost,PersonalPost,LabPost subEntity;
```

#### Quy tắc ngữ nghĩa của Chuyên biệt hóa:
1. **Thực thể `User`**:
   - **Ràng buộc rời rạc (Disjoint - $d$)**: Tại một thời điểm, một học giả thuộc đúng một vai trò chính (`admin`, `pi`, `researcher`, `student`) được kiểm tra qua `CHECK (role IN ('admin', 'pi', 'researcher', 'student'))`.
   - **Ràng buộc toàn phần (Total - $t$)**: Mọi cá nhân trong hệ thống bắt buộc phải thuộc một trong 4 phân lớp trên.
   - **Ánh xạ quan hệ (Relational Mapping)**: Áp dụng chiến lược **Single Table with Type Discriminator** (Bảng đơn kết hợp cột phân biệt `role`) để tối ưu hóa hiệu năng truy vấn JOIN và chỉ mục B-tree.
2. **Thực thể `Post`**:
   - **Ràng buộc rời rạc (Disjoint - $d$) & Toàn phần (Total - $t$)**: Mỗi bài viết có đúng một phạm vi duy nhất (`scope IN ('community', 'personal', 'lab')`).
   - Ràng buộc toàn vẹn miền giá trị nghiệp vụ:
     $$\text{scope} = \text{'lab'} \iff \text{group\_id IS NOT NULL}$$
     $$\text{scope} \in \{\text{'community'}, \text{'personal'}\} \iff \text{group\_id IS NULL}$$

---

### 1.2. Sơ đồ Thực thể - Liên kết Toàn Thể (EER Diagram)

Dưới đây là sơ đồ tương tác giữa toàn bộ 12 thực thể quan hệ của hệ thống ARI Research Lab:

```mermaid
erDiagram
    users {
        int user_id PK
        string name
        string email UK
        string password_hash
        string role "CHECK in ('admin', 'pi', 'researcher', 'student')"
        text bio
        string institution
        text_array research_fields
        text avatar_url
        timestamptz created_at
    }

    follows {
        int follower_id PK, FK
        int following_id PK, FK
        timestamptz created_at
    }

    research_groups {
        int group_id PK
        string name
        string topic
        text description
        int owner_id FK
        text avatar_url
        string invite_code UK
        timestamptz created_at
    }

    group_members {
        int group_id PK, FK
        int user_id PK, FK
        string role "CHECK in ('owner', 'admin', 'member')"
        timestamptz joined_at
    }

    posts {
        int post_id PK
        int author_id FK
        int group_id FK
        string scope "CHECK in ('community', 'personal', 'lab')"
        string post_type "CHECK in ('discussion', 'question', 'research', 'paper_share')"
        string title
        text content
        tsvector search_vector
        timestamptz created_at
    }

    tags {
        int tag_id PK
        string name UK
    }

    post_tags {
        int post_id PK, FK
        int tag_id PK, FK
    }

    post_likes {
        int post_id PK, FK
        int user_id PK, FK
        timestamptz created_at
    }

    comments {
        int comment_id PK
        int post_id FK
        int user_id FK
        int parent_id FK
        text content
        timestamptz created_at
    }

    publications {
        int publication_id PK
        string title
        string doi UK
        string venue
        text abstract
        date published_at
        timestamptz created_at
    }

    publication_authors {
        int publication_id PK, FK
        int user_id PK, FK
        int author_order
    }

    notifications {
        int notification_id PK
        int user_id FK
        int sender_id FK
        string type
        string title
        text message
        text link
        boolean is_read
        timestamptz created_at
    }

    users ||--o{ follows : "follower_id"
    users ||--o{ follows : "following_id"
    users ||--o{ research_groups : "owner_id"
    users ||--o{ group_members : "user_id"
    research_groups ||--o{ group_members : "group_id"
    users ||--o{ posts : "author_id"
    research_groups ||--o{ posts : "group_id (lab posts)"
    posts ||--o{ post_tags : "post_id"
    tags ||--o{ post_tags : "tag_id"
    posts ||--o{ post_likes : "post_id"
    users ||--o{ post_likes : "user_id"
    posts ||--o{ comments : "post_id"
    users ||--o{ comments : "user_id"
    comments ||--o{ comments : "parent_id -> comment_id (Self-Ref)"
    publications ||--o{ publication_authors : "publication_id"
    users ||--o{ publication_authors : "user_id"
    users ||--o{ notifications : "user_id (receiver)"
    users ||--o{ notifications : "sender_id"
```

---

## 2. Lược Đồ Quan Hệ (Relational Schema)

```
1. users (
    user_id [PK], name, email [UK], password_hash, role, bio, 
    institution, research_fields, avatar_url, created_at
)

2. follows (
    follower_id [PK, FK -> users.user_id ON DELETE CASCADE],
    following_id [PK, FK -> users.user_id ON DELETE CASCADE],
    created_at
    * CONSTRAINT chk_not_self_follow CHECK (follower_id <> following_id)
)

3. research_groups (
    group_id [PK], name, topic, description, 
    owner_id [FK -> users.user_id ON DELETE SET NULL],
    avatar_url, invite_code [UK], created_at
)

4. group_members (
    group_id [PK, FK -> research_groups.group_id ON DELETE CASCADE],
    user_id [PK, FK -> users.user_id ON DELETE CASCADE],
    role [CHECK IN ('owner', 'admin', 'member')],
    joined_at
)

5. posts (
    post_id [PK],
    author_id [FK -> users.user_id ON DELETE CASCADE],
    group_id [FK -> research_groups.group_id ON DELETE SET NULL],
    scope [CHECK IN ('community', 'personal', 'lab')],
    post_type [CHECK IN ('discussion', 'question', 'research', 'paper_share')],
    title, content, search_vector, created_at
    * CONSTRAINT chk_post_scope_group CHECK (
        (scope = 'lab' AND group_id IS NOT NULL) OR
        (scope IN ('community', 'personal') AND group_id IS NULL)
    )
)

6. tags (
    tag_id [PK], name [UK]
)

7. post_tags (
    post_id [PK, FK -> posts.post_id ON DELETE CASCADE],
    tag_id [PK, FK -> tags.tag_id ON DELETE CASCADE]
)

8. post_likes (
    post_id [PK, FK -> posts.post_id ON DELETE CASCADE],
    user_id [PK, FK -> users.user_id ON DELETE CASCADE],
    created_at
)

9. comments (
    comment_id [PK],
    post_id [FK -> posts.post_id ON DELETE CASCADE],
    user_id [FK -> users.user_id ON DELETE CASCADE],
    parent_id [FK -> comments.comment_id ON DELETE CASCADE],
    content, created_at
)

10. publications (
    publication_id [PK], title, doi [UK], venue, abstract, published_at, created_at
)

11. publication_authors (
    publication_id [PK, FK -> publications.publication_id ON DELETE CASCADE],
    user_id [PK, FK -> users.user_id ON DELETE CASCADE],
    author_order
)

12. notifications (
    notification_id [PK],
    user_id [FK -> users.user_id ON DELETE CASCADE],
    sender_id [FK -> users.user_id ON DELETE SET NULL],
    type, title, message, link, is_read, created_at
)
```

---

## 3. Từ Điển Dữ Liệu Chi Tiết (Data Dictionary)

### 3.1. Bảng `users` (Nhà nghiên cứu / Người dùng hệ thống)
| Tên cột | Kiểu dữ liệu | Khóa / Ràng buộc | Ý nghĩa nghiệp vụ |
| :--- | :--- | :--- | :--- |
| `user_id` | `SERIAL` | **PRIMARY KEY** | Mã định danh duy nhất của người dùng |
| `name` | `VARCHAR(120)` | `NOT NULL` | Họ tên đầy đủ kèm học vị (GS, PGS, TS, NCS) |
| `email` | `VARCHAR(150)` | `UNIQUE, NOT NULL` | Email định danh đăng nhập |
| `password_hash` | `VARCHAR(255)` | `DEFAULT '...'` | Chuỗi mật khẩu băm bảo mật |
| `role` | `VARCHAR(30)` | `CHECK ('admin','pi','researcher','student')` | Phân quyền học thuật |
| `bio` | `TEXT` | `NULLABLE` | Tóm tắt hướng nghiên cứu & tiểu sử |
| `institution` | `VARCHAR(200)` | `NULLABLE` | Viện nghiên cứu / Trường Đại học |
| `research_fields`| `TEXT[]` | `DEFAULT '{}'` | Danh sách lĩnh vực chuyên sâu (AI, DBMS, ...) |
| `avatar_url` | `TEXT` | `NULLABLE` | Đường dẫn ảnh đại diện |
| `created_at` | `TIMESTAMPTZ`| `DEFAULT NOW()` | Thời điểm khởi tạo tài khoản |

### 3.2. Bảng `follows` (Mạng lưới kết nối có hướng)
| Tên cột | Kiểu dữ liệu | Khóa / Ràng buộc | Ý nghĩa nghiệp vụ |
| :--- | :--- | :--- | :--- |
| `follower_id` | `INT` | **PK**, **FK** `users.user_id` | Người thực hiện theo dõi |
| `following_id` | `INT` | **PK**, **FK** `users.user_id` | Người được theo dõi |
| `created_at` | `TIMESTAMPTZ`| `DEFAULT NOW()` | Thời điểm thiết lập quan hệ |
- **Ràng buộc toàn vẹn**: `chk_not_self_follow CHECK (follower_id <> following_id)`.

### 3.3. Bảng `research_groups` (Phòng Lab / Nhóm Nghiên cứu)
| Tên cột | Kiểu dữ liệu | Khóa / Ràng buộc | Ý nghĩa nghiệp vụ |
| :--- | :--- | :--- | :--- |
| `group_id` | `SERIAL` | **PRIMARY KEY** | Mã định danh phòng Lab |
| `name` | `VARCHAR(150)` | `NOT NULL` | Tên phòng thí nghiệm |
| `topic` | `VARCHAR(150)` | `NOT NULL` | Hướng nghiên cứu cốt lõi |
| `description` | `TEXT` | `NULLABLE` | Mục tiêu hoạt động và đề tài |
| `owner_id` | `INT` | **FK** `users.user_id` | Chủ nhiệm phòng Lab (thường là PI) |
| `avatar_url` | `TEXT` | `NULLABLE` | Ảnh đại diện phòng Lab |
| `invite_code` | `VARCHAR(64)` | `UNIQUE, NOT NULL` | Mã bảo mật mời gia nhập trực tiếp |
| `created_at` | `TIMESTAMPTZ`| `DEFAULT NOW()` | Ngày thành lập phòng Lab |

### 3.4. Bảng `group_members` (Thành viên Phòng Lab)
| Tên cột | Kiểu dữ liệu | Khóa / Ràng buộc | Ý nghĩa nghiệp vụ |
| :--- | :--- | :--- | :--- |
| `group_id` | `INT` | **PK**, **FK** `research_groups` | Mã phòng Lab |
| `user_id` | `INT` | **PK**, **FK** `users` | Mã thành viên |
| `role` | `VARCHAR(20)` | `CHECK ('owner','admin','member')` | Vai trò trong phòng Lab |
| `joined_at` | `TIMESTAMPTZ`| `DEFAULT NOW()` | Thời điểm chính thức tham gia |

### 3.5. Bảng `posts` (Bài viết / Công trình thảo luận)
| Tên cột | Kiểu dữ liệu | Khóa / Ràng buộc | Ý nghĩa nghiệp vụ |
| :--- | :--- | :--- | :--- |
| `post_id` | `SERIAL` | **PRIMARY KEY** | Mã định danh bài viết |
| `author_id` | `INT` | **FK** `users.user_id` | Tác giả bài viết |
| `group_id` | `INT` | **FK** `research_groups` | Phòng Lab sở hữu (NULL nếu đăng ngoài Lab) |
| `scope` | `VARCHAR(30)` | `CHECK ('community','personal','lab')`| Phân loại 3 phạm vi đăng tải |
| `post_type` | `VARCHAR(30)` | `CHECK ('discussion','question','research','paper_share')` | Thể loại bài đăng |
| `title` | `VARCHAR(300)` | `NOT NULL` | Tiêu đề bài viết |
| `content` | `TEXT` | `NOT NULL` | Toàn văn nội dung học thuật |
| `search_vector`| `tsvector` | `NULLABLE` | Vector từ tố cho FTS PostgreSQL |
| `created_at` | `TIMESTAMPTZ`| `DEFAULT NOW()` | Thời điểm đăng tải |

### 3.6. Bảng `tags` & `post_tags` (Phân loại Chủ đề Chuyên sâu)
- `tags`: `tag_id [PK]`, `name [UNIQUE, VARCHAR(50)]`.
- `post_tags`: `post_id [PK, FK]`, `tag_id [PK, FK]`. Phân rã Many-to-Many đạt chuẩn 4NF.

### 3.7. Bảng `post_likes` (Lượt Yêu Thích)
- `post_id [PK, FK]`, `user_id [PK, FK]`, `created_at [TIMESTAMPTZ]`.

### 3.8. Bảng `comments` (Cây Thảo luận Phân cấp)
| Tên cột | Kiểu dữ liệu | Khóa / Ràng buộc | Ý nghĩa nghiệp vụ |
| :--- | :--- | :--- | :--- |
| `comment_id` | `SERIAL` | **PRIMARY KEY** | Mã định danh bình luận |
| `post_id` | `INT` | **FK** `posts.post_id` | Thuộc bài viết nào |
| `user_id` | `INT` | **FK** `users.user_id` | Tác giả phản biện |
| `parent_id` | `INT` | **FK** `comments.comment_id` | Bình luận cha (NULL nếu là gốc) |
| `content` | `TEXT` | `NOT NULL` | Nội dung phản biện |
| `created_at` | `TIMESTAMPTZ`| `DEFAULT NOW()` | Thời điểm gửi |

### 3.9. Bảng `publications` & `publication_authors` (Ấn phẩm & Mạng lưới Đồng tác giả)
- `publications`: `publication_id [PK]`, `title`, `doi [UK]`, `venue`, `abstract`, `published_at`, `created_at`.
- `publication_authors`: `publication_id [PK, FK]`, `user_id [PK, FK]`, `author_order [INT]`.

### 3.10. Bảng `notifications` (Hệ thống Thông báo Nghiệp vụ)
| Tên cột | Kiểu dữ liệu | Khóa / Ràng buộc | Ý nghĩa nghiệp vụ |
| :--- | :--- | :--- | :--- |
| `notification_id`| `SERIAL` | **PRIMARY KEY** | Mã thông báo |
| `user_id` | `INT` | **FK** `users.user_id` | Người nhận thông báo |
| `sender_id` | `INT` | **FK** `users.user_id` | Người phát sinh hành động (NULL nếu là hệ thống) |
| `type` | `VARCHAR(50)` | `NOT NULL` | Loại thông báo: 'lab_invite', 'post_like', 'comment', 'follow', 'system' |
| `title` | `VARCHAR(200)` | `NOT NULL` | Tiêu đề tóm tắt |
| `message` | `TEXT` | `NOT NULL` | Chi tiết nội dung thông báo |
| `link` | `TEXT` | `NULLABLE` | Đường dẫn điều hướng trực tiếp |
| `is_read` | `BOOLEAN` | `DEFAULT FALSE` | Trạng thái đã đọc |
| `created_at` | `TIMESTAMPTZ`| `DEFAULT NOW()` | Thời điểm sinh thông báo |

---

## 4. Các Sơ Đồ Cấu Trúc Dữ Liệu & Kiến Trúc Chuyên Sâu

### 4.1. Sơ đồ Use Case Hệ thống (Actors & Primary Use Cases)

```mermaid
flowchart LR
    subgraph Actors["Tác Nhân Hệ Thống"]
        U_Scholar["Học Giả / Researcher"]
        U_PI["Trưởng Lab / PI"]
        U_Admin["Quản Trị Viên / Admin"]
    end

    subgraph UC_Post["Phân Hệ Bài Viết & Thảo Luận"]
        UC1["Đăng bài (Community / Personal / Lab)"]
        UC2["Bình luận đệ quy phân cấp"]
        UC3["Gán nhãn thẻ học thuật (Tags)"]
    end

    subgraph UC_Graph["Phân Hệ Đồ Thị & Mạng Lưới"]
        UC4["Theo dõi học giả (Follow Directed Edge)"]
        UC5["Duyệt mạng lưới N-Hop Reachability"]
        UC6["Tìm đường đi ngắn nhất (Shortest Path BFS)"]
    end

    subgraph UC_Admin["Phân Hệ Quản Trị & Thực Nghiệm"]
        UC7["Quản lý thành viên & Lab"]
        UC8["Sinh dữ liệu lớn (generate_series)"]
        UC9["So sánh hiệu năng & EXPLAIN Plan Tree"]
        UC10["Thực thi giao dịch đồng thời ACID"]
    end

    U_Scholar --> UC1
    U_Scholar --> UC2
    U_Scholar --> UC3
    U_Scholar --> UC4
    U_Scholar --> UC5

    U_PI --> UC1
    U_PI --> UC4
    U_PI --> UC6
    U_PI --> UC7

    U_Admin --> UC7
    U_Admin --> UC8
    U_Admin --> UC9
    U_Admin --> UC10
```

### 4.2. Sơ đồ Minh họa Cấu trúc Cây Bình Luận Đệ Quy (Hierarchical Adjacency List)

```mermaid
flowchart TD
    Root["Bình luận Gốc (comment_id: 1, parent_id: NULL, depth: 0)<br/>sort_path: [1]"]
    Reply1["Phản biện 1 (comment_id: 2, parent_id: 1, depth: 1)<br/>sort_path: [1, 2]"]
    Reply2["Phản biện 2 (comment_id: 3, parent_id: 1, depth: 1)<br/>sort_path: [1, 3]"]
    Nested1["Phản hồi con (comment_id: 4, parent_id: 2, depth: 2)<br/>sort_path: [1, 2, 4]"]
    Nested2["Phản hồi cháu (comment_id: 5, parent_id: 4, depth: 3)<br/>sort_path: [1, 2, 4, 5]"]

    Root --> Reply1
    Root --> Reply2
    Reply1 --> Nested1
    Nested1 --> Nested2

    classDef root fill:#dbeafe,stroke:#2563eb,stroke-width:2px;
    classDef rep1 fill:#fef3c7,stroke:#d97706,stroke-width:1.5px;
    classDef rep2 fill:#dcfce7,stroke:#16a34a,stroke-width:1.5px;
    classDef rep3 fill:#f3e8ff,stroke:#9333ea,stroke-width:1.5px;

    class Root root;
    class Reply1,Reply2 rep1;
    class Nested1 rep2;
    class Nested2 rep3;
```

### 4.3. Sơ đồ Minh họa Đồ Thị Theo Dõi Có Hướng & Phát Hiện Chu Trình

```mermaid
flowchart LR
    U1["Học giả 1 (Stonebraker)"]
    U2["Học giả 2 (Widom)"]
    U3["Học giả 3 (LeCun)"]
    U4["Học giả 4 (Ullman)"]

    U1 -->|follows| U2
    U2 -->|follows| U3
    U3 -->|follows| U1
    U1 -.->|Chu trình khép kín: 1 -> 2 -> 3 -> 1| U1

    U2 -->|follows| U4
    U4 -->|follows| U3

    classDef cycleNode fill:#fee2e2,stroke:#dc2626,stroke-width:2px;
    classDef regNode fill:#e0f2fe,stroke:#0284c7,stroke-width:1.5px;

    class U1,U2,U3 cycleNode;
    class U4 regNode;
```

### 4.4. Sơ đồ Kiến trúc Chỉ mục Vật lý B-Tree & GIN (PostgreSQL Indexing Layout)

```mermaid
flowchart TD
    subgraph Storage["Tầng Lưu Trữ Quan Hệ (Heap Tuples)"]
        HeapPosts["Table posts (Heap Pages 8KB)"]
        HeapFollows["Table follows (Heap Pages 8KB)"]
        HeapComments["Table comments (Heap Pages 8KB)"]
    end

    subgraph Indexes["Tầng Chỉ Mục Vật Lý (Index Trees)"]
        GIN_Post["Chỉ mục GIN: idx_posts_search<br/>(search_vector: Lexeme Entries -> TID Lists)"]
        BTree_Seek["Chỉ mục B-Tree Composite: idx_posts_created_id<br/>((created_at DESC, post_id DESC) -> O(log N) Keyset Seek)"]
        BTree_Follow["Chỉ mục B-Tree Composite: idx_follows_follower<br/>((follower_id, following_id) -> Tối ưu CTE đệ quy)"]
        BTree_Comment["Chỉ mục B-Tree: idx_comments_parent<br/>((parent_id) -> O(log N) Tree Join)"]
    end

    GIN_Post -.->|TID Lookup| HeapPosts
    BTree_Seek -.->|Direct Pointer Seek| HeapPosts
    BTree_Follow -.->|Fast Index Only Scan| HeapFollows
    BTree_Comment -.->|Index Scan| HeapComments
```

