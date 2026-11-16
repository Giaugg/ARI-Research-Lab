# 08. PHỤ THUỘC HÀM, CHUẨN HÓA 3NF/BCNF VÀ PHÂN TÍCH 4NF

---

## 1. Xác Định Phụ Thuộc Hàm Từ Quy Tắc Nghiệp Vụ (Functional Dependencies - FDs)

Dựa trên phân tích yêu cầu nghiệp vụ của nền tảng mạng cộng tác học thuật **ARI Research Lab**, các quy tắc nghiệp vụ định hình các phụ thuộc hàm cốt lõi như sau:

### 1.1. Các Quy tắc Nghiệp vụ (Business Rules)
1. **Người dùng (Users)**: Mỗi học giả có một mã định danh duy nhất `user_id` và một địa chỉ `email` duy nhất. Biết `user_id` hoặc `email` sẽ xác định được toàn bộ thông tin cá nhân: họ tên (`name`), mật khẩu băm, học vị, cơ quan công tác (`institution`), tiểu sử và vai trò học thuật (`role`).
2. **Nhóm nghiên cứu (Research Groups)**: Mỗi nhóm có mã duy nhất `group_id` và mã mời duy nhất `invite_code`. Biết `group_id` sẽ xác định được tên nhóm (`name`), chủ đề nghiên cứu (`topic`), mô tả và giáo sư chủ nhiệm (`owner_id`).
3. **Thành viên nhóm (Group Members)**: Sự kết hợp giữa mã nhóm `group_id` và mã người dùng `user_id` xác định duy nhất vai trò của người đó trong nhóm (`role`: 'owner', 'admin', 'member') và ngày gia nhập (`joined_at`).
4. **Bài viết học thuật (Posts)**: Mỗi bài viết có mã `post_id` duy nhất xác định tác giả (`author_id`), phạm vi (`scope`), thể loại (`post_type`), tiêu đề (`title`), toàn văn nội dung (`content`) và thời điểm đăng (`created_at`). Nếu là bài đăng cấp Lab (`scope = 'lab'`), `post_id` xác định nhóm nghiên cứu `group_id`.
5. **Thẻ học thuật (Tags)**: Mỗi thẻ có `tag_id` xác định duy nhất tên chuyên ngành `name` và ngược lại.
6. **Công trình khoa học (Publications)**: Mỗi bài báo có mã `publication_id` và mã định danh số số `doi` duy nhất. Biết `publication_id` hoặc `doi` xác định được tên bài báo (`title`), tạp chí/hội nghị (`venue`), tóm tắt (`abstract`) và năm công bố.
7. **Thứ tự tác giả (Publication Authors)**: Bộ đôi `(publication_id, user_id)` xác định duy nhất thứ tự ghi danh tác giả (`author_order`).

### 1.2. Tập Phụ Thuộc Hàm Toàn Cục $F_{system}$
$$\begin{aligned}
f_1 &: \text{user\_id} \to \text{name, email, role, institution, bio, password\_hash, avatar\_url, created\_at} \\
f_2 &: \text{email} \to \text{user\_id} \\
f_3 &: \text{group\_id} \to \text{name, topic, description, owner\_id, invite\_code, created\_at} \\
f_4 &: \text{invite\_code} \to \text{group\_id} \\
f_5 &: (\text{group\_id, user\_id}) \to \text{role, joined\_at} \\
f_6 &: \text{post\_id} \to \text{author\_id, group\_id, scope, post\_type, title, content, created\_at} \\
f_7 &: \text{tag\_id} \to \text{name} \\
f_8 &: \text{name} \to \text{tag\_id} \quad (\text{đối với bảng tags}) \\
f_9 &: \text{comment\_id} \to \text{post\_id, user\_id, parent\_id, content, created\_at} \\
f_{10} &: \text{publication\_id} \to \text{title, doi, venue, abstract, published\_at} \\
f_{11} &: \text{doi} \to \text{publication\_id} \\
f_{12} &: (\text{publication\_id, user\_id}) \to \text{author\_order} \\
f_{13} &: (\text{follower\_id, following\_id}) \to \text{created\_at} \\
f_{14} &: (\text{post\_id, user\_id}) \to \text{created\_at} \quad (\text{lượt thích bài viết}) \\
f_{15} &: \text{notification\_id} \to \text{user\_id, sender\_id, type, title, message, link, is\_read, created\_at}
\end{aligned}$$

