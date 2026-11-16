# KỊCH BẢN THUYẾT TRÌNH CHI TIẾT: PHẦN THIẾT KẾ CƠ SỞ DỮ LIỆU
## ĐỒ ÁN: MẠNG CỘNG TÁC HỌC THUẬT VÀ PHÒNG THÍ NGHIỆM TỐI ƯU HÓA CSDL (ARI RESEARCH LAB)
**Thời lượng dự kiến cho phần này:** 5 – 7 phút  
**Mục tiêu điểm số:** Đạt tối đa điểm phần Phân tích & Thiết kế EER (1.5 / 1.5 điểm) và tạo tiền đề vững chắc cho phần Chuẩn hóa & SQL Nâng cao.

---

## SLIDE 1: TỔNG QUAN BÀI TOÁN NGHIỆP VỤ & THÁCH THỨC MÔ HÌNH HÓA DỮ LIỆU

### 1. Nội dung hiển thị trên Slide
- **Tên đề tài**: Thiết kế Cơ sở Dữ liệu Mạng Cộng tác Học thuật (ARI Research Lab)
- **Bối cảnh nghiệp vụ**:
  - Quản lý tương tác học thuật chuyên sâu giữa các nhà khoa học, viện nghiên cứu và trường đại học.
  - Phân quyền học thuật đa cấp: Admin, Giáo sư chủ nhiệm (PI), Nhà nghiên cứu (Researcher), Học viên (Student).
  - 3 Không gian chia sẻ học thuật: Cộng đồng (Community), Cá nhân (Personal), Phòng thí nghiệm (Lab).
- **Thách thức dữ liệu cần giải quyết**:
  - Không thể giải quyết hiệu quả bằng mô hình CRUD quan hệ đơn giản.
  - Cần mô hình hóa đồng thời 3 cấu trúc dữ liệu kinh điển: **Đồ thị có hướng (Directed Graph)**, **Cây phân cấp vô hạn bậc (Hierarchical Tree)**, và **Quan hệ Nhiều - Nhiều (Many-to-Many)**.

### 2. Kịch bản thuyết trình (Lời thoại chi tiết)
> *"Kính thưa quý Thầy Cô trong Hội đồng và các bạn!*  
> *Sau đây em xin đại diện nhóm trình bày **Phần 1: Phân tích nghiệp vụ và Thiết kế Mô hình Cơ sở Dữ liệu** cho hệ thống ARI Research Lab.*  
>  
> *Xuất phát từ thực tiễn hoạt động tại các viện nghiên cứu và trường đại học, một hệ thống mạng xã hội học thuật đặt ra những bài toán dữ liệu phức tạp hơn rất nhiều so với mạng xã hội thông thường:*  
> *Thứ nhất, đối tượng người dùng không thuần nhất mà có sự phân hóa vai trò và quyền hạn học thuật rất nghiêm ngặt giữa Giáo sư chủ nhiệm đề tài (PI), Nghiên cứu viên và Học viên cao học.*  
> *Thứ hai, tri thức khoa học cần được phân vùng rành mạch theo 3 phạm vi: bài đăng mở toàn cộng đồng, bài nghiên cứu trên trang cá nhân của tác giả, và bài báo cáo tiến độ nội bộ của từng phòng Lab.*  
> *Và quan trọng nhất, về mặt cấu trúc dữ liệu, hệ sinh thái học thuật đòi hỏi phải giải quyết trọn vẹn 3 mô hình phức hợp: **Đồ thị mạng lưới quan hệ theo dõi có hướng** giữa các nhà khoa học; **Mạng lưới đồng tác giả** đa chiều qua các ấn phẩm quốc tế; và **Cây thảo luận phản biện phân cấp vô hạn cấp độ**.*  
> *Để đáp ứng hoàn hảo các yêu cầu này, nhóm em đã xây dựng mô hình thực thể mở rộng EER với cơ chế chuyên biệt hóa, quy tắc dữ liệu toàn vẹn và chiến lược ánh xạ quan hệ tối ưu."*

