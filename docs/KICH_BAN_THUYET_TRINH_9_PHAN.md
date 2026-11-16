# KỊCH BẢN THUYẾT TRÌNH CHI TIẾT: 9 PHẦN CHUẨN BÁO CÁO ĐỒ ÁN
## ĐỀ TÀI: NỀN TẢNG MẠNG CỘNG TÁC HỌC THUẬT VÀ PHÒNG THÍ NGHIỆM TỐI ƯU HÓA CƠ SỞ DỮ LIỆU (ARI RESEARCH LAB)
**Thời lượng dự kiến toàn bài:** 12 – 15 phút  
**Chuẩn đầu ra môn học:** Đáp ứng trọn vẹn 10.0 / 10.0 điểm theo Bareme đánh giá học thuật

---

## PHẦN 1: GIỚI THIỆU VÀ MỤC TIÊU (1 – 1.5 phút)

### 1. Ý chính trên Slide
- **Tên đề tài**: Nền tảng Mạng Cộng tác Học thuật & Phòng thí nghiệm Tối ưu hóa CSDL (ARI Research Lab)
- **Bối cảnh thực tiễn**:
  - Tri thức khoa học và hoạt động cộng tác tại các viện nghiên cứu, trường đại học đang bị phân mảnh.
  - Các mạng xã hội đại chúng (Facebook, LinkedIn) không hỗ trợ cấu trúc dữ liệu học thuật đặc thù: liên kết đồng tác giả, bài báo quốc tế (DOI), và phản biện đa tầng.
- **Mục tiêu nghiên cứu**:
  - Vượt ra ngoài các bài toán CRUD đơn giản để mô hình hóa và tối ưu hóa đồng thời 3 cấu trúc dữ liệu kinh điển: **Đồ thị có hướng (Directed Graph)**, **Cây phân cấp vô hạn bậc (Hierarchical Tree)**, và **Quan hệ Nhiều - Nhiều phức hợp (Many-to-Many)**.
  - Đáp ứng xuất sắc toàn bộ chuẩn đầu ra môn học Cơ sở Dữ liệu Nâng cao (Thang điểm 10.0).

### 2. Kịch bản thuyết trình (Lời thoại chi tiết)
> *"Kính thưa quý Thầy Cô trong Hội đồng chấm đồ án và các bạn!  
> Hôm nay, nhóm em xin phép được báo cáo đề tài: **'Nền tảng Mạng Cộng tác Học thuật và Phòng thí nghiệm Tối ưu hóa Cơ sở Dữ liệu (ARI Research Lab)'** theo đúng 9 nội dung chuẩn học thuật.  
>  
> Xuất phát từ thực tiễn tại các viện nghiên cứu và trường đại học lớn, việc quản lý và kết nối tri thức khoa học đang gặp phải sự phân mảnh nghiêm trọng. Các mạng xã hội đại chúng hiện nay chỉ phục vụ giải trí, hoàn toàn không được thiết kế để xử lý các liên kết học thuật chuyên sâu như mạng lưới đồng tác giả gắn với mã số bài báo quốc tế DOI, cây thảo luận phản biện phân cấp sâu, và phân chia không gian nghiên cứu theo phòng thí nghiệm.  
>  
> Mục tiêu cốt lõi của đồ án chúng em là: **Vượt ra ngoài các thao tác CRUD cơ bản** để làm chủ và tối ưu hóa đồng thời 3 cấu trúc dữ liệu phức hợp trong khoa học máy tính: Đồ thị quan hệ có hướng, Cây phân cấp tự tham chiếu vô hạn bậc, và Mạng lưới Nhiều-Nhiều đa chiều; đồng thời hiện thực trọn vẹn các chuẩn đầu ra cao nhất về Chuẩn hóa BCNF/4NF, Truy vấn đệ quy WITH RECURSIVE, CSDL Hướng đối tượng ODMG OQL, và Kiểm soát giao dịch cạnh tranh."*

---

## PHẦN 2: PHÂN TÍCH YÊU CẦU (1 – 1.5 phút)

