-- ==============================================================================
-- KỊCH BẢN GIAO DỊCH (TRANSACTIONS), ĐỒNG THỜI (CONCURRENCY) & DEADLOCK
-- Hệ Quản Trị Cơ Sở Dữ Liệu: PostgreSQL 18+
-- ==============================================================================
-- Bao gồm:
-- 1. Kịch bản Thành công (COMMIT)
-- 2. Kịch bản Lỗi giữa chừng & SAVEPOINT (ROLLBACK)
-- 3. Kịch bản Cạnh tranh đồng thời (Concurrency: Lost Update & SELECT FOR UPDATE)
-- 4. Kịch bản Phân tích các Mức cô lập giao dịch (Isolation Levels: Read Committed, Repeatable Read, Serializable)
-- 5. Kịch bản Phát sinh Bế tắc (Deadlock) & Cơ chế giải quyết của PostgreSQL
-- ==============================================================================

-- ==============================================================================
-- KỊCH BẢN 1: GIAO DỊCH THÀNH CÔNG (SUCCESSFUL TRANSACTION - COMMIT)
-- Nghiệp vụ: Học giả đăng một bài viết Lab nội bộ mới, gán các thẻ học thuật (Tags),
-- và tự động gửi thông báo đến tất cả các thành viên hiện tại của phòng Lab.
-- Toàn bộ chuỗi thao tác phải thỏa mãn tính Nguyên tử (Atomicity): hoặc thành công
-- tất cả, hoặc không có thay đổi nào được lưu.
-- ==============================================================================
BEGIN;

-- Bước 1: Thêm bài đăng mới
INSERT INTO posts (author_id, group_id, scope, post_type, title, content)
VALUES (
    1, 
    1, 
    'lab', 
    'research', 
    'Cập nhật tiến độ dự án Nghiên cứu CSDL Nâng cao & Truy vấn Đồ thị',
    'Nhóm đã hoàn thành việc xây dựng benchmark và tối ưu hóa CTE đệ quy.'
)
RETURNING post_id;
-- Giả sử post_id vừa sinh ra là 100

-- Bước 2: Thêm thẻ học thuật vào post_tags
INSERT INTO tags (name) VALUES ('GraphDatabase')
ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO post_tags (post_id, tag_id)
SELECT 
    currval(pg_get_serial_sequence('posts', 'post_id')),
    tag_id 
FROM tags 
WHERE name = 'GraphDatabase'
ON CONFLICT DO NOTHING;

-- Bước 3: Gửi thông báo đến toàn bộ thành viên trong phòng Lab (trừ chính tác giả)
INSERT INTO notifications (user_id, sender_id, type, title, message, link, is_read)
SELECT 
    gm.user_id,
    1,
    'system',
    'Bài đăng mới trong phòng Lab của bạn',
    'GS. Nguyễn Văn A vừa đăng một tiến độ nghiên cứu mới trong Lab.',
    '/groups/1',
    FALSE
FROM group_members gm
WHERE gm.group_id = 1 AND gm.user_id <> 1;

-- Bước 4: Xác nhận hoàn tất thành công
COMMIT;


-- ==============================================================================
-- KỊCH BẢN 2: LỖI GIỮA CHỪNG & ĐIỂM LƯU TẠM (ROLLBACK & SAVEPOINT)
-- Nghiệp vụ: Cập nhật thông tin phòng Lab và thêm danh sách thành viên mới.
-- Trong quá trình thêm thành viên thứ 2, xảy ra lỗi vi phạm ràng buộc khóa ngoại
-- hoặc người dùng không tồn tại. Hệ thống sử dụng SAVEPOINT để khôi phục lại
-- thao tác lỗi mà không làm hủy hoại các thao tác hợp lệ trước đó.
-- ==============================================================================
BEGIN;

-- Thao tác 1: Cập nhật mô tả phòng Lab
UPDATE research_groups 
SET description = 'Phòng nghiên cứu chuyên sâu về Hệ cơ sở dữ liệu lớn và Trí tuệ nhân tạo'
WHERE group_id = 1;

-- Thiết lập điểm lưu tạm thời gian (Savepoint A)
SAVEPOINT savepoint_after_update;

-- Thao tác 2 (Hợp lệ): Thêm thành viên hợp lệ user_id = 2
INSERT INTO group_members (group_id, user_id, role, joined_at)
VALUES (1, 2, 'member', NOW())
ON CONFLICT (group_id, user_id) DO NOTHING;