---

## 2. Trình Bày Giải Thuật Chuẩn Hóa Trên Lược Đồ Tiêu Biểu

Để chứng minh đầy đủ các giải thuật học thuật theo chuẩn đầu ra môn học, ta chọn một **Lược đồ quan hệ tổng hợp tiêu biểu** mô tả quá trình học giả đăng bài, quản lý thành viên nhóm và phân loại chủ đề:

### 2.1. Định nghĩa Lược đồ Tiêu biểu $R$
Xét lược đồ quan hệ:
$$R = (\text{post\_id, author\_id, author\_email, group\_id, group\_name, scope, post\_title})$$

Ký hiệu viết tắt bằng các ký tự:
- $P$: `post_id` (Mã bài viết)
- $A$: `author_id` (Mã tác giả)
- $E$: `author_email` (Email tác giả)
- $G$: `group_id` (Mã nhóm nghiên cứu)
- $N$: `group_name` (Tên nhóm nghiên cứu)
- $S$: `scope` (Phạm vi bài viết)
- $T$: `post_title` (Tiêu đề bài viết)

Tập thuộc tính: $\mathcal{U} = \{P, A, E, G, N, S, T\}$.

Tập phụ thuộc hàm $F$ xuất phát từ nghiệp vụ trên $R$:
$$\begin{aligned}
f_1 &: P \to A, G, S, T \\
f_2 &: A \to E \\
f_3 &: E \to A \\
f_4 &: G \to N
\end{aligned}$$

---

### 2.2. Thuật Toán Tìm Bao Đóng Của Tập Thuộc Tính ($X^+$)

#### Thuật toán:
- **Đầu vào**: Tập thuộc tính $X$, tập phụ thuộc hàm $F$.
- **Đầu ra**: Bao đóng $X^+$ đối với $F$.
- **Các bước**:
  1. Khởi tạo $X^{(0)} = X$.
  2. Ở bước $i+1$: $X^{(i+1)} = X^{(i)} \cup \{Y \mid (W \to Y) \in F \land W \subseteq X^{(i)}\}$.
  3. Lặp lại bước 2 cho đến khi $X^{(i+1)} = X^{(i)}$. Khi đó $X^+ = X^{(i)}$.

#### Áp dụng thực tế:
- **Tính $\{P\}^+$**:
  - $X^{(0)} = \{P\}$.
  - Xét $f_1: P \to A, G, S, T$ với vế trái $\{P\} \subseteq X^{(0)} \implies X^{(1)} = \{P, A, G, S, T\}$.
  - Xét $f_2: A \to E$ với $\{A\} \subseteq X^{(1)} \implies X^{(2)} = \{P, A, G, S, T, E\}$.
  - Xét $f_4: G \to N$ với $\{G\} \subseteq X^{(2)} \implies X^{(3)} = \{P, A, G, S, T, E, N\} = \mathcal{U}$.
  - Do $X^{(3)} = \mathcal{U}$, dừng thuật toán.
  - **Kết luận**: $\{P\}^+ = \{P, A, E, G, N, S, T\} = \mathcal{U}$.

- **Tính $\{A\}^+$**:
  - $X^{(0)} = \{A\}$.
  - Xét $f_2: A \to E \implies X^{(1)} = \{A, E\}$.
  - Không còn phụ thuộc hàm nào khác thỏa mãn vế trái $\subseteq \{A, E\}$.
  - **Kết luận**: $\{A\}^+ = \{A, E\} \ne \mathcal{U}$.

- **Tính $\{G\}^+$**:
  - $X^{(0)} = \{G\}$.
  - Xét $f_4: G \to N \implies X^{(1)} = \{G, N\}$.
  - **Kết luận**: $\{G\}^+ = \{G, N\} \ne \mathcal{U}$.