### 1. Ý chính trên Slide
- **Yêu cầu chức năng (FR)**:
  - *FR-01*: Phân cấp định danh & vai trò học thuật 4 cấp: Admin, Giáo sư PI, Nhà nghiên cứu, Sinh viên.
  - *FR-02*: Quản lý 3 không gian bài viết: Cộng đồng (`community`), Trang cá nhân (`personal`), Phòng Lab (`lab`).
  - *FR-03*: Quản lý phòng thí nghiệm & cơ chế mời thành viên bằng mã mời bí mật `invite_code`.
  - *FR-04*: Mạng lưới kết nối học giả (theo dõi có hướng, tìm đường đi ngắn nhất BFS, mạng lưới N-bước).
  - *FR-05*: Cây thảo luận phân cấp sâu dạng Adjacency List với hành vi `ON DELETE CASCADE`.
  - *FR-06*: Quản lý ấn phẩm khoa học quốc tế, mã DOI và thứ tự đồng tác giả (`author_order`).
  - *FR-07*: Hệ thống thông báo học thuật thời gian thực.
- **Yêu cầu phi chức năng (NFR)**:
  - Cưỡng chế toàn vẹn dữ liệu trực tiếp tại tầng CSDL (`CHECK`, `UNIQUE`, `FOREIGN KEY`).
  - Tải dòng thời gian dưới $10\text{ ms}$ thông qua phân trang Keyset Seek $O(\log N)$.
  - Khử hoàn toàn chu trình lặp vô tận trong đồ thị đệ quy. Bảo đảm tính chất giao dịch ACID.
- **Bảng quy tắc dữ liệu**: 8 quy tắc toàn vẹn từ `BR-01` đến `BR-08`.

### 2. Kịch bản thuyết trình (Lời thoại chi tiết)
> *"Thưa Thầy Cô, để giải quyết bài toán trên, nhóm đã tiến hành phân tích và đặc tả hệ thống yêu cầu chi tiết gồm 7 nhóm chức năng chính:  
> Từ việc phân quyền học thuật 4 vai trò, tổ chức 3 phạm vi bài đăng chuyên biệt, cơ chế mời tham gia phòng Lab bằng mã bảo mật invite_code, cho đến mạng lưới đồ thị và cây phản biện phân cấp.  
>  
> Về yêu cầu phi chức năng, triết lý thiết kế của nhóm là: **Dữ liệu phải toàn vẹn và sạch ngay từ tầng Cơ sở dữ liệu**, không phụ thuộc hoàn toàn vào mã nguồn ứng dụng. Nhóm đã cụ thể hóa thành 8 quy tắc dữ liệu nghiêm ngặt (từ BR-01 đến BR-08), khống chế từ tính duy nhất của email học giả, định danh bài báo DOI, mã mời Lab, cho đến ràng buộc toàn vẹn miền giá trị của phạm vi bài đăng và trigger tự động hóa tìm kiếm toàn văn FTS."*

---

## PHẦN 3: THIẾT KẾ MỨC QUAN NIỆM (EER) (1.5 – 2 phút)

### 1. Ý chính trên Slide
- **Sơ đồ phân cấp Chuyên biệt hóa (Specialization / Generalization)**:
  - **Thực thể cha `User`**: Chuyên biệt hóa `(d, total)` thành 4 phân lớp:
    + `Admin`: `admin_level`, `audit_log_access`.
    + `PrincipalInvestigator (PI)`: `grant_number`, `h_index`, `labs_led`.
    + `Researcher`: `research_fields`, `lab_affiliation`.
    + `Student`: `student_id`, `degree_level`, `advisor_id`.
  - **Thực thể cha `Post`**: Chuyên biệt hóa `(d, total)` thành 3 phân lớp theo phạm vi:
    + `CommunityPost`: Thảo luận mở khoa học, `group_id = NULL`.
    + `PersonalPost`: Nhật ký khoa học tác giả, `group_id = NULL`.
    + `LabPost`: Tiến độ nội bộ Lab, `group_id NOT NULL` (Khóa ngoại FK).
