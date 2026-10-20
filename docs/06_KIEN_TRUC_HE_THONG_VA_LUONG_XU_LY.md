# 06. KIẾN TRÚC HỆ THỐNG & SƠ ĐỒ TUẦN TỰ (SEQUENCE DIAGRAMS)

---

## 1. Kiến trúc Hệ thống 3 Tầng (3-Tier Architecture)

Hệ thống **ARI Research Lab** được xây dựng theo mô hình phân tầng chặt chẽ, tách biệt hoàn toàn giữa giao diện người dùng, logic nghiệp vụ máy chủ và tầng dữ liệu quan hệ:

```mermaid
flowchart TD
    subgraph PresentationTier["1. TẦNG TRÌNH DIỄN (Client - Next.js 16 + React 19)"]
        UI_Feed["Academic Feed & Posts"]
        UI_Tree["Recursive CommentTree Component"]
        UI_Canvas["Interactive Network Canvas (HTML5)"]
        UI_Lab["PostgreSQL SQL Lab Dashboard"]
        UI_State["Active Researcher Persona Switcher"]
    end

    subgraph ApplicationTier["2. TẦNG NGHIỆP VỤ (Backend - Node.js + Express + TypeScript)"]
        API_GW["REST API Gateway (Cổng 5000)"]
        CTL_Net["NetworkController (Reachability, PathFinder, Cycles)"]
        CTL_Comm["CommentsController (Tree CTE, Recursive Builder)"]
        CTL_Post["PostsController (Keyset, FTS tsvector)"]
        CTL_Lab["LabController (EXPLAIN ANALYZE, Index Benchmarks)"]
        DB_Pool["PostgreSQL pg.Pool Connection Manager"]
    end

    subgraph DataTier["3. TẦNG CƠ SỞ DỮ LIỆU (PostgreSQL 18.1 RDBMS)"]
        PG_Engine["PostgreSQL Execution Engine"]
        PG_CTE["WITH RECURSIVE & WorkTable Processor"]
        PG_Indexes["B-Tree Composite & GIN Vector Indexes"]
        PG_Tables["11 Tables (users, follows, comments, posts, ...)"]
    end

    PresentationTier -->|HTTP REST JSON Request| ApplicationTier
    ApplicationTier -->|SQL Statements & EXPLAIN| DataTier
    DataTier -->|Tuples & Query Plans JSON| ApplicationTier
    ApplicationTier -->|Processed Models & DTOs| PresentationTier
```

---

## 2. Sơ đồ Tuần tự (Sequence Diagrams)

### 2.1. Sơ đồ Tuần tự: Truy vấn & Hiển thị Cây Bình luận Đa cấp

```mermaid
sequenceDiagram
    autonumber
    actor User as Nhà nghiên cứu (User)
    participant Client as Next.js Client (CommentTree)
    participant Server as Express Server (CommentsController)
    participant DB as PostgreSQL 18 Engine

    User->>Client: Truy cập trang chi tiết bài viết (/posts/1)
    Client->>Server: GET /api/comments/post/1
    Server->>DB: Thực thi WITH RECURSIVE comment_tree AS (...) ORDER BY sort_path ASC
    Note over DB: 1. Anchor: Lấy root comments (parent_id IS NULL)<br/>2. Recursive: Nối con vào cha, tích lũy sort_path<br/>3. Sắp xếp thứ tự phân cấp Depth-First
    DB-->>Server: Trả về danh sách bình luận kèm depth và sort_path
    Server-->>Client: JSON { totalComments, executionMs, comments }
    Client-->>User: Render cây bình luận lồng nhau, thụt lề theo depth
    
    User->>Client: Bấm "Reply" tại bình luận #2, nhập nội dung và bấm gửi
    Client->>Server: POST /api/comments/post/1 { parent_id: 2, content: "..." }
    Server->>DB: INSERT INTO comments (post_id, parent_id, content) VALUES (1, 2, '...')
    DB-->>Server: Trả về bản ghi comment mới
    Server-->>Client: HTTP 201 Created
    Client->>Server: Tự động kích hoạt làm mới cây: GET /api/comments/post/1
    Server-->>Client: Trả về cây cập nhật
    Client-->>User: Bình luận mới xuất hiện ngay dưới nhánh #2
```

---

### 2.2. Sơ đồ Tuần tự: Dò tìm Đường đi Ngắn nhất Giữa 2 Nhà Nghiên cứu

```mermaid
sequenceDiagram
    autonumber
    actor Analyst as Chuyên viên / Người dùng
    participant UI as Network Explorer (/network)
    participant API as NetworkController
    participant PG as PostgreSQL 18 Engine

    Analyst->>UI: Chọn Source (A = 1) và Target (B = 3) -> Bấm "Compute Path"
    UI->>API: GET /api/network/path?sourceId=1&targetId=3&maxDepth=5
    API->>PG: Thực thi WITH RECURSIVE path_finder AS (...)
    Note over PG: 1. Anchor: follower_id = 1<br/>2. Recursive: BFS mở rộng cạnh follow tiếp theo<br/>3. Chặn chu trình: NOT (f.following_id = ANY(pf.path))<br/>4. Dừng khi chạm targetId = 3
    PG-->>API: Trả về các paths tìm thấy kèm mảng các nút [1, 7, 6, 3]
    API->>PG: Lấy danh sách Mutual Followers giữa A và B
    PG-->>API: Danh sách người theo dõi chung
    API-->>UI: JSON { shortestDistance: 3, paths, mutualFollowers, executionMs }
    UI-->>Analyst: Hiển thị bảng kết quả đường đi
    UI->>UI: Highlight chuỗi liên kết 1 -> 7 -> 6 -> 3 sáng rực trên Canvas
```

---

### 2.3. Sơ đồ Tuần tự: Thực nghiệm EXPLAIN (ANALYZE, BUFFERS) từ SQL Lab

```mermaid
sequenceDiagram
    autonumber
    actor Tester as Kỹ sư Cơ sở dữ liệu
    participant LabUI as SQL Optimization Lab (/sql-lab)
    participant LabAPI as LabController
    participant PG as PostgreSQL 18 Engine

    Tester->>LabUI: Chọn bài toán "N-Hop Reachability" -> Bấm "Execute EXPLAIN"
    LabUI->>LabAPI: POST /api/lab/explain { queryType: "reachability", params: { userId: 1, maxDepth: 3 } }
    LabAPI->>PG: EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) WITH RECURSIVE ...
    Note over PG: Bộ thực thi đo lường:<br/>- Planning Time thực tế<br/>- Execution Time thực tế<br/>- Số khối Shared Hit Blocks từ shared_buffers<br/>- Cây nút: Recursive Union -> WorkTable Scan
    PG-->>LabAPI: Trả về Kế hoạch thực thi chi tiết
    LabAPI->>PG: EXPLAIN (ANALYZE, BUFFERS) WITH RECURSIVE ... (Text format)
    PG-->>LabAPI: Trả về chuỗi Text Plan dạng cây
    LabAPI-->>LabUI: JSON { planningTimeMs, executionTimeMs, planTree, explainText }
    LabUI-->>Tester: Hiển thị thẻ KPI đo lường và hiển thị trực quan cây thực thi PostgreSQL
```
