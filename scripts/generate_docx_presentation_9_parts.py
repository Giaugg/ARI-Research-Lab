# -*- coding: utf-8 -*-
import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

def set_cell_background(cell, hex_color):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=140, right=140):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(
        f'<w:tcMar {nsdecls("w")}>'
        f'<w:top w:w="{top}" w:type="dxa"/>'
        f'<w:bottom w:w="{bottom}" w:type="dxa"/>'
        f'<w:left w:w="{left}" w:type="dxa"/>'
        f'<w:right w:w="{right}" w:type="dxa"/>'
        f'</w:tcMar>'
    )
    tcPr.append(tcMar)

def set_table_borders(table, color="D3D3D3", sz="4", val="single"):
    tblPr = table._tbl.tblPr
    borders = parse_xml(
        f'<w:tblBorders {nsdecls("w")}>'
        f'<w:top w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'<w:bottom w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'<w:left w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'<w:right w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'<w:insideH w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'<w:insideV w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'</w:tblBorders>'
    )
    tblPr.append(borders)

def build_9_parts_presentation_docx():
    doc = docx.Document()
    for section in doc.sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)

    # Base style
    style_normal = doc.styles['Normal']
    style_normal.font.name = 'Times New Roman'
    style_normal.font.size = Pt(11)
    style_normal.font.color.rgb = RGBColor(30, 41, 59)
    style_normal.paragraph_format.line_spacing = 1.15
    style_normal.paragraph_format.space_after = Pt(4)

    # Header
    p_meta = doc.add_paragraph()
    p_meta.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p_meta.add_run("BỘ GIÁO DỤC VÀ ĐÀO TẠO — TRƯỜNG ĐẠI HỌC BÁCH KHOA\nKHOA CÔNG NGHỆ THÔNG TIN VÀ TRUYỀN THÔNG\n***")
    r.font.size = Pt(10)
    r.font.bold = True
    r.font.color.rgb = RGBColor(71, 85, 105)

    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_title = p_title.add_run("KỊCH BẢN THUYẾT TRÌNH BẢO VỆ ĐỒ ÁN TOÀN DIỆN\n(THEO 9 PHẦN BÁO CÁO CHUẨN ĐẦU RA)")
    r_title.font.size = Pt(18)
    r_title.font.bold = True
    r_title.font.color.rgb = RGBColor(27, 54, 93)

    p_sub = doc.add_paragraph()
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_sub = p_sub.add_run("Đề tài: Nền tảng Mạng Cộng tác Học thuật & Phòng thí nghiệm Tối ưu hóa CSDL (ARI Research Lab)\nThời lượng toàn bài: 12 – 15 phút | Thang điểm: 10.0 / 10.0")
    r_sub.font.size = Pt(11)
    r_sub.font.italic = True
    r_sub.font.color.rgb = RGBColor(15, 118, 110)

    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    parts = [
        {
            "part": "PHẦN 1: GIỚI THIỆU VÀ MỤC TIÊU (1 – 1.5 phút)",
            "bullets": [
                "Bối cảnh: Tri thức khoa học và hoạt động cộng tác tại các viện nghiên cứu, trường đại học đang bị phân mảnh.",
                "Hạn chế mạng xã hội đại chúng: Không hỗ trợ liên kết đồng tác giả, bài báo quốc tế DOI, và phản biện đa tầng.",
                "Mục tiêu cốt lõi: Vượt ra ngoài các bài toán CRUD đơn giản để mô hình hóa và tối ưu hóa đồng thời 3 cấu trúc dữ liệu kinh điển: Đồ thị có hướng (Directed Graph), Cây phân cấp vô hạn bậc (Hierarchical Tree), và Quan hệ Nhiều-Nhiều phức hợp.",
                "Đáp ứng xuất sắc toàn bộ chuẩn đầu ra môn học Cơ sở Dữ liệu Nâng cao (Thang điểm 10.0)."
            ],
            "script": (
                "Kính thưa quý Thầy Cô trong Hội đồng chấm đồ án và các bạn! Hôm nay, nhóm em xin phép được báo cáo đề tài: "
                "'Nền tảng Mạng Cộng tác Học thuật và Phòng thí nghiệm Tối ưu hóa Cơ sở Dữ liệu (ARI Research Lab)' theo đúng 9 nội dung chuẩn học thuật.\n\n"
                "Xuất phát từ thực tiễn tại các viện nghiên cứu và trường đại học lớn, việc quản lý và kết nối tri thức khoa học đang gặp phải "
                "sự phân mảnh nghiêm trọng. Các mạng xã hội đại chúng hiện nay chỉ phục vụ giải trí, hoàn toàn không được thiết kế để xử lý "
                "các liên kết học thuật chuyên sâu như mạng lưới đồng tác giả gắn với mã số bài báo quốc tế DOI, cây thảo luận phản biện phân cấp sâu, "
                "và phân chia không gian nghiên cứu theo phòng thí nghiệm.\n\n"
                "Mục tiêu cốt lõi của đồ án chúng em là: Vượt ra ngoài các thao tác CRUD cơ bản để làm chủ và tối ưu hóa đồng thời 3 cấu trúc dữ liệu "
                "phức hợp trong khoa học máy tính: Đồ thị quan hệ có hướng, Cây phân cấp tự tham chiếu vô hạn bậc, và Mạng lưới Nhiều-Nhiều đa chiều; "
                "đồng thời hiện thực trọn vẹn các chuẩn đầu ra cao nhất về Chuẩn hóa BCNF/4NF, Truy vấn đệ quy WITH RECURSIVE, CSDL Hướng đối tượng ODMG OQL, "
                "và Kiểm soát giao dịch cạnh tranh."
            )
        },
        {
            "part": "PHẦN 2: PHÂN TÍCH YÊU CẦU (1 – 1.5 phút)",
            "bullets": [
                "Yêu cầu chức năng (FR): Quản lý 4 vai trò học thuật (Admin, PI, Researcher, Student); 3 không gian bài viết (Community, Personal, Lab); "
                "Quản lý Lab và mã mời invite_code; Đồ thị theo dõi & tìm đường đi BFS; Cây bình luận đệ quy ON DELETE CASCADE; Đồng tác giả bài báo quốc tế DOI.",
                "Yêu cầu phi chức năng (NFR): Cưỡng chế toàn vẹn trực tiếp tại tầng DB (CHECK, UNIQUE, FK); Tải bảng tin dưới 10ms qua Keyset Seek O(log N); "
                "Khử hoàn toàn chu trình lặp vô tận trong đồ thị đệ quy; Bảo đảm giao dịch ACID.",
                "Bảng quy tắc dữ liệu: 8 quy tắc toàn vẹn từ BR-01 đến BR-08 khống chế từ mức lưu trữ."
            ],
            "script": (
                "Thưa Thầy Cô, để giải quyết bài toán trên, nhóm đã tiến hành phân tích và đặc tả hệ thống yêu cầu chi tiết gồm 7 nhóm chức năng chính: "
                "Từ việc phân quyền học thuật 4 vai trò, tổ chức 3 phạm vi bài đăng chuyên biệt, cơ chế mời tham gia phòng Lab bằng mã bảo mật invite_code, "
                "cho đến mạng lưới đồ thị và cây phản biện phân cấp.\n\n"
                "Về yêu cầu phi chức năng, triết lý thiết kế của nhóm là: Dữ liệu phải toàn vẹn và sạch ngay từ tầng Cơ sở dữ liệu, "
                "không phụ thuộc hoàn toàn vào mã nguồn ứng dụng. Nhóm đã cụ thể hóa thành 8 quy tắc dữ liệu nghiêm ngặt (từ BR-01 đến BR-08), "
                "khống chế từ tính duy nhất của email học giả, định danh bài báo DOI, mã mời Lab, cho đến ràng buộc toàn vẹn miền giá trị của phạm vi bài đăng "
                "và trigger tự động hóa tìm kiếm toàn văn FTS."
            )
        },
        {
            "part": "PHẦN 3: THIẾT KẾ MỨC QUAN NIỆM (EER) (1.5 – 2 phút)",
            "bullets": [
                "Thực thể Cha User: Chuyên biệt hóa (d, total) thành 4 phân lớp: Admin (admin_level), PI (grant_number, h_index), "
                "Researcher (research_fields), Student (student_id, advisor_id).",
                "Thực thể Cha Post: Chuyên biệt hóa (d, total) thành 3 phân lớp theo phạm vi: CommunityPost (group_id = NULL), "
                "PersonalPost (group_id = NULL), LabPost (group_id NOT NULL).",
                "Ràng buộc Disjoint (d): Mỗi đối tượng tại một thời điểm chỉ đảm nhận đúng 1 vai trò chính.",
                "Ràng buộc Total (t): Mọi đối tượng trong hệ thống bắt buộc phải thuộc một phân lớp xác định.",
                "Sơ đồ EER 12 thực thể liên kết chặt chẽ."
            ],
            "script": (
                "Tại mức quan niệm, điểm nhấn học thuật của nhóm là việc xây dựng Mô hình Thực thể Mở rộng EER với cơ chế Chuyên biệt hóa "
                "và Tổng quát hóa trên 2 thực thể trung tâm:\n\n"
                "Thứ nhất là thực thể User: Nhóm định nghĩa thực thể cha mang các thuộc tính chung và chuyên biệt hóa thành 4 phân lớp với hai ràng buộc ngữ nghĩa hình thức: "
                "Tính chất Rời rạc (Disjoint - ký hiệu chữ d) đảm bảo một học giả tại một thời điểm chỉ giữ đúng một vai trò chính; "
                "và Tính chất Toàn phần (Total - ký hiệu hai đường gạch song song) bắt buộc mọi người dùng trong hệ thống đều phải là Admin, Giáo sư PI, "
                "Nghiên cứu viên hay Sinh viên. Mỗi phân lớp có thuộc tính đặc thù riêng, như Giáo sư quản lý mã đề tài grant_number và chỉ số h-index, "
                "còn Sinh viên quản lý mã sinh viên và giảng viên hướng dẫn.\n\n"
                "Thứ hai là thực thể Post: Được chuyên biệt hóa Disjoint và Total thành 3 phân lớp: CommunityPost, PersonalPost và LabPost. "
                "Riêng bài đăng LabPost, thuộc tính group_id bắt buộc khác NULL và liên kết tới phòng Lab tương ứng.\n\n"
                "Toàn bộ mối liên kết giữa 12 thực thể đã được mô hình hóa hoàn chỉnh trên sơ đồ EER, bảo đảm tính mạch lạc và phản ánh chính xác ngữ nghĩa thực tiễn."
            )
        },
        {
            "part": "PHẦN 4: THIẾT KẾ MỨC LOGIC VÀ CHUẨN HÓA (2 – 2.5 phút)",
            "bullets": [
                "Ánh xạ quan hệ: Single Table with Type Discriminator (cột role trên users, cột scope trên posts). Loại bỏ hoàn toàn chi phí JOIN khi tải bảng tin (O(1)).",
                "Lược đồ quan hệ logic 12 bảng & Từ điển dữ liệu.",
                "Tập phụ thuộc hàm toàn cục F (15 FDs).",
                "Giải thuật chuẩn hóa trên lược đồ tiêu biểu R(P, A, E, G, N, S, T): Bao đóng {P}+ = U => Khóa duy nhất K = {P}; Phủ tối tiểu Fc gồm 4 FDs; Phân rã BCNF thành 3 bảng.",
                "Chứng minh toán học: Nối không mất mát thông tin (Lossless Join) và Bảo toàn 100% phụ thuộc hàm.",
                "Chuẩn hóa 4NF: Nhận diện 2 MVDs post_id ↠ tag_id và post_id ↠ user_id. Tránh bùng nổ tích Descartes M × N bằng Định lý Fagin, phân rã thành post_tags và post_likes đạt chuẩn 4NF."
            ],
            "script": (
                "Chuyển sang Mức Logic và Chuẩn hóa, nhóm đã thực hiện 3 đóng góp quan trọng:\n\n"
                "Một là, Biện luận chiến lược ánh xạ quan hệ: Nhóm chọn chiến lược Bảng đơn kết hợp cột phân biệt thay vì tách bảng riêng. "
                "Lý do là để loại bỏ hoàn toàn chi phí JOIN khi tải Bảng tin chung trên Trang chủ, giúp truy vấn đạt tốc độ tức thì O(1). "
                "Mọi giá trị NULL được kiểm soát chặt chẽ bằng ràng buộc CHECK chk_post_scope_group.\n\n"
                "Hai là, Chứng minh hình thức đạt Dạng chuẩn BCNF: Trên lược đồ tiêu biểu R tổng hợp bài viết, tác giả và nhóm nghiên cứu, "
                "nhóm đã trình bày từng bước giải thuật: Tính bao đóng thuộc tính tìm ra khóa duy nhất K = {P} (post_id); Tìm phủ tối tiểu Fc gồm 4 phụ thuộc hàm tối giản; "
                "và Phân rã BCNF thành 3 quan hệ. Nhóm đã chứng minh toán học: Phép phân rã thỏa mãn định lý Nối không mất mát thông tin (Lossless Join) - "
                "khi nối lại không sinh ra bộ giả mạo; và Bảo toàn 100% phụ thuộc hàm - cho phép kiểm tra toàn vẹn trên từng bảng mà không cần JOIN.\n\n"
                "Ba là, Chuẩn hóa Dạng chuẩn 4 (4NF): Nhóm nhận diện trên bảng tương tác tồn tại 2 phụ thuộc đa trị (MVDs) độc lập giữa bài viết với thẻ học thuật "
                "và bài viết với lượt thích. Nếu gộp chung, một bài viết có 10 tags và 1.000 likes sẽ bùng nổ lên 10.000 dòng dư thừa dữ liệu. "
                "Bằng việc áp dụng Định lý Fagin, nhóm đã phân rã thành 2 bảng quan hệ vật lý post_tags và post_likes, đưa CSDL đạt chuẩn 4NF hoàn hảo."
            )
        },
        {
            "part": "PHẦN 5: THIẾT KẾ MỨC VẬT LÝ (1 – 1.5 phút)",
            "bullets": [
                "Hệ quản trị CSDL: PostgreSQL 18.1 với cơ chế MVCC, WorkTable và Semi-naïve Evaluation.",
                "Chỉ mục Composite B-tree idx_follows_follower(follower_id, following_id): Đạt Index-Only Scan khi duyệt đồ thị, không đọc Heap Page.",
                "Chỉ mục Composite B-tree idx_posts_created_id(created_at DESC, post_id DESC): Phân trang Keyset Seek O(log N).",
                "Chỉ mục GIN Index idx_posts_search trên tsvector: Tăng tốc Full-Text Search gấp 11.89 lần so với ILIKE.",
                "B-tree trên các khóa ngoại parent_id, post_id giúp duyệt cây và CASCADE diễn ra tức thì."
            ],
            "script": (
                "Tại Mức Vật lý, nhóm lựa chọn PostgreSQL 18.1 và tập trung vào Chiến lược thiết kế chỉ mục hướng truy vấn:\n\n"
                "Thứ nhất, chỉ mục phức hợp trên bảng follows cho phép bộ tối ưu hóa PostgreSQL thực hiện Index-Only Scan trong các vòng lặp đệ quy, "
                "đọc dữ liệu trực tiếp từ các trang lá B-Tree mà không cần truy cập vào Heap Page của bảng.\n"
                "Thứ hai, chỉ mục phức hợp theo thời gian và ID trên bảng posts phục vụ cho kỹ thuật Keyset Seek Pagination, giúp loại bỏ hoàn toàn việc quét bỏ qua "
                "hàng ngàn dòng như mệnh đề OFFSET truyền thống.\n"
                "Thứ ba, nhóm xây dựng Chỉ mục đảo tổng quát GIN Index trên cột vector tìm kiếm tsvector, kết hợp trigger PL/pgSQL tự động phân tích từ tố lexeme có trọng số "
                "ngay khi thêm mới hoặc sửa bài viết, đem lại tốc độ tìm kiếm bài báo khoa học dưới 1 mili-giây."
            )
        },
        {
            "part": "PHẦN 6: PHẦN CHUYÊN SÂU CỦA ĐỀ TÀI (2.5 – 3 phút)",
            "bullets": [
                "6.1. SQL Nâng cao & 4 Bài toán Đệ quy: 12 truy vấn SQL (Correlated Subquery, NOT EXISTS phép chia ∀, Window Functions ROW_NUMBER/DENSE_RANK, "
                "Stored Procedure PL/pgSQL join_lab_by_invite_code, Dynamic SQL an toàn). 4 Bài toán đệ quy: Cây phân cấp sort_path, Mạng lưới N-Hop, Tìm đường BFS, và Cycle Detection.",
                "6.2. CSDL Hướng Đối Tượng & ODMG OQL: 6 lớp ODL có OID, kế thừa, tập hợp, methods; 5 truy vấn OQL chuẩn ODMG 3.0; "
                "Phân biệt sâu sắc OQL (pure ODBMS, gọi method trong query) với JPQL của ObjectDB (JPA entity, không gọi method, MEMBER OF/SIZE); Bảng ánh xạ thực thi.",
                "6.3. Giao dịch & Đồng thời: Kịch bản COMMIT thành công; Kịch bản ROLLBACK khôi phục về SAVEPOINT; Kịch bản Lost Update & Khóa dòng SELECT FOR UPDATE; "
                "So sánh 3 mức cô lập; Kịch bản Deadlock và bộ phát hiện tự động sau 1.000 ms của PostgreSQL."
            ],
            "script": (
                "Phần chuyên sâu của đề tài khẳng định năng lực xử lý dữ liệu nâng cao của nhóm qua 3 phân hệ:\n\n"
                "Thứ nhất là SQL Nâng cao và CTE Đệ quy: Nhóm xây dựng hoàn chỉnh 12 truy vấn phức hợp. Nổi bật là 4 bài toán đệ quy đồ thị: "
                "Duyệt cây thảo luận vô hạn bậc bằng mảng sort_path để dựng cây trên giao diện; Thuật toán BFS tìm đường đi ngắn nhất giữa 2 nhà khoa học trực tiếp trong SQL; "
                "và Cơ chế khử chu trình lặp vô hạn bằng mảng đường đi path trong đồ thị mạng xã hội.\n\n"
                "Thứ hai là Phân hệ CSDL Hướng Đối Tượng và ODMG OQL: Nhóm đặc tả 6 lớp đối tượng theo chuẩn ODL với đầy đủ OID, kế thừa, tập hợp và methods. "
                "Nhóm đã viết 5 truy vấn OQL chuẩn ODMG 3.0 và đặc biệt là Phân biệt sâu sắc giữa OQL môn học với JPQL/JDOQL của ObjectDB: OQL thuần đối tượng cho phép gọi method "
                "tùy ý trong query và cấu trúc struct tự do; trong khi JPQL của ObjectDB là ngôn ngữ thực thể JPA, không gọi method tùy ý và dùng MEMBER OF/SIZE thay vì IN. "
                "Nhóm đã cung cấp mã nguồn Java JPA Entity và bảng ánh xạ chuyển đổi chính xác từng câu truy vấn sang ObjectDB.\n\n"
                "Thứ ba là Quản lý Giao dịch và Kiểm soát Đồng thời: Nhóm mô phỏng đầy đủ: Kịch bản COMMIT nguyên tử; Kịch bản ROLLBACK khôi phục về SAVEPOINT khi vi phạm khóa ngoại; "
                "Kịch bản cạnh tranh Lost Update và giải pháp triệt để bằng khóa dòng SELECT FOR UPDATE; và Kịch bản Deadlock giữa 2 session để minh họa cơ chế tự động giải phóng bế tắc của PostgreSQL engine."
            )
        },
        {
            "part": "PHẦN 7: KIỂM THỬ VÀ ĐÁNH GIÁ HIỆU NĂNG (1.5 – 2 phút)",
            "bullets": [
                "Phương pháp thực nghiệm: Công cụ SQL Lab (/sql-lab) đo lường bằng EXPLAIN (ANALYZE, BUFFERS).",
                "Duyệt đệ quy: Seq Scan 1.84ms vs Index Only Scan 0.26ms => Nhanh hơn 7.08 lần, giảm 79% đệm.",
                "Phân trang sâu (Trang 1.000): OFFSET 18.65ms vs Keyset Seek 0.14ms => Nhanh hơn 133 lần.",
                "Tìm kiếm toàn văn FTS: ILIKE 4.52ms vs GIN Index 0.38ms => Nhanh hơn 11.89 lần.",
                "Kiểm thử phần mềm: Backend Node.js đạt 0 build errors; Frontend Next.js 16 đạt 0 lint errors/warnings, 13 dynamic routes."
            ],
            "script": (
                "Thưa Thầy Cô, mọi phân tích lý thuyết của nhóm đều được kiểm chứng bằng thực nghiệm đo lường định lượng qua lệnh EXPLAIN (ANALYZE, BUFFERS) trong công cụ SQL Lab tích hợp sẵn:\n\n"
                "1. Đối với Truy vấn Đệ quy: Nhờ chỉ mục phức hợp, thời gian thực thi giảm từ 1.84ms xuống còn 0.26ms - nhanh hơn 7.08 lần và tiết kiệm 79% số khối bộ nhớ đệm.\n"
                "2. Đối với Phân trang Dòng thời gian: Khi người dùng cuộn đến trang thứ 1.000, phương pháp OFFSET truyền thống mất 18.65ms do phải quét bỏ qua 10.000 dòng trước đó. "
                "Trong khi đó, giải pháp Keyset Seek của nhóm chỉ mất 0.14ms - nhanh hơn 133 lần, giữ vững hiệu năng ổn định O(1) bất kể độ sâu của trang.\n"
                "3. Đối với Tìm kiếm Toàn văn: Chỉ mục đảo GIN tăng tốc độ lọc bài viết nhanh hơn 11.89 lần so với toán tử ILIKE.\n\n"
                "Đồng thời, toàn bộ mã nguồn ứng dụng web Next.js 16 và Node.js Server đã được biên dịch thành công 100% với 0 lỗi, 0 cảnh báo."
            )
        },
        {
            "part": "PHẦN 8: KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN (1 phút)",
            "bullets": [
                "Đánh giá kết quả: Hoàn thành trọn vẹn 100% chuẩn đầu ra môn học (10.0 / 10.0 điểm). Kết hợp lý thuyết hình thức với thực thi tối tân.",
                "3 Hướng phát triển: Tích hợp Graph Database chuyên dụng (Apache AGE/Neo4j); Phân vùng bảng (Partitioning) theo năm; "
                "AI Semantic Search bằng Vector Embeddings thông qua extension pgvector."
            ],
            "script": (
                "Tóm lại, đồ án ARI Research Lab đã hiện thực trọn vẹn và hoàn hảo các mục tiêu đề ra. Dự án không chỉ dừng lại ở một sản phẩm phần mềm chạy được, "
                "mà sở hữu chiều sâu học thuật vững chắc: từ mô hình EER chuyên biệt hóa, chứng minh toán học BCNF và 4NF, đến làm chủ các kỹ thuật truy vấn đệ quy "
                "và tối ưu hóa vật lý trong PostgreSQL 18.\n\n"
                "Trong tương lai, nhóm định hướng mở rộng nghiên cứu sang phân vùng bảng dữ liệu lớn (Partitioning), tích hợp extension đồ thị Apache AGE, "
                "và nhúng vector ngữ nghĩa AI qua pgvector để nâng tầm khả năng tìm kiếm bài báo khoa học."
            )
        },
        {
            "part": "PHẦN 9: TÀI LIỆU THAM KHẢO (30 giây)",
            "bullets": [
                "1. Silberschatz, A., Korth, H. F., & Sudarshan, S. (2020). Database System Concepts (7th ed.). McGraw-Hill.",
                "2. Elmasri, R., & Navathe, S. B. (2016). Fundamentals of Database Systems (7th ed.). Pearson.",
                "3. Cattell, R. G. G., et al. (2000). The Object Data Management Standard: ODMG 3.0. Morgan Kaufmann.",
                "4. PostgreSQL Global Development Group. (2024). PostgreSQL 18 Documentation.",
                "5. ObjectDB Software. (2024). ObjectDB Developer's Guide - JPQL & JDOQL.",
                "6. Fagin, R. (1977). Multivalued Dependencies and a New Normal Form for Relational Databases. ACM TODS."
            ],
            "script": (
                "Toàn bộ cơ sở lý thuyết, mô hình chuẩn hóa và giải thuật trong đồ án của nhóm đều được xây dựng dựa trên các giáo trình và tài liệu nghiên cứu "
                "chuẩn mực quốc tế của các tác giả Silberschatz, Elmasri & Navathe, chuẩn ODMG 3.0, tài liệu kiến trúc nội bộ của PostgreSQL 18 và ObjectDB.\n\n"
                "Em xin chân thành cảm ơn quý Thầy Cô trong Hội đồng đã chú ý lắng nghe bài thuyết trình của nhóm em. Chúng em rất mong nhận được những nhận xét "
                "và câu hỏi góp ý từ quý Thầy Cô ạ!"
            )
        }
    ]

    for item in parts:
        p_h = doc.add_paragraph()
        r = p_h.add_run(item["part"])
        r.font.size = Pt(13)
        r.font.bold = True
        r.font.color.rgb = RGBColor(27, 54, 93)

        p_sh = doc.add_paragraph()
        r = p_sh.add_run("1. Nội dung hiển thị trên Slide:")
        r.font.size = Pt(11)
        r.font.bold = True
        r.font.color.rgb = RGBColor(15, 118, 110)

        for b in item["bullets"]:
            bp = doc.add_paragraph(style='List Bullet')
            bp.add_run(b)

        p_sh2 = doc.add_paragraph()
        r = p_sh2.add_run("2. Lời thoại thuyết trình chi tiết (Kịch bản nói):")
        r.font.size = Pt(11)
        r.font.bold = True
        r.font.color.rgb = RGBColor(15, 118, 110)

        p_box = doc.add_paragraph()
        p_box.paragraph_format.left_indent = Inches(0.2)
        p_box.paragraph_format.right_indent = Inches(0.2)
        r = p_box.add_run(item["script"])
        r.font.italic = True
        r.font.size = Pt(10)
        r.font.color.rgb = RGBColor(51, 65, 85)

        doc.add_paragraph().paragraph_format.space_after = Pt(8)

    # QA Appendix
    p_qa_h = doc.add_paragraph()
    r = p_qa_h.add_run("PHỤ LỤC: 4 CÂU HỎI PHẢN BIỆN TIỀM NĂNG & CÂU TRẢ LỜI MẪU")
    r.font.size = Pt(14)
    r.font.bold = True
    r.font.color.rgb = RGBColor(27, 54, 93)

    qa_list = [
        ("Câu hỏi 1: Tại sao không tách bảng posts thành 3 bảng riêng: community_posts, personal_posts, lab_posts?",
         "Trả lời: Nếu tách thành 3 bảng, mỗi khi người dùng tải Bảng tin tổng hợp trên Trang chủ, PostgreSQL bắt buộc phải thực hiện phép nối FULL OUTER JOIN hoặc UNION 3 bảng lớn, làm mất khả năng tận dụng chỉ mục B-tree thời gian (created_at, post_id) và khiến phân trang Keyset trở nên cực kỳ phức tạp. Bằng cách dùng bảng đơn kết hợp cột phân biệt scope và ràng buộc CHECK chk_post_scope_group, hệ thống vừa đảm bảo tính toàn vẹn nghiệp vụ, vừa giúp truy vấn bảng tin đạt tốc độ tối đa O(1) chỉ với 1 lần quét chỉ mục."),
        ("Câu hỏi 2: Ràng buộc CHECK (follower_id <> following_id) đã đủ để đồ thị theo dõi không bị lặp vô tận chưa?",
         "Trả lời: Ràng buộc CHECK này chỉ loại bỏ được chu trình độ dài 1 (tự follow chính mình). Trong đồ thị mạng xã hội, chu trình bậc 2 (A -> B -> A) hoặc bậc 3 (A -> B -> C -> A) là hoàn toàn hợp lệ vì phản ánh đúng thực tế. Nhưng khi thực thi truy vấn đệ quy WITH RECURSIVE, nhóm đã cài đặt giải thuật khử chu trình bằng mảng đường đi ARRAY[follower_id, following_id] và kiểm tra điều kiện WHERE NOT (f.following_id = ANY(path)), triệt tiêu hoàn toàn nguy cơ lặp vô hạn và tràn bộ nhớ WorkTable."),
        ("Câu hỏi 3: Tại sao nhóm chọn mô hình Adjacency List cho cây bình luận thay vì Nested Sets hay Closure Table?",
         "Trả lời: Trong thảo luận học thuật, thao tác ghi (INSERT bình luận mới) diễn ra liên tục. Nếu dùng Nested Sets, mỗi lần thêm bình luận sẽ phải cập nhật lại toàn bộ các nút phía sau, gây khóa bảng và nghẽn I/O rất lớn. Nếu dùng Closure Table, chi phí lưu trữ bùng nổ O(N^2) cho các đường dẫn. Do đó, việc chọn Adjacency List (parent_id) kết hợp với sức mạnh của PostgreSQL WITH RECURSIVE là tối ưu nhất: Thao tác INSERT chỉ tốn O(1), trong khi thao tác đọc toàn bộ cây chỉ cần 1 câu lệnh đệ quy tạo chuỗi sort_path để hiển thị phân cấp hoàn hảo."),
        ("Câu hỏi 4: Thuộc tính research_fields TEXT[] trong bảng users có vi phạm Dạng Chuẩn 1 (1NF) không?",
         "Trả lời: Theo định nghĩa 1NF cổ điển của E.F. Codd, thuộc tính phải mang giá trị nguyên tử. Tuy nhiên trong PostgreSQL chuẩn SQL:1999+, kiểu mảng (Array Type) được hỗ trợ như một kiểu dữ liệu tích hợp sẵn có cấu trúc nội tại và hỗ trợ các toán tử tập hợp (&&, @>). Đây là kỹ thuật phi chuẩn hóa có kiểm soát (Controlled Denormalization) giúp tối ưu hóa hiển thị hồ sơ cá nhân mà không cần bảng nối trung gian, trong khi đối với các quan hệ học thuật bắt buộc chuẩn hóa cao, nhóm đã thiết kế các bảng quan hệ riêng biệt đạt chuẩn 4NF như tags và post_tags.")
    ]

    for q, a in qa_list:
        p_q = doc.add_paragraph()
        r1 = p_q.add_run(q + "\n")
        r1.font.bold = True
        r1.font.size = Pt(10.5)
        r1.font.color.rgb = RGBColor(180, 83, 9)
        r2 = p_q.add_run(a)
        r2.font.size = Pt(10)
        p_q.paragraph_format.space_after = Pt(6)

    out_path = os.path.abspath(r"C:\Users\1\Desktop\DA\ARI Research Lab\docs\KICH_BAN_THUYET_TRINH_9_PHAN.docx")
    try:
        doc.save(out_path)
        print(f"Successfully generated 9-part Presentation Word file at: {out_path}")
    except PermissionError:
        alt_out = os.path.abspath(r"C:\Users\1\Desktop\DA\ARI Research Lab\docs\KICH_BAN_THUYET_TRINH_9_PHAN_v2.docx")
        doc.save(alt_out)
        print(f"File was open. Saved to alternative path: {alt_out}")

if __name__ == "__main__":
    build_9_parts_presentation_docx()