- **Ràng buộc ngữ nghĩa hình thức**:
  - Rời rạc (**Disjoint - $d$**): Mỗi đối tượng tại một thời điểm chỉ đảm nhận một chức danh học thuật chính.
  - Toàn phần (**Total - $t$**): Mọi cá nhân trong hệ thống đều phải thuộc một phân lớp xác định.
- **Sơ đồ EER 12 Thực thể liên kết**.

### 2. Kịch bản thuyết trình (Lời thoại chi tiết)
> *"Tại mức quan niệm, điểm nhấn học thuật của nhóm là việc xây dựng **Mô hình Thực thể Mở rộng EER** với cơ chế Chuyên biệt hóa và Tổng quát hóa trên 2 thực thể trung tâm:  
>  
> Thứ nhất là thực thể **User**: Nhóm định nghĩa thực thể cha mang các thuộc tính chung và chuyên biệt hóa thành 4 phân lớp với hai ràng buộc ngữ nghĩa hình thức:  
> - Tính chất Rời rạc (Disjoint - ký hiệu chữ d): Đảm bảo một học giả tại một thời điểm chỉ giữ đúng một vai trò chính trong hệ thống.  
> - Tính chất Toàn phần (Total - ký hiệu hai đường thẳng song song): Bắt buộc mọi người dùng trong hệ thống đều phải là Admin, Giáo sư PI, Nghiên cứu viên hay Sinh viên. Mỗi phân lớp có thuộc tính đặc thù riêng, như Giáo sư quản lý mã đề tài grant_number và chỉ số h-index, còn Sinh viên quản lý mã sinh viên và giảng viên hướng dẫn.  
>  
> Thứ hai là thực thể **Post**: Được chuyên biệt hóa Disjoint và Total thành 3 phân lớp: CommunityPost, PersonalPost và LabPost. Riêng bài đăng LabPost, thuộc tính group_id bắt buộc khác NULL và liên kết tới phòng Lab tương ứng.  
>  
> Toàn bộ mối liên kết giữa 12 thực thể đã được mô hình hóa hoàn chỉnh trên sơ đồ EER, bảo đảm tính mạch lạc và phản ánh chính xác ngữ nghĩa thực tiễn."*

---

## PHẦN 4: THIẾT KẾ MỨC LOGIC VÀ CHUẨN HÓA (2 – 2.5 phút)

### 1. Ý chính trên Slide
- **Chiến lược Ánh xạ EER sang Quan hệ**:
  - Lựa chọn **Single Table with Type Discriminator** cho cả `User` (cột `role`) và `Post` (cột `scope`).
  - Ưu điểm: Loại bỏ phép `JOIN` khi đọc Bảng tin ($O(1)$ thay vì $O(\text{JOIN})$).
  - Ràng buộc: `CHECK ((scope = 'lab' AND group_id IS NOT NULL) OR (scope IN ('community', 'personal') AND group_id IS NULL))`.
- **Lược đồ quan hệ logic 12 bảng & Từ điển dữ liệu**.
- **Tập 15 phụ thuộc hàm toàn cục $F$**.
- **Giải thuật Chuẩn hóa trên Lược đồ tiêu biểu $R(P, A, E, G, N, S, T)$**:
  - Bao đóng $\{P\}^+ = \mathcal{U}$; Khóa duy nhất $K = \{P\}$.
  - Phủ tối tiểu: $F_c = \{P \to AGST, \; A \to E, \; E \to A, \; G \to N\}$.
  - Phân rã BCNF: $\rho = \{R_1(G, N), R_2(A, E), R_3(P, A, G, S, T)\}$.
  - Chứng minh **Nối không mất mát (Lossless Join)**: $(R_1 \cap R_2) \to R_1$.
  - Chứng minh **Bảo toàn phụ thuộc**: $(F_1 \cup F_2 \cup F_3)^+ = (F_c)^+ = F^+$.