---

## SLIDE 2: MÔ HÌNH THỰC THỂ MỞ RỘNG EER (ENHANCED ENTITY-RELATIONSHIP) & CHUYÊN BIỆT HÓA

### 1. Nội dung hiển thị trên Slide
- **Sơ đồ phân cấp Chuyên biệt hóa (Specialization / Generalization)**:
  - **Thực thể cha `User`**: Thuộc tính chung (`user_id`, `name`, `email`, `institution`, `bio`,...).
    - Chuyên biệt hóa rời rạc và toàn phần `(d, total)` thành 4 phân lớp:
      + `Admin` (`admin_level`, `audit_log_access`)
      + `PrincipalInvestigator - PI` (`grant_number`, `h_index`, `labs_led`)
      + `Researcher` (`research_fields`, `lab_affiliation`)
      + `Student` (`student_id`, `degree_level`, `advisor_id`)
  - **Thực thể cha `Post`**: Thuộc tính chung (`post_id`, `title`, `content`, `post_type`, `search_vector`, `created_at`).
    - Chuyên biệt hóa `(d, total)` thành 3 phân lớp theo phạm vi:
      + `CommunityPost`: Thảo luận mở khoa học toàn viện (`group_id = NULL`).
      + `PersonalPost`: Nhật ký khoa học trang cá nhân (`group_id = NULL`).
      + `LabPost`: Tiến độ nội bộ phòng Lab (`group_id NOT NULL` - Khóa ngoại FK).
- **Ràng buộc ngữ nghĩa**: `Disjoint` (mỗi đối tượng tại một thời điểm thuộc đúng 1 lớp con) và `Total` (mọi đối tượng đều phải thuộc một lớp con).

### 2. Kịch bản thuyết trình (Lời thoại chi tiết)
> *"Kính thưa Thầy Cô, điểm nhấn học thuật đầu tiên trong thiết kế của nhóm là việc áp dụng **Mô hình Thực thể Mở rộng EER (Enhanced Entity-Relationship)** thay vì mô hình ER truyền thống.*  
>  
> *Như Thầy Cô có thể quan sát trên sơ đồ, nhóm đã mô hình hóa cơ chế **Tổng quát hóa và Chuyên biệt hóa (Generalization / Specialization)** cho 2 thực thể trung tâm:*  
>  
> *Trước hết là thực thể **User**:*  
> *Hệ thống định nghĩa một thực thể cha tổng quát mang các thuộc tính chung như mã định danh, họ tên, email học thuật, cơ quan công tác và tiểu sử. Từ thực thể cha này, nhóm chuyên biệt hóa thành 4 phân lớp với hai ràng buộc ngữ nghĩa quan trọng:*  
> *Một là tính chất **Rời rạc (Disjoint - ký hiệu chữ d)**: đảm bảo một tài khoản tại một thời điểm chỉ đảm nhận một chức danh học thuật chính xác định trong hệ thống.*  
> *Hai là tính chất **Toàn phần (Total - ký hiệu hai đường thẳng song song)**: bắt buộc bất kỳ cá nhân nào tham gia hệ thống cũng phải được xác định rõ là Admin, Giáo sư PI, Nghiên cứu viên hay Sinh viên. Mỗi phân lớp này sở hữu các thuộc tính đặc thù riêng biệt, ví dụ như Giáo sư PI quản lý mã số đề tài grant_number và chỉ số trích dẫn h_index, trong khi Sinh viên quản lý mã sinh viên và giảng viên hướng dẫn advisor_id.*  
>  
> *Thứ hai là thực thể **Post**:*  
> *Bài viết được chuyên biệt hóa Disjoint và Total thành 3 phân lớp tương ứng với 3 không gian đăng tải: CommunityPost mở cho cộng đồng; PersonalPost cho blog cá nhân; và LabPost dành riêng cho phòng Lab. Đối với LabPost, thuộc tính group_id bắt buộc phải khác NULL và trỏ tới phòng nghiên cứu tương ứng."*