---

### 2.3. Thuật Toán Tìm Tất Cả Các Khóa (Candidate Keys)

Phân loại các thuộc tính của $\mathcal{U} = \{P, A, E, G, N, S, T\}$ dựa trên vị trí xuất hiện trong các vế của tập $F$:
- Tập $L$ (chỉ xuất hiện ở vế Trái - Left):
  - Thuộc tính $P$ chỉ xuất hiện ở vế trái của $f_1$, không xuất hiện ở vế phải của bất kỳ phụ thuộc hàm nào.
  - $\implies L = \{P\}$.
- Tập $R$ (chỉ xuất hiện ở vế Phải - Right):
  - Các thuộc tính $S, T, N$ chỉ xuất hiện ở vế phải.
  - $\implies R = \{S, T, N\}$.
- Tập $LR$ (xuất hiện ở cả hai vế Left & Right):
  - $A$ (trái $f_2$, phải $f_1$)
  - $E$ (trái $f_3$, phải $f_2$)
  - $G$ (trái $f_4$, phải $f_1$)
  - $\implies LR = \{A, E, G\}$.
- Tập $N$ (không xuất hiện ở vế nào): $N = \emptyset$.

#### Định lý:
Mọi khóa ứng viên bắt buộc phải chứa tập $L$.
- Ta xét bao đóng của tập $L$: $\{P\}^+ = \mathcal{U}$ (như đã chứng minh ở mục 2.2).
- Do $\{P\}^+ = \mathcal{U}$ và $P$ là tập thuộc tính đơn, nên không tồn tại bất kỳ tập con thực sự nào của $\{P\}$ có thể suy ra $\mathcal{U}$.

**Kết luận**:
Lược đồ $R$ có **duy nhất một khóa ứng viên (Candidate Key)**:
$$K = \{P\} \quad (\text{post\_id})$$
- **Thuộc tính khóa (Prime Attributes)**: $\{P\}$.
- **Thuộc tính không khóa (Non-prime Attributes)**: $\{A, E, G, N, S, T\}$.

---

### 2.4. Thuật Toán Tìm Phủ Tối Tiểu (Minimal / Canonical Cover $F_c$)

Cho tập phụ thuộc hàm $F = \{f_1: P \to AGST, \; f_2: A \to E, \; f_3: E \to A, \; f_4: G \to N\}$.

#### Bước 1: Đưa vế phải về dạng thuộc tính đơn (Singular Right-Hand Side)
Tách $f_1: P \to AGST$ thành:
- $f_{1a}: P \to A$
- $f_{1b}: P \to G$
- $f_{1c}: P \to S$
- $f_{1d}: P \to T$

Tập $F_1 = \{P \to A, \; P \to G, \; P \to S, \; P \to T, \; A \to E, \; E \to A, \; G \to N\}$.

#### Bước 2: Loại bỏ thuộc tính dư thừa ở vế trái (Extraneous Left Attributes)
Tất cả các phụ thuộc hàm trong $F_1$ đều có vế trái là thuộc tính đơn ($P$, $A$, $E$, $G$), do đó không có thuộc tính dư thừa ở vế trái.
$\implies F_2 = F_1$.

#### Bước 3: Loại bỏ các phụ thuộc hàm dư thừa (Redundant Functional Dependencies)
Xét từng phụ thuộc hàm $X \to Y \in F_2$. Giả sử tạm thời loại bỏ $X \to Y$, tính bao đóng $X^+$ dựa trên các phụ thuộc hàm còn lại $(F_2 \setminus \{X \to Y\})$. Nếu $Y \in X^+$ thì $X \to Y$ là dư thừa.
1. Xét $P \to A$:
   - Tính $\{P\}^+$ trên $F_2 \setminus \{P \to A\} = \{P \to G, P \to S, P \to T, A \to E, E \to A, G \to N\}$:
   - $\{P\}^+ = \{P, G, S, T, N\}$. Do $A \notin \{P\}^+ \implies P \to A$ không dư thừa.