- **Phân tích Chuẩn hóa 4NF (Multivalued Dependencies)**:
  - $R_{interaction}(\text{post\_id, tag\_id, liker\_user\_id})$ có 2 MVDs: $\text{post\_id} \twoheadrightarrow \text{tag\_id}$ và $\text{post\_id} \twoheadrightarrow \text{liker\_user\_id}$.
  - Tránh bùng nổ nhân tích Descartes $M \times N$ bằng Định lý Fagin $\to$ Phân rã thành `post_tags` và `post_likes` đạt chuẩn 4NF.

### 2. Kịch bản thuyết trình (Lời thoại chi tiết)
> *"Chuyển sang Mức Logic và Chuẩn hóa, nhóm đã thực hiện 3 đóng góp quan trọng:  
>  
> Một là, **Biện luận chiến lược ánh xạ quan hệ**: Nhóm chọn chiến lược Bảng đơn kết hợp cột phân biệt (Single Table with Type Discriminator) thay vì tách bảng riêng. Lý do là để loại bỏ hoàn toàn chi phí JOIN khi tải Bảng tin chung trên Trang chủ, giúp truy vấn đạt tốc độ tức thì O(1). Mọi giá trị NULL được kiểm soát chặt chẽ bằng ràng buộc CHECK chk_post_scope_group.  
>  
> Hai là, **Chứng minh hình thức đạt Dạng chuẩn BCNF**:  
> Trên lược đồ tiêu biểu R tổng hợp bài viết, tác giả và nhóm nghiên cứu, nhóm đã trình bày từng bước giải thuật: Tính bao đóng thuộc tính tìm ra khóa duy nhất K = {P} (post_id); Tìm phủ tối tiểu Fc gồm 4 phụ thuộc hàm tối giản; và Phân rã BCNF thành 3 quan hệ.  
> Nhóm đã chứng minh toán học: Phép phân rã thỏa mãn định lý **Nối không mất mát thông tin (Lossless Join)** - khi nối lại không sinh ra bộ giả mạo; và **Bảo toàn 100% phụ thuộc hàm** - cho phép kiểm tra toàn vẹn trên từng bảng mà không cần JOIN.  
>  
> Ba là, **Chuẩn hóa Dạng chuẩn 4 (4NF)**:  
> Nhóm nhận diện trên bảng tương tác tồn tại 2 phụ thuộc đa trị (MVDs) độc lập giữa bài viết với thẻ học thuật và bài viết với lượt thích. Nếu gộp chung, một bài viết có 10 tags và 1.000 likes sẽ bùng nổ lên 10.000 dòng dư thừa dữ liệu. Bằng việc áp dụng **Định lý Fagin**, nhóm đã phân rã thành 2 bảng quan hệ vật lý `post_tags` và `post_likes`, đưa CSDL đạt chuẩn 4NF hoàn hảo."*

---

## PHẦN 5: THIẾT KẾ MỨC VẬT LÝ (1 – 1.5 phút)

### 1. Ý chính trên Slide
- **Hệ quản trị CSDL**: PostgreSQL 18.1 với cơ chế MVCC và bảng tạm `WorkTable`.
- **Chiến lược Chỉ mục vật lý tối ưu**:
  1. *Composite B-tree `idx_follows_follower(follower_id, following_id)`*: Hỗ trợ duyệt đồ thị đạt **Index-Only Scan**, không đọc Heap Page.
  2. *Composite B-tree `idx_posts_created_id(created_at DESC, post_id DESC)`*: Khóa phân trang Keyset Seek, chuyển độ phức tạp từ $O(N)$ về $O(\log N)$.
  3. *GIN Inverted Index `idx_posts_search`*: Phục vụ Full-Text Search trên `tsvector`, tăng tốc gấp 11.89 lần so với `ILIKE`.
  4. *B-tree trên các khóa ngoại*: Tối ưu hóa duyệt cây bình luận và thao tác `ON DELETE CASCADE`.
- **Trigger tự động hóa**: `posts_tsvector_trigger` bằng PL/pgSQL tự động tính trọng số A (tiêu đề) và B (nội dung).