-- Thiết lập điểm lưu tạm thứ hai (Savepoint B)
SAVEPOINT savepoint_valid_member;

-- Thao tác 3 (Cố tình gây lỗi): Thêm người dùng không tồn tại (user_id = 999999)
-- Vi phạm ràng buộc khóa ngoại: FOREIGN KEY (user_id) REFERENCES users(user_id)
INSERT INTO group_members (group_id, user_id, role, joined_at)
VALUES (1, 999999, 'member', NOW());
-- -> PostgreSQL sinh mã lỗi: ERROR: insert or update on table "group_members" violates foreign key constraint

-- Phục hồi lại trạng thái trước khi thực hiện Thao tác 3
ROLLBACK TO SAVEPOINT savepoint_valid_member;

-- Thao tác 4: Tiếp tục thực hiện thao tác hợp lệ khác
INSERT INTO notifications (user_id, sender_id, type, title, message, link)
VALUES (1, 1, 'system', 'Cập nhật Lab', 'Đã cập nhật mô tả phòng lab thành công.', '/groups/1');

-- Giải phóng savepoint và xác nhận giao dịch
RELEASE SAVEPOINT savepoint_valid_member;
COMMIT;


-- ==============================================================================
-- KỊCH BẢN 3: CẠNH TRANH ĐỒNG THỜI (CONCURRENCY) & LOST UPDATE
-- Mô phỏng hai phiên làm việc (Session 1 và Session 2) cùng đồng thời thực hiện
-- cập nhật trạng thái trên cùng một bản ghi.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- Trường hợp A: Hiện tượng Mất mát bản ghi (Lost Update) khi KHÔNG có khóa bi quan
-- ------------------------------------------------------------------------------
-- Giả sử cả 2 phiên cùng muốn cập nhật trường bio của user_id = 1
-- Session 1:
-- BEGIN;
-- SELECT bio FROM users WHERE user_id = 1; -- Đọc bio cũ: "Giáo sư Viện CNTT"
-- (Session 1 tính toán chuẩn bị nối thêm: "... | Thành viên IEEE")

-- Session 2 (Chạy song song):
-- BEGIN;
-- SELECT bio FROM users WHERE user_id = 1; -- Đọc bio cũ: "Giáo sư Viện CNTT"
-- UPDATE users SET bio = 'Giáo sư Viện CNTT | Trưởng Lab ARI' WHERE user_id = 1;
-- COMMIT;

-- Session 1 (Ghi đè sau đó):
-- UPDATE users SET bio = 'Giáo sư Viện CNTT | Thành viên IEEE' WHERE user_id = 1;
-- COMMIT;
-- HẬU QUẢ: Cập nhật của Session 2 ("Trưởng Lab ARI") bị mất hoàn toàn (Lost Update)!

-- ------------------------------------------------------------------------------
-- Trường hợp B: Giải pháp Ngăn chặn Lost Update bằng Khóa dòng bi quan (SELECT FOR UPDATE)
-- ------------------------------------------------------------------------------
-- [PHIÊN 1 (SESSION 1)]:
BEGIN;
SELECT user_id, bio 
FROM users 
WHERE user_id = 1 
FOR UPDATE; -- Khóa độc quyền (Exclusive Row Lock) trên hàng user_id = 1

-- [PHIÊN 2 (SESSION 2 - Chạy đồng thời trên kết nối khác)]:
-- BEGIN;
-- SELECT user_id, bio FROM users WHERE user_id = 1 FOR UPDATE;
-- --> Kết quả: PHIÊN 2 BỊ TREO CHỜ (BLOCKED) cho đến khi Phiên 1 COMMIT hoặc ROLLBACK.

-- [PHIÊN 1 TIẾP TỤC]:
UPDATE users 
SET bio = bio || ' | Thành viên IEEE' 
WHERE user_id = 1;
COMMIT; -- Giải phóng khóa hàng!

-- --> Lúc này PHIÊN 2 mới được đánh thức, đọc được dữ liệu MỚI NHẤT đã COMMIT của Phiên 1,
-- tránh hoàn toàn hiện tượng Lost Update.