---

## SLIDE 3: CHIẾN LƯỢC ÁNH XẠ EER SANG MÔ HÌNH QUAN HỆ & BIỆN LUẬN HIỆU NĂNG

### 1. Nội dung hiển thị trên Slide
- **So sánh 3 Chiến lược Ánh xạ Quan hệ (Inheritance Mapping Strategies)**:
  1. *Class Table Inheritance (Tách mỗi lớp con thành 1 bảng riêng)*: Nhược điểm: Phải `JOIN` nhiều bảng khi đọc danh sách bài viết hoặc tìm kiếm người dùng.
  2. *Concrete Table Inheritance (Chỉ tạo bảng cho các lớp con)*: Nhược điểm: Khó quản lý khóa chính toàn cục và không hỗ trợ truy vấn đa hình hiệu quả.
  3. *Single Table with Type Discriminator (Bảng đơn kết hợp cột phân biệt)*: **LỰA CHỌN CỦA NHÓM**.
- **Giải pháp triển khai của ARI Research Lab**:
  - Bảng `users` với cột phân biệt `role` (`CHECK IN ('admin', 'pi', 'researcher', 'student')`).
  - Bảng `posts` với cột phân biệt `scope` (`CHECK IN ('community', 'personal', 'lab')`).
- **Ưu điểm vượt trội**:
  - Loại bỏ hoàn toàn chi phí `JOIN` khi truy vấn danh sách bài viết trang chủ ($O(1)$ thay vì $O(\text{JOIN})$).
  - Tận dụng tối đa B-Tree composite index và phân trang Keyset Seek.
  - Bảo đảm tính toàn vẹn thông qua các ràng buộc miền giá trị `CHECK constraints`.

### 2. Kịch bản thuyết trình (Lời thoại chi tiết)
> *"Một câu hỏi kinh điển khi chuyển từ mô hình EER sang Cơ sở dữ liệu quan hệ là: **Nên chọn chiến lược ánh xạ nào để tối ưu hóa hiệu năng?***  
>  
> *Nếu chúng em chọn chiến lược **Class Table Inheritance** - tức là tách mỗi phân lớp thành một bảng riêng biệt (như community_posts, personal_posts, lab_posts), thì mỗi khi cần hiển thị Dòng thời gian chung trên Trang chủ, PostgreSQL sẽ bắt buộc phải thực hiện phép nối FULL OUTER JOIN hoặc UNION 3 bảng lớn, gây suy giảm hiệu năng nghiêm trọng khi dữ liệu tăng cao.*  
>  
> *Vì vậy, nhóm em quyết định áp dụng chiến lược **Single Table with Type Discriminator (Bảng đơn kết hợp cột phân biệt)**:*  
> *Toàn bộ phân lớp User được ánh xạ vào một bảng duy nhất là `users` với cột phân biệt là `role`.*  
> *Toàn bộ phân lớp Post được ánh xạ vào bảng `posts` với cột phân biệt là `scope`.*  
>  
> *Để khắc phục nhược điểm thuộc tính rỗng (NULL values) của chiến lược này và bảo vệ tuyệt đối tính toàn vẹn dữ liệu, nhóm không chỉ dựa vào tầng ứng dụng mà thiết lập **Ràng buộc toàn vẹn mức Cơ sở dữ liệu (Database Constraint)**:*  
> *Cụ thể bằng mệnh đề CHECK: Nếu scope là 'lab' thì group_id bắt buộc NOT NULL; ngược lại nếu scope là 'community' hoặc 'personal' thì group_id bắt buộc phải là NULL.*  
> *Chiến lược này giúp hệ thống đạt độ trễ cực thấp, quét trực tiếp trên B-Tree index mà không phải trả chi phí cho bất kỳ phép JOIN dư thừa nào."*

---

