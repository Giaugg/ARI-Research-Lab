# TÀI LIỆU DỰ ÁN: MẠNG CỘNG TÁC VÀ THẢO LUẬN HỌC THUẬT (ARI RESEARCH LAB)

Chào mừng bạn đến với bộ tài liệu hoàn chỉnh của dự án **ARI Research Lab** — nền tảng mạng xã hội học thuật kết hợp phòng thí nghiệm tối ưu hóa cơ sở dữ liệu **PostgreSQL 18** và **truy vấn đệ quy (`WITH RECURSIVE`)**.

---

## 📚 Mục lục Tài liệu Chi tiết

| Tài liệu | Mô tả Nội dung Chính |
| :--- | :--- |
| **[01. Tổng quan & Quá trình Lên ý tưởng](file:///c:/Users/1/Desktop/DA/ARI%20Research%20Lab/docs/01_TONG_QUAN_VA_Y_TUONG.md)** | Bối cảnh thực tiễn mạng xã hội khoa học, lý do chọn đề tài, 3 cấu trúc dữ liệu trọng tâm (Graph, Tree, Many-to-Many), mục tiêu nghiên cứu học thuật vượt ra ngoài CRUD thông thường. |
| **[02. Phân tích Yêu cầu & Thiết kế Use Case](file:///c:/Users/1/Desktop/DA/ARI%20Research%20Lab/docs/02_YEU_CAU_VA_USE_CASE.md)** | Xác định các tác nhân (Researcher, Lab Owner, DB Analyst), 5 phân hệ yêu cầu chức năng (FR), yêu cầu phi chức năng (NFR), Sơ đồ Use Case tổng thể Mermaid, và đặc tả chi tiết các Use Case cốt lõi. |
| **[03. Thiết kế CSDL: ERD & Sơ đồ Quan hệ](file:///c:/Users/1/Desktop/DA/ARI%20Research%20Lab/docs/03_THIET_KE_CSDL_ERD_RELATIONAL.md)** | Sơ đồ Thực thể - Liên kết (ERD Diagram chuẩn Mermaid), Sơ đồ Quan hệ (Relational Schema), Từ điển dữ liệu chi tiết cho 11 bảng, các ràng buộc toàn vẹn (`chk_not_self_follow`, `ON DELETE CASCADE`), và chiến lược thiết kế chỉ mục (Indexing Strategy). |
| **[04. Phân tích Truy vấn Đệ quy SQL Nâng cao](file:///c:/Users/1/Desktop/DA/ARI%20Research%20Lab/docs/04_TRUY_VAN_DE_QUY_SQL_NANG_CAO.md)** | Cơ sở đại số quan hệ và cơ chế đánh giá bán ngây thơ (Semi-naïve Evaluation / WorkTable) trong PostgreSQL. Chi tiết mã nguồn SQL và giải thuật cho 5 bài toán: N-Hop Reachability, Shortest Path Finder, Threaded Comments Tree (`sort_path`), Collaborative Recommendation, và Cycle Detection. |
| **[05. Báo cáo Thực nghiệm & Tối ưu hóa PostgreSQL](file:///c:/Users/1/Desktop/DA/ARI%20Research%20Lab/docs/05_THUC_NGHIEM_TOI_UU_HOA_POSTGRESQL.md)** | Phương pháp đo lường với `EXPLAIN (ANALYZE, BUFFERS)`. Báo cáo thực nghiệm so sánh: Index Scan vs Seq Scan (tăng tốc 7x), Keyset Pagination $O(\log N)$ vs OFFSET/LIMIT $O(N)$ (tăng tốc 133x), GIN Index Full-Text Search vs ILIKE, và đường cong suy biến chi phí khi mở rộng mạng lưới. |
| **[06. Kiến trúc Hệ thống & Sơ đồ Tuần tự](file:///c:/Users/1/Desktop/DA/ARI%20Research%20Lab/docs/06_KIEN_TRUC_HE_THONG_VA_LUONG_XU_LY.md)** | Kiến trúc phân tầng 3-Tier (Next.js 16 Presentation Tier, Node.js Application Tier, PostgreSQL Data Tier). 3 Sơ đồ tuần tự (Sequence Diagrams) bằng Mermaid mô tả luồng thực thi cây thảo luận, luồng dò tìm đường đi ngắn nhất, và luồng phân tích kế hoạch EXPLAIN. |

---

## 🚀 Khởi chạy Hệ thống để Thử nghiệm Thực tế

```bash
# 1. Khởi động Backend (Node.js API - Cổng 5000)
cd server
npm run dev

# 2. Khởi động Client (Next.js App - Cổng 3000)
cd client
npm run dev

# 3. Truy cập Trực tiếp từ Trình duyệt:
# - Trang chủ mạng học thuật: http://localhost:3000
# - Khám phá Đồ thị & Đường đi: http://localhost:3000/network
# - Cây thảo luận phân cấp: http://localhost:3000/posts/1
# - Phòng thí nghiệm SQL Lab: http://localhost:3000/sql-lab
```