### 2. Kịch bản thuyết trình (Lời thoại chi tiết)
> *"Tại Mức Vật lý, nhóm lựa chọn PostgreSQL 18.1 và tập trung vào **Chiến lược thiết kế chỉ mục hướng truy vấn**:  
>  
> Thứ nhất, chỉ mục phức hợp trên bảng `follows` cho phép bộ tối ưu hóa PostgreSQL thực hiện **Index-Only Scan** trong các vòng lặp đệ quy, đọc dữ liệu trực tiếp từ các trang lá B-Tree mà không cần truy cập vào Heap Page của bảng.  
> Thứ hai, chỉ mục phức hợp theo thời gian và ID trên bảng `posts` phục vụ cho kỹ thuật **Keyset Seek Pagination**, giúp loại bỏ hoàn toàn việc quét bỏ qua hàng ngàn dòng như mệnh đề OFFSET truyền thống.  
> Thứ ba, nhóm xây dựng **Chỉ mục đảo tổng quát GIN Index** trên cột vector tìm kiếm `tsvector`, kết hợp trigger PL/pgSQL tự động phân tích từ tố lexeme có trọng số ngay khi thêm mới hoặc sửa bài viết, đem lại tốc độ tìm kiếm bài báo khoa học dưới 1 mili-giây."*

---

## PHẦN 6: PHẦN CHUYÊN SÂU CỦA ĐỀ TÀI (2.5 – 3 phút)

### 1. Ý chính trên Slide
- **6.1. SQL Nâng cao & 4 Bài toán Đệ quy WITH RECURSIVE**:
  - Bộ 12 truy vấn SQL: Correlated Subquery, `NOT EXISTS` phép chia $\forall$, Window Functions `ROW_NUMBER`/`DENSE_RANK`, Stored Procedure PL/pgSQL `join_lab_by_invite_code`, Dynamic SQL an toàn với `EXECUTE ... USING`.
  - Cây thảo luận phân cấp `sort_path`, Mạng lưới N-Hop khử chu trình, Tìm đường ngắn nhất BFS trong SQL, và Cycle Detection $A \to B \to C \to A$.
- **6.2. CSDL Hướng Đối Tượng & ODMG OQL**:
  - Phân hệ 6 lớp ODL có OID, kế thừa, tập hợp `set`/`list`, methods.
  - 5 Truy vấn OQL chuẩn ODMG 3.0: Lọc H-index, đếm bài viết theo Lab, duyệt cây bình luận, lọc theo like, và đa hình Polymorphism.
  - So sánh đối chiếu & Bảng ánh xạ OQL $\to$ JPQL/JDOQL trên ObjectDB (`objectdb.com`).
- **6.3. Giao dịch (Transaction), Đồng thời (Concurrency) & Deadlock**:
  - Kịch bản COMMIT thành công đa bảng.
  - Kịch bản ROLLBACK với `SAVEPOINT` bảo toàn thao tác hợp lệ.
  - Kịch bản Lost Update & Giải pháp khóa dòng bi quan `SELECT FOR UPDATE`.
  - So sánh 3 mức cô lập: Read Committed, Repeatable Read, Serializable.
  - Kịch bản Bế tắc Deadlock và cơ chế phát hiện tự động sau 1.000 ms của PostgreSQL.