## SLIDE 4: SƠ ĐỒ THỰC THỂ - LIÊN KẾT TOÀN THỂ (12 BẢNG) & 3 CẤU TRÚC DỮ LIỆU CỐT LÕI

### 1. Nội dung hiển thị trên Slide
- **Sơ đồ ERD 12 Bảng**:
  1. `users` (Học giả, phân quyền `role`)
  2. `follows` (Đồ thị theo dõi có hướng)
  3. `research_groups` (Phòng Lab, `invite_code`)
  4. `group_members` (Thành viên Lab, M-N)
  5. `posts` (Bài viết, 3 scopes, `tsvector`)
  6. `tags` (Nhãn lĩnh vực học thuật)
  7. `post_tags` (M-N, Chuẩn 4NF)
  8. `post_likes` (Lượt thích, Chuẩn 4NF)
  9. `comments` (Cây phân cấp tự tham chiếu)
  10. `publications` (Ấn phẩm khoa học quốc tế, `doi`)
  11. `publication_authors` (Mạng lưới đồng tác giả, M-N)
  12. `notifications` (Hệ thống thông báo học thuật)
- **3 Cấu trúc dữ liệu học thuật trung tâm**:
  - **Directed Graph**: `users -> follows -> users`
  - **Hierarchical Tree / Forest**: `comments.parent_id -> comments.comment_id`
  - **Bipartite Co-authorship Graph**: `users <-> publication_authors <-> publications`

### 2. Kịch bản thuyết trình (Lời thoại chi tiết)
> *"Trên màn hình là **Sơ đồ Quan hệ Toàn thể gồm 12 bảng chuẩn hóa** của hệ thống ARI Research Lab.*  
>  
> *Em xin nhấn mạnh vào **3 Cấu trúc Dữ liệu trọng tâm** mà CSDL của nhóm đã mô hình hóa thành công:*  
>  
> *Thứ nhất, **Cấu trúc Đồ thị có hướng (Directed Graph)** thể hiện qua bảng `follows`:*  
> *Đây là một liên kết đệ quy nhiều-nhiều trên cùng thực thể users. Để ngăn chặn hoàn toàn việc một người dùng tự tạo vòng lặp tự theo dõi chính mình, nhóm thiết lập ràng buộc toàn vẹn `CHECK (follower_id <> following_id)` và khóa chính phức hợp `PRIMARY KEY (follower_id, following_id)`. Bảng này chính là nền tảng để nhóm thực thi các thuật toán đệ quy chuyên sâu như Dò tìm đường đi ngắn nhất giữa 2 nhà khoa học (BFS) và Khám phá mạng lưới tiếp cận N-bước.*  
>  
> *Thứ hai, **Cấu trúc Cây thảo luận phân cấp vô hạn bậc (Hierarchical Tree / Forest)** trong bảng `comments`:*  
> *Mỗi bình luận có một con trỏ tự tham chiếu `parent_id` trỏ về `comment_id`. Điểm đặc biệt là ràng buộc khóa ngoại đi kèm hành vi `ON DELETE CASCADE`. Khi một nhánh thảo luận cha bị xóa, toàn bộ cây phản biện con cháu bên dưới sẽ được giải phóng an toàn và tự động.*  
>  
> *Thứ ba, **Cấu trúc Mạng lưới Đồng tác giả & Nhóm nghiên cứu (Many-to-Many Graphs)**:*  
> *Thể hiện qua bảng `group_members` và `publication_authors`. Bảng `publication_authors` lưu trữ thứ tự đóng góp của từng tác giả (author_order), phản ánh chính xác cấu trúc bài báo quốc tế theo chuẩn Scopus và ISI."*

---

## SLIDE 5: TỪ ĐIỂN DỮ LIỆU & RÀNG BUỘC TOÀN VẸN MỨC CSDL (DATA INTEGRITY)

