# TÀI LIỆU DỰ ÁN: MẠNG CỘNG TÁC VÀ THẢO LUẬN HỌC THUẬT (ARI RESEARCH LAB)

Chào mừng bạn đến với bộ tài liệu hoàn chỉnh của dự án **ARI Research Lab** — nền tảng mạng xã hội học thuật kết hợp phòng thí nghiệm tối ưu hóa cơ sở dữ liệu **PostgreSQL 18**, **truy vấn đệ quy (`WITH RECURSIVE`)**, **CSDL Hướng đối tượng (OODBMS / OQL)** và **chuẩn hóa quan hệ 3NF/BCNF/4NF**.

---

## 📚 Mục lục Bộ Tài liệu Đồ án (Đầy Đủ 8 Chuyên Đề)

| Tài liệu | Mô tả Nội dung Chính |
| :--- | :--- |
| **[⭐ BÁO CÁO ĐỒ ÁN TOÀN DIỆN (Markdown)](file:///c:/Users/1/Desktop/DA/ARI%20Research%20Lab/docs/BAO_CAO_DO_AN_CSDL_NANG_CAO.md)** | **Báo cáo chuẩn học thuật 6 phần tương ứng thang điểm 10.0 phục vụ bảo vệ đồ án trước hội đồng giảng viên.** |
| **[📄 BÁO CÁO ĐỒ ÁN TOÀN DIỆN (Word DOCX)](file:///c:/Users/1/Desktop/DA/ARI%20Research%20Lab/docs/BAO_CAO_DO_AN_CSDL_NANG_CAO.docx)** | **Bản Word .docx định dạng chuẩn in ấn và nộp bài chính thức, có bảng đối chiếu 10.0, phụ thuộc hàm, OQL, SQL nâng cao.** |
| **[01. Tổng quan & Quá trình Lên ý tưởng](file:///c:/Users/1/Desktop/DA/ARI%20Research%20Lab/docs/01_TONG_QUAN_VA_Y_TUONG.md)** | Bối cảnh thực tiễn mạng xã hội khoa học, 3 cấu trúc dữ liệu trọng tâm (Graph, Tree, Many-to-Many), mục tiêu nghiên cứu học thuật. |
| **[02. Phân tích Yêu cầu & Thiết kế Use Case](file:///c:/Users/1/Desktop/DA/ARI%20Research%20Lab/docs/02_YEU_CAU_VA_USE_CASE.md)** | Xác định tác nhân, 5 phân hệ yêu cầu chức năng (FR), yêu cầu phi chức năng (NFR), Sơ đồ Use Case tổng thể Mermaid. |
| **[03. Thiết kế CSDL: Mô hình EER & Quan hệ](file:///c:/Users/1/Desktop/DA/ARI%20Research%20Lab/docs/03_THIET_KE_CSDL_ERD_RELATIONAL.md)** | Sơ đồ EER có chuyên biệt hóa/tổng quát hóa (`User` -> 4 vai trò, `Post` -> 3 phạm vi), lược đồ quan hệ và từ điển dữ liệu 12 bảng. |
| **[04. Phân tích Truy vấn Đệ quy SQL Nâng cao](file:///c:/Users/1/Desktop/DA/ARI%20Research%20Lab/docs/04_TRUY_VAN_DE_QUY_SQL_NANG_CAO.md)** | Cơ chế Semi-naïve Evaluation & WorkTable của PostgreSQL. Giải thuật 5 bài toán: N-Hop Reachability, Shortest Path BFS, Threaded Comments Tree, Recommendation, Cycle Detection. |
| **[05. Báo cáo Thực nghiệm & Tối ưu hóa PostgreSQL](file:///c:/Users/1/Desktop/DA/ARI%20Research%20Lab/docs/05_THUC_NGHIEM_TOI_UU_HOA_POSTGRESQL.md)** | Đo lường với `EXPLAIN ANALYZE`: Index Scan vs Seq Scan (nhanh gấp 7x), Keyset Pagination vs OFFSET/LIMIT (nhanh gấp 133x), GIN Index vs ILIKE. |
| **[06. Kiến trúc Hệ thống & Luồng Xử lý](file:///c:/Users/1/Desktop/DA/ARI%20Research%20Lab/docs/06_KIEN_TRUC_HE_THONG_VA_LUONG_XU_LY.md)** | Kiến trúc 3-Tier (Next.js 16 + Node.js Express + PostgreSQL 18). 3 Sơ đồ tuần tự (Sequence Diagrams) mô tả luồng thảo luận đệ quy, tìm đường ngắn nhất và phân tích kế hoạch query. |
| **[07. CSDL Hướng Đối Tượng & OQL](file:///c:/Users/1/Desktop/DA/ARI%20Research%20Lab/docs/07_CSDL_HUONG_DOI_TUONG_VA_OQL.md)** | Thiết kế phân hệ 6 lớp ODL có OID, kế thừa, tập hợp, methods. 5 truy vấn OQL chuẩn ODMG. Phân biệt sâu sắc và ánh xạ chi tiết OQL $\to$ JPQL/JDOQL trên ObjectDB (`objectdb.com`). |
| **[08. Phụ thuộc Hàm, Chuẩn hóa 3NF/BCNF & 4NF](file:///c:/Users/1/Desktop/DA/ARI%20Research%20Lab/docs/08_PHU_THUOC_HAM_CHUAN_HOA_3NF_BCNF_4NF.md)** | Xác định tập phụ thuộc hàm $F$, thuật toán bao đóng $X^+$, tìm khóa chính quy, phủ tối tiểu $F_c$, phân tích 3NF/BCNF, chứng minh Lossless Join & Dependency Preservation, phân tích phụ thuộc đa trị (MVDs) và chuẩn hóa 4NF. |

---

## 🛠️ Bộ Scripts SQL Sẵn Sàng Chạy Lại (Reproducible Scripts)

1. **[schema.sql](file:///c:/Users/1/Desktop/DA/ARI%20Research%20Lab/server/src/db/schema.sql)**: Khởi tạo toàn bộ 12 bảng, khóa ngoại, ràng buộc CHECK và trigger cập nhật `tsvector`.
2. **[indexes.sql](file:///c:/Users/1/Desktop/DA/ARI%20Research%20Lab/server/src/db/indexes.sql)**: Khởi tạo hệ thống chỉ mục vật lý B-tree, GIN, và Composite Indexes.
3. **[seed.ts](file:///c:/Users/1/Desktop/DA/ARI%20Research%20Lab/server/src/db/seed.ts)**: Nạp dữ liệu mẫu thực tế gồm 10 học giả, 25 quan hệ đồ thị, 4 phòng Lab, bài báo và cây bình luận.
4. **[advanced_queries.sql](file:///c:/Users/1/Desktop/DA/ARI%20Research%20Lab/server/src/db/advanced_queries.sql)**: 12 truy vấn SQL nâng cao (Correlated subquery, NOT EXISTS, Window functions, Stored Procedure, Dynamic SQL, Recursive CTEs).
5. **[transaction_scenarios.sql](file:///c:/Users/1/Desktop/DA/ARI%20Research%20Lab/server/src/db/transaction_scenarios.sql)**: Toàn bộ kịch bản giao dịch: COMMIT, ROLLBACK với SAVEPOINT, cạnh tranh Lost Update, 3 mức cô lập Isolation Levels, và kịch bản Deadlock.

---

## 🚀 Khởi chạy Nhanh Hệ thống

```bash
# 1. Khởi động Backend (Node.js API - Cổng 5000)
cd server
npm run dev

# 2. Khởi động Client (Next.js App - Cổng 3000)
cd client
npm run dev

# 3. Mở các phân hệ chính trên Trình duyệt:
# - Trang chủ & Lọc 3 phạm vi bài đăng: http://localhost:3000
# - Khám phá Mạng lưới & Tìm đường đi ngắn nhất: http://localhost:3000/network
# - Cây thảo luận phân cấp sâu: http://localhost:3000/posts/1
# - Phòng thí nghiệm SQL Lab & Benchmark: http://localhost:3000/sql-lab
# - Trang thông báo: http://localhost:3000/notifications
# - Đăng nhập phân quyền: http://localhost:3000/login
```