### 2. Kịch bản thuyết trình (Lời thoại chi tiết)
> *"Phần chuyên sâu của đề tài khẳng định năng lực xử lý dữ liệu nâng cao của nhóm qua 3 phân hệ:  
>  
> **Thứ nhất là SQL Nâng cao và CTE Đệ quy**:  
> Nhóm xây dựng hoàn chỉnh 12 truy vấn phức hợp. Nổi bật là 4 bài toán đệ quy đồ thị: Duyệt cây thảo luận vô hạn bậc bằng mảng `sort_path` để dựng cây trên giao diện; Thuật toán BFS tìm đường đi ngắn nhất giữa 2 nhà khoa học trực tiếp trong SQL; và Cơ chế khử chu trình lặp vô hạn bằng mảng đường đi `path` trong đồ thị mạng xã hội.  
>  
> **Thứ hai là Phân hệ CSDL Hướng Đối Tượng và ODMG OQL**:  
> Nhóm đặc tả 6 lớp đối tượng theo chuẩn ODL với đầy đủ OID, kế thừa, tập hợp và methods. Nhóm đã viết 5 truy vấn OQL chuẩn ODMG 3.0 và đặc biệt là **Phân biệt sâu sắc giữa OQL môn học với JPQL/JDOQL của ObjectDB**: OQL thuần đối tượng cho phép gọi method tùy ý trong query và cấu trúc struct tự do; trong khi JPQL của ObjectDB là ngôn ngữ thực thể JPA, không gọi method tùy ý và dùng MEMBER OF/SIZE thay vì IN. Nhóm đã cung cấp mã nguồn Java JPA Entity và bảng ánh xạ chuyển đổi chính xác từng câu truy vấn sang ObjectDB.  
>  
> **Thứ ba là Quản lý Giao dịch và Kiểm soát Đồng thời**:  
> Nhóm mô phỏng đầy đủ: Kịch bản COMMIT nguyên tử; Kịch bản ROLLBACK khôi phục về SAVEPOINT khi vi phạm khóa ngoại; Kịch bản cạnh tranh Lost Update và giải pháp triệt để bằng khóa dòng `SELECT FOR UPDATE`; và Kịch bản Deadlock giữa 2 session để minh họa cơ chế tự động giải phóng bế tắc của PostgreSQL engine."*

---

## PHẦN 7: KIỂM THỬ VÀ ĐÁNH GIÁ HIỆU NĂNG (1.5 – 2 phút)

### 1. Ý chính trên Slide
- **Phương pháp thực nghiệm**: Tích hợp phòng thí nghiệm **SQL Lab (`/sql-lab`)** đo lường trực tiếp bằng `EXPLAIN (ANALYZE, BUFFERS)`.
- **Bảng số liệu đo lường thực tế so với phân tích lý thuyết**:
  1. *Duyệt mạng đệ quy*: Lý thuyết $O(N)$ vs $O(\log N)$. Thực tế: `Seq Scan` $1.84\text{ ms}$ vs `Index Only Scan` **$0.26\text{ ms}$** $\to$ **Nhanh hơn 7.08 lần**, giảm 79% đệm.
  2. *Phân trang sâu (Trang 1.000)*: Lý thuyết OFFSET $O(N)$ vs Keyset Seek $O(1)$. Thực tế: OFFSET $18.65\text{ ms}$ vs Keyset Seek **$0.14\text{ ms}$** $\to$ **Nhanh hơn 133 lần**.
  3. *Tìm kiếm văn bản FTS*: Lý thuyết $O(N \cdot M)$ vs $O(\log N)$. Thực tế: `ILIKE` $4.52\text{ ms}$ vs GIN Index **$0.38\text{ ms}$** $\to$ **Nhanh hơn 11.89 lần**.
- **Kiểm thử phần mềm**: Node.js Backend biên dịch đạt 0 lỗi; Next.js 16 Frontend đạt 0 lint errors/warnings, tối ưu hóa 13 routes động.

### 2. Kịch bản thuyết trình (Lời thoại chi tiết)
> *"Thưa Thầy Cô, mọi phân tích lý thuyết của nhóm đều được kiểm chứng bằng thực nghiệm đo lường định lượng qua lệnh `EXPLAIN (ANALYZE, BUFFERS)` trong công cụ SQL Lab tích hợp sẵn:  
>  
> 1. Đối với **Truy vấn Đệ quy**: Nhờ chỉ mục phức hợp, thời gian thực thi giảm từ 1.84ms xuống còn 0.26ms - nhanh hơn 7.08 lần và tiết kiệm 79% số khối bộ nhớ đệm.  
> 2. Đối với **Phân trang Dòng thời gian**: Khi người dùng cuộn đến trang thứ 1.000, phương pháp OFFSET truyền thống mất 18.65ms do phải quét bỏ qua 10.000 dòng trước đó. Trong khi đó, giải pháp Keyset Seek của nhóm chỉ mất 0.14ms - **nhanh hơn 133 lần**, giữ vững hiệu năng ổn định O(1) bất kể độ sâu của trang.  
> 3. Đối với **Tìm kiếm Toàn văn**: Chỉ mục đảo GIN tăng tốc độ lọc bài viết nhanh hơn 11.89 lần so với toán tử ILIKE.  
>  
> Đồng thời, toàn bộ mã nguồn ứng dụng web Next.js 16 và Node.js Server đã được biên dịch thành công 100% với 0 lỗi, 0 cảnh báo."*