### 1. Nội dung hiển thị trên Slide
- **Bảng tóm tắt Từ điển Dữ liệu (Data Dictionary)**:
  - Kiểu dữ liệu chuyên sâu: `SERIAL` (Khóa chính), `VARCHAR`, `TIMESTAMPTZ` (chuẩn múi giờ ISO), `TEXT[]` (Mảng hướng nghiên cứu), `tsvector` (Vector từ tố FTS).
- **Các Ràng Buộc Toàn Vẹn Cốt Lõi (Integrity Constraints)**:
  - *Domain Constraints*: `CHECK (role IN ('admin', 'pi', 'researcher', 'student'))`, `CHECK (scope IN ('community', 'personal', 'lab'))`.
  - *Referential Integrity (Khóa ngoại)*: `ON DELETE CASCADE` (xóa theo tầng), `ON DELETE SET NULL` (bảo toàn dữ liệu khi trưởng nhóm rời đi).
  - *Entity Integrity (Khóa chính & Duy nhất)*: `email UNIQUE`, `invite_code UNIQUE`, `doi UNIQUE`.
  - *Business Semantic Trigger*: `posts_tsvector_trigger` tự động phân tích ngữ pháp, sinh lexeme và tính trọng số A/B cho tìm kiếm Full-Text Search.

### 2. Kịch bản thuyết trình (Lời thoại chi tiết)
> *"Thưa Thầy Cô, một cơ sở dữ liệu mạnh mẽ phải đảm bảo dữ liệu luôn 'sạch' và 'toàn vẹn' ngay tại tầng lưu trữ mà không phụ thuộc hoàn toàn vào mã nguồn ứng dụng.*  
>  
> *Trong Từ điển Dữ liệu của dự án, nhóm đã áp dụng 4 cấp độ ràng buộc toàn vẹn:*  
> *1. **Ràng buộc miền giá trị (Domain Constraints)**: Sử dụng các mệnh đề CHECK để khống chế nghiêm ngặt các tập giá trị hợp lệ của vai trò học thuật, phạm vi bài đăng và thể loại bài viết.*  
> *2. **Ràng buộc khóa chính và khóa duy nhất**: Bảo đảm email học giả, mã mời phòng lab invite_code, và mã định danh bài báo quốc tế doi luôn là duy nhất trên toàn hệ thống.*  
> *3. **Ràng buộc toàn vẹn tham chiếu có chủ đích (Referential Actions)**:*  
> *Nhóm phân biệt rõ ràng: Đối với dữ liệu phụ thuộc như bình luận con hoặc lượt thích, hệ thống dùng `ON DELETE CASCADE` để dọn dẹp sạch sẽ. Nhưng đối với chủ nhiệm phòng Lab (`owner_id`), hệ thống áp dụng `ON DELETE SET NULL` để khi một Giáo sư chuyển công tác, phòng Lab và các công trình nghiên cứu của tập thể vẫn được bảo tồn trọn vẹn chứ không bị xóa mất.*  
> *4. **Ràng buộc tự động hóa bằng Trigger**: Trigger `posts_tsvector_trigger` được viết bằng PL/pgSQL, tự động phân tích tiêu đề và nội dung bài viết thành các từ tố có trọng số (weight A cho tiêu đề, weight B cho nội dung) ngay khi có thao tác INSERT hoặc UPDATE, phục vụ cho chỉ mục đảo GIN Index."*

---

## SLIDE 6: KẾT NỐI VỚI PHẦN TIẾP THEO (CHUẨN HÓA 4NF & THIẾT KẾ VẬT LÝ)

### 1. Nội dung hiển thị trên Slide
- **Cầu nối sang Phần Chuẩn hóa**:
  - Lược đồ ban đầu gộp chung tương tác bị vi phạm Dạng Chuẩn 4 (4NF) do có 2 phụ thuộc đa trị: $\text{post\_id} \twoheadrightarrow \text{tag\_id}$ và $\text{post\_id} \twoheadrightarrow \text{user\_id}$ (likes).
  - Phân rã Fagin thành `post_tags` và `post_likes` giúp triệt tiêu hiện tượng nhân tích Descartes $M \times N$.