2. Tương tự, kiểm tra $P \to G, P \to S, P \to T$: Không phụ thuộc hàm nào bị suy diễn bắc cầu từ các phụ thuộc hàm còn lại $\implies$ không dư thừa.
3. Xét $A \to E$ và $E \to A$:
   - Tính $\{A\}^+$ trên $F_2 \setminus \{A \to E\}$ chỉ ra $\{A\}$. Do $E \notin \{A\}^+ \implies A \to E$ không dư thừa.
   - Tính $\{E\}^+$ trên $F_2 \setminus \{E \to A\}$ chỉ ra $\{E\}$. Do $A \notin \{E\}^+ \implies E \to A$ không dư thừa.
4. Xét $G \to N$: $\{G\}^+$ trên $F_2 \setminus \{G \to N\}$ là $\{G\}$. Do $N \notin \{G\}^+ \implies G \to N$ không dư thừa.

#### Bước 4: Gom các vế phải có cùng vế trái (tùy chọn)
$$F_c = \{P \to AGST, \; A \to E, \; E \to A, \; G \to N\}$$
**Kết luận**: Phủ tối tiểu $F_c$ có 4 phụ thuộc hàm tối giản.

---

## 3. Phân Tích Chuẩn Hóa 3NF và BCNF

### 3.1. Đánh giá dạng chuẩn của Lược đồ Tiêu biểu $R$
Khóa duy nhất của $R$ là $K = \{P\}$. Thuộc tính không khóa: $\{A, E, G, N, S, T\}$.

1. **Kiểm tra 1NF**: Mọi thuộc tính đều mang giá trị nguyên tố (Atomic values) $\implies R \in \text{1NF}$.
2. **Kiểm tra 2NF**: Khóa là thuộc tính đơn $\{P\}$, do đó không thể tồn tại phụ thuộc hàm bộ phận từ một tập con thực sự của khóa $\implies R \in \text{2NF}$.
3. **Kiểm tra 3NF**:
   - Xét phụ thuộc hàm $f_2: A \to E$:
     - Vế trái $\{A\}$ không phải là siêu khóa (superkey) vì $\{A\}^+ = \{A, E\} \ne \mathcal{U}$.
     - Vế phải $\{E\}$ không phải là thuộc tính khóa (vì thuộc tính khóa duy nhất là $P$).
     - $\implies f_2$ là một **phụ thuộc hàm bắc cầu** ($P \to A$ và $A \to E$).
   - Xét phụ thuộc hàm $f_4: G \to N$:
     - Vế trái $\{G\}$ không phải siêu khóa.
     - Vế phải $\{N\}$ không phải thuộc tính khóa.
     - $\implies f_4$ là một **phụ thuộc hàm bắc cầu** ($P \to G$ và $G \to N$).
   - **Kết luận**: Lược đồ $R$ **vi phạm dạng chuẩn 3NF** (và do đó cũng vi phạm BCNF).

---

### 3.2. Thuật Toán Phân Rã Đạt Dạng Chuẩn BCNF (Boyce-Codd Normal Form)
- **Định nghĩa BCNF**: Một lược đồ quan hệ đạt BCNF nếu với mọi phụ thuộc hàm không tầm thường $X \to Y$, thì $X$ phải là một **siêu khóa (Superkey)**.

#### Quá trình phân rã BCNF:
1. **Bước 1**: Xét $R(P, A, E, G, N, S, T)$. Phụ thuộc hàm $G \to N$ vi phạm BCNF vì $\{G\}^+ = \{G, N\} \ne \mathcal{U}$.
   - Phân rã $R$ thành hai lược đồ con:
     $$R_{groups} = \{G, N\}$$
     $$R' = R \setminus (\{G, N\} \setminus \{G\}) = \{P, A, E, G, S, T\}$$
   - Kiểm tra $R_{groups}(G, N)$: Phụ thuộc hàm duy nhất là $G \to N$. $G$ là khóa $\implies R_{groups}$ đạt BCNF.