---

## PHẦN 8: KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN (1 phút)

### 1. Ý chính trên Slide
- **Đánh giá kết quả đạt được**:
  - Hoàn thành trọn vẹn 100% các chuẩn đầu ra môn học (10.0 / 10.0 điểm).
  - Kết hợp chặt chẽ giữa lý thuyết hình thức (EER, BCNF, 4NF, ODMG OQL, ACID) với thực thi kỹ thuật tối tân (PostgreSQL 18, Next.js 16).
- **3 Hướng phát triển trong tương lai**:
  1. *Graph Database chuyên dụng*: Thử nghiệm Apache AGE hoặc Neo4j để benchmark mạng lưới học giả quy mô hàng triệu nút.
  2. *Phân vùng bảng (Partitioning)*: Áp dụng Range Partitioning trên bài viết theo năm công bố.
  3. *AI Semantic Search*: Tích hợp extension `pgvector` để tìm kiếm bài báo bằng vector nhúng ngữ nghĩa.

### 2. Kịch bản thuyết trình (Lời thoại chi tiết)
> *"Tóm lại, đồ án ARI Research Lab đã hiện thực trọn vẹn và hoàn hảo các mục tiêu đề ra. Dự án không chỉ dừng lại ở một sản phẩm phần mềm chạy được, mà sở hữu chiều sâu học thuật vững chắc: từ mô hình EER chuyên biệt hóa, chứng minh toán học BCNF và 4NF, đến làm chủ các kỹ thuật truy vấn đệ quy và tối ưu hóa vật lý trong PostgreSQL 18.  
>  
> Trong tương lai, nhóm định hướng mở rộng nghiên cứu sang phân vùng bảng dữ liệu lớn (Partitioning), tích hợp extension đồ thị Apache AGE, và nhúng vector ngữ nghĩa AI qua pgvector để nâng tầm khả năng tìm kiếm bài báo khoa học."*

---

## PHẦN 9: TÀI LIỆU THAM KHẢO (30 giây)

### 1. Ý chính trên Slide
1. **Silberschatz, A., Korth, H. F., & Sudarshan, S.** (2020). *Database System Concepts* (7th ed.). McGraw-Hill.
2. **Elmasri, R., & Navathe, S. B.** (2016). *Fundamentals of Database Systems* (7th ed.). Pearson.
3. **Cattell, R. G. G., et al.** (2000). *The Object Data Management Standard: ODMG 3.0*. Morgan Kaufmann.
4. **PostgreSQL Global Development Group**. (2024). *PostgreSQL 18 Documentation*.
5. **ObjectDB Software**. (2024). *ObjectDB Developer's Guide - JPQL & JDOQL*.
6. **Fagin, R.** (1977). *Multivalued Dependencies and a New Normal Form for Relational Databases*. ACM TODS.

### 2. Kịch bản thuyết trình (Lời thoại chi tiết)
> *"Toàn bộ cơ sở lý thuyết, mô hình chuẩn hóa và giải thuật trong đồ án của nhóm đều được xây dựng dựa trên các giáo trình và tài liệu nghiên cứu chuẩn mực quốc tế của các tác giả Silberschatz, Elmasri & Navathe, chuẩn ODMG 3.0, tài liệu kiến trúc nội bộ của PostgreSQL 18 và ObjectDB.  
>  
> Em xin chân thành cảm ơn quý Thầy Cô trong Hội đồng đã chú ý lắng nghe bài thuyết trình của nhóm em. Chúng em rất mong nhận được những nhận xét và câu hỏi góp ý từ quý Thầy Cô ạ!"*

---

# PHỤ LỤC: BỘ CÂU HỎI PHẢN BIỆN TIỀM NĂNG TỪ HỘI ĐỒNG & CÂU TRẢ LỜI MẪU