- **Cầu nối sang Thiết kế Vật lý & SQL nâng cao**:
  - Tạo chỉ mục B-tree Composite `(follower_id, following_id)` phục vụ đệ quy `Index-Only Scan`.
  - Chỉ mục Keyset `(created_at DESC, post_id DESC)` phục vụ phân trang $O(\log N)$.
  - Chỉ mục GIN phục vụ Full-Text Search siêu tốc dưới $1\text{ ms}$.

### 2. Kịch bản thuyết trình (Lời thoại chi tiết)
> *"Kính thưa Hội đồng, thiết kế EER và Lược đồ 12 bảng này chính là nền móng vững chắc cho các kết quả học thuật tiếp theo của đồ án:*  
>  
> *Ở phần tiếp theo, nhóm sẽ trình bày chi tiết chứng minh toán học: từ tập 15 phụ thuộc hàm nghiệp vụ, thuật toán tìm phủ tối tiểu, chứng minh tính nối không mất mát Lossless Join, bảo toàn phụ thuộc hàm đạt BCNF, và đặc biệt là việc nhận diện **Phụ thuộc đa trị (MVDs)** để phân rã đạt **Dạng Chuẩn 4 (4NF)** cho bảng tương tác.*  
>  
> *Đồng thời, trên nền tảng thiết kế vật lý này, nhóm đã xây dựng **12 truy vấn SQL nâng cao** với các kỹ thuật đệ quy WITH RECURSIVE, phân trang Keyset Seek và chỉ mục GIN, đem lại hiệu năng tăng tốc thực nghiệm đo lường thực tế lên đến hơn 133 lần so với cách làm truyền thống.*  
>  
> *Em xin chân thành cảm ơn Thầy Cô đã lắng nghe phần thuyết trình Thiết kế CSDL của nhóm em, và em rất mong nhận được những câu hỏi góp ý từ quý Thầy Cô ạ!"*

---

# PHẦN PHỤ LỤC: BỘ CÂU HỎI PHẢN BIỆN TIỀM NĂNG & CÂU TRẢ LỜI MẪU (DÀNH CHO HỘI ĐỒNG)

### ❓ Câu hỏi 1: *"Tại sao nhóm lại dùng một bảng `posts` chung cho cả 3 loại bài viết thay vì tách thành 3 bảng: `community_posts`, `personal_posts`, `lab_posts`?"*
- **Trả lời mẫu**:  
  *"Thưa Thầy Cô, nhóm đã cân nhắc rất kỹ giữa 3 chiến lược ánh xạ kế thừa. Nếu tách thành 3 bảng riêng, mỗi khi người dùng tải Bảng tin tổng hợp (Feed) trên trang chủ, hệ thống sẽ phải thực hiện phép nối FULL OUTER JOIN hoặc UNION 3 bảng lại với nhau. Phép nối này phá vỡ khả năng tận dụng chỉ mục B-tree theo thời gian `(created_at DESC, post_id DESC)` và khiến việc phân trang Keyset trở nên cực kỳ phức tạp và tốn kém tài nguyên. Bằng việc gom vào bảng đơn với cột phân biệt `scope` kết hợp ràng buộc CHECK `chk_post_scope_group`, hệ thống vừa đảm bảo tính toàn vẹn nghiệp vụ, vừa giúp truy vấn bảng tin đạt tốc độ tối đa $O(1)$ chỉ với một lần quét chỉ mục duy nhất."*

---