2. **Bước 2**: Xét $R'(P, A, E, G, S, T)$. Phụ thuộc hàm $A \to E$ vi phạm BCNF vì $\{A\}^+ = \{A, E\} \ne \{P, A, E, G, S, T\}$.
   - Phân rã $R'$ thành:
     $$R_{authors} = \{A, E\}$$
     $$R'' = R' \setminus (\{A, E\} \setminus \{A\}) = \{P, A, G, S, T\}$$
   - Kiểm tra $R_{authors}(A, E)$: Các phụ thuộc hàm là $A \to E$ và $E \to A$. Cả $A$ và $E$ đều là khóa $\implies R_{authors}$ đạt BCNF.

3. **Bước 3**: Xét $R''(P, A, G, S, T)$:
   - Phụ thuộc hàm duy nhất là $P \to A, G, S, T$. Khóa là $\{P\}$, $P$ là siêu khóa.
   - $\implies R''$ đạt BCNF (chính là quan hệ `posts`).

#### Kết quả Phân rã:
$$\rho = \{R_1(G, N), \; R_2(A, E), \; R_3(P, A, G, S, T)\}$$
tương ứng với:
- $R_1$: `research_groups(group_id, group_name)`
- $R_2$: `users(author_id, author_email)`
- $R_3$: `posts(post_id, author_id, group_id, scope, post_title)`

---

### 3.3. Chứng Minh Tính Nối Không Mất Mát Thông Tin (Lossless Join Property)

#### Định lý Phân rã Nối không mất mát:
Phép phân rã một lược đồ $R$ thành $R_1$ và $R_2$ là nối không mất mát thông tin đối với tập phụ thuộc hàm $F$ khi và chỉ khi:
$$(R_1 \cap R_2) \to R_1 \in F^+ \quad \text{HOẶC} \quad (R_1 \cap R_2) \to R_2 \in F^+$$

#### Áp dụng chứng minh theo từng bước:
1. **Xét phân rã lần 1**: $R \to R_{groups}(G, N)$ và $R'(P, A, E, G, S, T)$:
   - Giao của 2 lược đồ: $R_{groups} \cap R' = \{G\}$.
   - Ta có phụ thuộc hàm: $G \to N \in F^+$.
   - Do đó: $\{G\} \to \{G, N\} = R_{groups}$.
   - $\implies$ Điều kiện $(R_1 \cap R_2) \to R_{groups}$ thỏa mãn! Phân rã lần 1 là **Lossless Join**.

2. **Xét phân rã lần 2**: $R' \to R_{authors}(A, E)$ và $R''(P, A, G, S, T)$:
   - Giao của 2 lược đồ: $R_{authors} \cap R'' = \{A\}$.
   - Ta có phụ thuộc hàm: $A \to E \in F^+$.
   - Do đó: $\{A\} \to \{A, E\} = R_{authors}$.
   - $\implies$ Điều kiện $(R_1 \cap R_2) \to R_{authors}$ thỏa mãn! Phân rã lần 2 là **Lossless Join**.

**Kết luận**: Toàn bộ quá trình phân rã đạt BCNF thỏa mãn **tính nối không mất mát thông tin (Lossless Join)**. Khi thực hiện phép kết tự nhiên $R_1 \bowtie R_2 \bowtie R_3$, ta thu được chính xác dữ liệu gốc ban đầu của $R$, không sinh ra bất kỳ bộ dư thừa giả tạo (Spurious Tuples) nào.

---

### 3.4. Chứng Minh Tính Bảo Toàn Phụ Thuộc (Dependency Preservation)

#### Định nghĩa:
Phép phân rã $\rho = \{R_1, R_2, \dots, R_k\}$ bảo toàn phụ thuộc hàm đối với $F$ nếu:
$$(\pi_{R_1}(F) \cup \pi_{R_2}(F) \cup \dots \cup \pi_{R_k}(F))^+ = F^+$$