| STT | Câu hỏi của Giảng viên | Hướng trả lời mẫu chuẩn xác nhất |
| :---: | :--- | :--- |
| **1** | *Tại sao không tách bảng `posts` thành 3 bảng riêng: `community_posts`, `personal_posts`, `lab_posts`?* | **Trả lời**: Nếu tách thành 3 bảng, mỗi khi người dùng tải Bảng tin tổng hợp trên Trang chủ, PostgreSQL bắt buộc phải thực hiện phép nối FULL OUTER JOIN hoặc UNION 3 bảng lớn, làm mất khả năng tận dụng chỉ mục B-tree thời gian `(created_at, post_id)` và khiến phân trang Keyset trở nên cực kỳ phức tạp. Bằng cách dùng bảng đơn kết hợp cột phân biệt `scope` và ràng buộc CHECK `chk_post_scope_group`, hệ thống vừa đảm bảo tính toàn vẹn nghiệp vụ, vừa giúp truy vấn bảng tin đạt tốc độ tối đa $O(1)$ chỉ với 1 lần quét chỉ mục. |
| **2** | *Ràng buộc `CHECK (follower_id <> following_id)` đã đủ để đồ thị theo dõi không bị lặp vô tận chưa?* | **Trả lời**: Ràng buộc CHECK này chỉ loại bỏ được chu trình độ dài 1 (tự follow chính mình). Trong đồ thị mạng xã hội, chu trình bậc 2 ($A \to B \to A$) hoặc bậc 3 ($A \to B \to C \to A$) là hoàn toàn hợp lệ vì phản ánh đúng thực tế. Nhưng khi thực thi **truy vấn đệ quy WITH RECURSIVE**, nhóm đã cài đặt giải thuật khử chu trình bằng mảng đường đi `ARRAY[follower_id, following_id]` và kiểm tra điều kiện `WHERE NOT (f.following_id = ANY(path))`, triệt tiêu hoàn toàn nguy cơ lặp vô hạn và tràn bộ nhớ WorkTable. |
| **3** | *Tại sao nhóm chọn mô hình Adjacency List cho cây bình luận thay vì Nested Sets hay Closure Table?* | **Trả lời**: Trong thảo luận học thuật, thao tác ghi (INSERT bình luận mới) diễn ra liên tục. Nếu dùng Nested Sets, mỗi lần thêm bình luận sẽ phải cập nhật lại toàn bộ các nút phía sau, gây khóa bảng và nghẽn I/O rất lớn. Nếu dùng Closure Table, chi phí lưu trữ bùng nổ $O(N^2)$ cho các đường dẫn. Do đó, việc chọn Adjacency List (`parent_id`) kết hợp với sức mạnh của PostgreSQL `WITH RECURSIVE` là tối ưu nhất: Thao tác INSERT chỉ tốn $O(1)$, trong khi thao tác đọc toàn bộ cây chỉ cần 1 câu lệnh đệ quy tạo chuỗi `sort_path` để hiển thị phân cấp hoàn hảo. |
| **4** | *Thuộc tính `research_fields TEXT[]` trong bảng `users` có vi phạm Dạng Chuẩn 1 (1NF) không?* | **Trả lời**: Theo định nghĩa 1NF cổ điển của E.F. Codd, thuộc tính phải mang giá trị nguyên tử. Tuy nhiên trong PostgreSQL chuẩn SQL:1999+, kiểu mảng (Array Type) được hỗ trợ như một kiểu dữ liệu tích hợp sẵn có cấu trúc nội tại và hỗ trợ các toán tử tập hợp (`&&`, `@>`). Đây là kỹ thuật phi chuẩn hóa có kiểm soát (Controlled Denormalization) giúp tối ưu hóa hiển thị hồ sơ cá nhân mà không cần bảng nối trung gian, trong khi đối với các quan hệ học thuật bắt buộc chuẩn hóa cao, nhóm đã thiết kế các bảng quan hệ riêng biệt đạt chuẩn 4NF như `tags` và `post_tags`. |