### ❓ Câu hỏi 2: *"Ràng buộc `CHECK (follower_id <> following_id)` đã đủ để đồ thị theo dõi không bị lặp vô tận chưa?"*
- **Trả lời mẫu**:  
  *"Dạ thưa Thầy Cô, ràng buộc CHECK này chỉ loại bỏ được chu trình độ dài 1 (tức là một người tự follow chính mình). Trong đồ thị mạng xã hội, chu trình hoàn toàn có thể xảy ra ở độ dài lớn hơn, ví dụ: $A \to B \to A$ (chu trình bậc 2) hoặc $A \to B \to C \to A$ (chu trình bậc 3).  
  Vì vậy, ở mức cấu trúc lưu trữ, bảng `follows` cho phép các chu trình hợp lệ này tồn tại vì phản ánh đúng thực tế quan hệ xã hội. Nhưng khi thực thi **truy vấn đệ quy WITH RECURSIVE**, nhóm đã cài đặt giải thuật khử chu trình bằng cách tích lũy mảng đường đi `ARRAY[follower_id, following_id]` và kiểm tra điều kiện `WHERE NOT (f.following_id = ANY(path))`. Giải pháp này triệt tiêu hoàn toàn nguy cơ lặp vô hạn và tràn bộ nhớ WorkTable."*

---

### ❓ Câu hỏi 3: *"Tại sao nhóm chọn mô hình Adjacency List cho cây bình luận thay vì Nested Sets (Mô hình tập lồng) hay Closure Table?"*
- **Trả lời mẫu**:  
  *"Thưa Thầy Cô, trong các hệ thống thảo luận học thuật, tần suất ghi (INSERT bình luận mới) diễn ra liên tục.  
  Nếu dùng **Nested Sets**, mỗi khi có một bình luận mới chèn vào giữa cây, hệ thống sẽ phải cập nhật lại chỉ số lft và rgt của toàn bộ các nút phía sau, gây khóa bảng và nghẽn I/O rất lớn.  
  Nếu dùng **Closure Table**, chi phí lưu trữ sẽ bùng nổ theo cấp số nhân $O(N^2)$ bản ghi cho các đường dẫn tổ tiên.  
  Do đó, việc chọn **Adjacency List (`parent_id`)** kết hợp với sức mạnh của **PostgreSQL WITH RECURSIVE** là lựa chọn tối ưu nhất: Thao tác INSERT chỉ tốn $O(1)$ mà không ảnh hưởng bất kỳ bản ghi nào khác, trong khi thao tác đọc toàn bộ cây chỉ cần một câu lệnh đệ quy duy nhất tạo chuỗi `sort_path` để dựng cây trên giao diện một cách hoàn hảo."*

---

### ❓ Câu hỏi 4: *"Thuộc tính `research_fields TEXT[]` trong bảng `users` có vi phạm Dạng Chuẩn 1 (1NF) không?"*
- **Trả lời mẫu**:  
  *"Thưa Thầy Cô, theo định nghĩa 1NF của đại số quan hệ cổ điển E.F. Codd, mọi thuộc tính phải mang giá trị nguyên tử (Atomic). Tuy nhiên, trong các hệ quản trị CSDL quan hệ hiện đại chuẩn SQL:1999 trở đi và đặc biệt là PostgreSQL, kiểu mảng (Array Type) được hỗ trợ như một kiểu dữ liệu tích hợp sẵn có cấu trúc nội tại và hỗ trợ các toán tử tập hợp (`&&`, `@>`, `<@`).  
  Trong hệ thống của nhóm, các lĩnh vực nghiên cứu chính được người dùng chọn nhanh dưới dạng nhãn từ khóa phụ trợ hồ sơ cá nhân. Đối với các thực thể quan hệ khoa học chặt chẽ bắt buộc chuẩn hóa cao, nhóm đã thiết kế các bảng quan hệ riêng biệt đạt chuẩn 4NF như `tags` và `post_tags`. Việc dùng `TEXT[]` cho hồ sơ người dùng là một kỹ thuật **phi chuẩn hóa có kiểm soát (Controlled Denormalization)** giúp tránh thêm một bảng nối trung gian không cần thiết khi hiển thị profile cá nhân, mà vẫn đảm bảo tính toàn vẹn dữ liệu."*