#### Chiếu tập phụ thuộc hàm $F$ lên các lược đồ con:
- Trên $R_1(G, N)$: Phụ thuộc hàm chiếu được là $F_1 = \{G \to N\}$.
- Trên $R_2(A, E)$: Phụ thuộc hàm chiếu được là $F_2 = \{A \to E, \; E \to A\}$.
- Trên $R_3(P, A, G, S, T)$: Phụ thuộc hàm chiếu được là $F_3 = \{P \to AGST\}$.

Hợp của các tập phụ thuộc hàm con:
$$F' = F_1 \cup F_2 \cup F_3 = \{G \to N, \; A \to E, \; E \to A, \; P \to AGST\}$$

Ta thấy $F' \equiv F_c$ (chính là phủ tối tiểu ban đầu của $F$).
Do đó:
$$(F')^+ = (F_c)^+ = F^+$$

**Kết luận**: Phép phân rã đạt BCNF **bảo toàn 100% các phụ thuộc hàm (Dependency Preserving)**. Hệ thống có thể kiểm tra toàn vẹn mọi quy tắc nghiệp vụ chỉ trên từng bảng đơn lẻ mà không cần thực hiện phép JOIN tốn kém.

---

## 4. Phân Tích Chuẩn Hóa 4NF & Phụ Thuộc Đa Trị (Multivalued Dependencies - MVDs)

### 4.1. Nhận Diện Phụ Thuộc Đa Trị trong Mạng Xã Hội Học Thuật
Xét bảng lưu trữ thông tin tương tác và phân loại bài viết nếu thiết kế chưa chuẩn hóa gộp chung vào một quan hệ:
$$R_{interaction} = (\text{post\_id, tag\_id, liker\_user\_id})$$

#### Quy tắc thực tế:
- Một bài viết khoa học có thể được gắn nhiều thẻ chuyên môn độc lập (ví dụ bài viết về CSDL và AI có 2 tag: `Database`, `MachineLearning`).
- Một bài viết có thể được nhiều nhà nghiên cứu khác nhau yêu thích độc lập (ví dụ `User 1` và `User 2` cùng like bài viết).
- Việc một nhà nghiên cứu thích bài viết này **hoàn toàn độc lập** với danh sách các thẻ được gán cho bài viết đó.

Theo định nghĩa phụ thuộc đa trị (MVD):
Cho một quan hệ $R(X, Y, Z)$ với $Z = R \setminus (X \cup Y)$. Phụ thuộc đa trị $X \twoheadrightarrow Y$ thỏa mãn nếu với mỗi cặp bộ $t_1, t_2 \in R$ sao cho $t_1[X] = t_2[X]$, thì luôn tồn tại các bộ $t_3, t_4 \in R$ sao cho:
$$\begin{aligned}
t_3[X] &= t_1[X], & t_3[Y] &= t_1[Y], & t_3[Z] &= t_2[Z] \\
t_4[X] &= t_1[X], & t_4[Y] &= t_2[Y], & t_4[Z] &= t_1[Z]
\end{aligned}$$

Do đó, trên lược đồ $R_{interaction}(\text{post\_id, tag\_id, liker\_user\_id})$, ta có 2 phụ thuộc đa trị không tầm thường độc lập:
$$\begin{aligned}
\text{post\_id} &\twoheadrightarrow \text{tag\_id} \\
\text{post\_id} &\twoheadrightarrow \text{liker\_user\_id}
\end{aligned}$$

---

### 4.2. Dị Thường Dữ Liệu và Hiện Tượng Nhân Tích Descartes (Cartesian Product Anomaly)

Nếu cố tình lưu trữ trong một bảng duy nhất $R_{interaction}$, bảng này sẽ rơi vào hiện tượng bùng nổ dữ liệu:
Giả sử bài viết $\text{post\_id} = 100$ có:
- 3 thẻ: `PostgreSQL`, `GraphDB`, `Performance`.
- 4 người like: `User 10`, `User 20`, `User 30`, `User 40`.

Bảng $R_{interaction}$ bắt buộc phải lưu trữ $3 \times 4 = 12$ bản ghi:

| post_id | tag_id | liker_user_id |
| :---: | :---: | :---: |
| 100 | PostgreSQL | 10 |
| 100 | PostgreSQL | 20 |
| 100 | PostgreSQL | 30 |
| 100 | PostgreSQL | 40 |
| 100 | GraphDB | 10 |
| 100 | GraphDB | 20 |
| 100 | GraphDB | 30 |
| 100 | GraphDB | 40 |
| 100 | Performance | 10 |
| 100 | Performance | 20 |
| 100 | Performance | 30 |
| 100 | Performance | 40 |

#### Hậu quả nghiêm trọng:
1. **Dư thừa dữ liệu khổng lồ**: Mỗi lần bài viết có thêm 1 like mới, hệ thống phải chèn thêm 3 dòng (ứng với 3 tags). Khi bài viết có 10 tags và 1.000 likes $\implies$ bảng phải chứa $10.000$ dòng!
2. **Dị thường cập nhật (Update Anomaly)**: Đổi tên một tag đòi hỏi sửa nhiều dòng lặp lại.
3. **Dị thường xóa (Delete Anomaly)**: Khi người dùng cuối cùng unlike bài viết, nếu không cẩn thận sẽ xóa luôn thông tin thẻ gắn với bài viết đó.

Mặc dù bảng $R_{interaction}$ **đã đạt chuẩn BCNF** (vì khóa của bảng là toàn bộ bộ ba $(\text{post\_id, tag\_id, liker\_user\_id})$, không có phụ thuộc hàm không tầm thường nào vi phạm), nhưng nó **vẫn vi phạm chuẩn 4NF**.

---

### 4.3. Phân Rã Đạt Chuẩn 4NF Theo Định Lý Fagin

#### Định nghĩa Chuẩn 4NF:
Một lược đồ quan hệ $R$ đạt dạng chuẩn **4NF (Fourth Normal Form)** nếu với mọi phụ thuộc đa trị không tầm thường $X \twoheadrightarrow Y$, thì $X$ phải là một **siêu khóa (Superkey)** của $R$.

Trên $R_{interaction}$, phụ thuộc đa trị $\text{post\_id} \twoheadrightarrow \text{tag\_id}$ có vế trái $\text{post\_id}$ không phải là siêu khóa $\implies$ vi phạm 4NF.

#### Phân rã theo Định lý Fagin:
Áp dụng định lý phân rã của Fagin cho $X \twoheadrightarrow Y \mid Z$:
$$R_{interaction} \implies R_{post\_tags}(\text{post\_id, tag\_id}) \quad \text{và} \quad R_{post\_likes}(\text{post\_id, liker\_user\_id})$$

Trong cơ sở dữ liệu vật lý PostgreSQL của dự án ARI Research Lab, điều này được hiện thực chính xác bởi 2 bảng quan hệ:

1. **Bảng `post_tags`**:
```sql
CREATE TABLE post_tags (
    post_id INT NOT NULL REFERENCES posts(post_id) ON DELETE CASCADE,
    tag_id INT NOT NULL REFERENCES tags(tag_id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, tag_id)
);
```
- Số dòng lưu trữ: $3$ dòng (thay vì 12).
- Khóa chính: `(post_id, tag_id)`. Không còn phụ thuộc đa trị không tầm thường $\implies$ đạt chuẩn 4NF.

2. **Bảng `post_likes`**:
```sql
CREATE TABLE post_likes (
    post_id INT NOT NULL REFERENCES posts(post_id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (post_id, user_id)
);
```
- Số dòng lưu trữ: $4$ dòng (thay vì 12).
- Khóa chính: `(post_id, user_id)`. Không còn phụ thuộc đa trị không tầm thường $\implies$ đạt chuẩn 4NF.

#### Tổng kết:
Tổng số dòng lưu trữ sau khi phân rã: $3 + 4 = 7$ dòng (tiết kiệm đáng kể so với 12 dòng, và khi mở rộng $M \times N$ sẽ là $M + N$ thay vì $M \times N$). Dị thường xóa, sửa, chèn hoàn toàn bị triệt tiêu. CSDL của hệ thống ARI đạt trọn vẹn **Dạng Chuẩn 4 (4NF)**.