-- ==============================================================================
-- KỊCH BẢN 4: SO SÁNH CÁC MỨC CÔ LẬP GIAO DỊCH (TRANSACTION ISOLATION LEVELS)
-- PostgreSQL hỗ trợ: Read Committed, Repeatable Read, và Serializable.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- Phân tích 1: Non-repeatable Read trong READ COMMITTED (Mặc định)
-- ------------------------------------------------------------------------------
-- Session 1:
BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;
SELECT COUNT(*) FROM posts WHERE author_id = 1; -- Kết quả: 3 bài viết

-- Session 2 (chạy ngoài):
-- INSERT INTO posts (author_id, title, content, scope) VALUES (1, 'Bài mới', 'Nội dung', 'personal');
-- COMMIT;

-- Session 1 (truy vấn lại trong cùng một giao dịch):
SELECT COUNT(*) FROM posts WHERE author_id = 1; -- Kết quả: 4 bài viết (Bị Non-repeatable Read!)
COMMIT;

-- ------------------------------------------------------------------------------
-- Phân tích 2: Khắc phục với REPEATABLE READ (Snapshot Isolation)
-- ------------------------------------------------------------------------------
-- Session 1:
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ;
SELECT COUNT(*) FROM posts WHERE author_id = 1; -- Kết quả: 3 bài viết

-- Session 2 (chạy ngoài và commit một bài mới cho author_id = 1):
-- INSERT INTO posts (author_id, title, content, scope) VALUES (1, 'Bài nữa', 'Nội dung', 'personal');
-- COMMIT;

-- Session 1 (truy vấn lại):
SELECT COUNT(*) FROM posts WHERE author_id = 1; 
-- Kết quả VẪN LÀ 3! Vì Session 1 đọc từ snapshot thời điểm bắt đầu giao dịch.
COMMIT;


-- ==============================================================================
-- KỊCH BẢN 5: BẾ TẮC (DEADLOCK) & CƠ CHẾ GIẢI QUYẾT TỰ ĐỘNG CỦA POSTGRESQL
-- Mô phỏng chu trình phụ thuộc khóa (Wait-for Graph Cycle) giữa hai phiên làm việc.
-- ==============================================================================

-- BƯỚC 1: Khởi động Phiên làm việc 1 (Session 1)
-- BEGIN;
-- UPDATE posts SET title = 'Title A sửa bởi Session 1' WHERE post_id = 1;
-- (Session 1 đang giữ khóa Row Exclusive trên post_id = 1)

-- BƯỚC 2: Khởi động Phiên làm việc 2 (Session 2)
-- BEGIN;
-- UPDATE posts SET title = 'Title B sửa bởi Session 2' WHERE post_id = 2;
-- (Session 2 đang giữ khóa Row Exclusive trên post_id = 2)

-- BƯỚC 3: Phiên 1 cố gắng cập nhật post_id = 2
-- UPDATE posts SET title = 'Title B sửa tiếp bởi Session 1' WHERE post_id = 2;
-- -> Session 1 bị chặn (BLOCKED) vì đang chờ Session 2 giải phóng khóa trên post_id = 2.

-- BƯỚC 4: Phiên 2 cố gắng cập nhật post_id = 1
-- UPDATE posts SET title = 'Title A sửa tiếp bởi Session 2' WHERE post_id = 1;
-- -> Session 2 bị chặn vì đang chờ Session 1 giải phóng khóa trên post_id = 1.

-- BƯỚC 5: HÀNH ĐỘNG CỦA POSTGRESQL:
-- Cơ chế Deadlock Detector của PostgreSQL quét đồ thị chờ (Wait-For Graph).
-- Khi thời gian vượt quá tham số `deadlock_timeout` (mặc định 1000ms = 1 giây):
-- PostgreSQL tự động hủy một trong hai Transaction và ném ra thông báo lỗi:
--
-- ERROR:  deadlock detected
-- DETAIL: Process 1421 waits for ShareLock on transaction 20452; blocked by process 1422.
--         Process 1422 waits for ShareLock on transaction 20451; blocked by process 1421.
-- HINT:   See server log for query details.
-- CONTEXT: while updating tuple (0,2) in relation "posts"
--
-- Biện pháp phòng tránh Deadlock trong hệ thống:
-- 1. Luôn cập nhật hoặc khóa các đối tượng theo một thứ tự cố định (ví dụ: sắp xếp ID tăng dần).
-- 2. Giữ giao dịch ngắn gọn, commit càng sớm càng tốt.
-- 3. Sử dụng NOWAIT hoặc lock_timeout để tránh treo vô hạn:
--    SELECT * FROM posts WHERE post_id = 2 FOR UPDATE NOWAIT;
