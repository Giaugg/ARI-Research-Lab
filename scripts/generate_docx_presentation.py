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

def build_presentation_docx():
    doc = docx.Document()
    for section in doc.sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)

    # Styles
    style_normal = doc.styles['Normal']
    style_normal.font.name = 'Times New Roman'
    style_normal.font.size = Pt(11)
    style_normal.font.color.rgb = RGBColor(30, 41, 59)
    style_normal.paragraph_format.line_spacing = 1.15
    style_normal.paragraph_format.space_after = Pt(4)

    # Header Title
    p_meta = doc.add_paragraph()
    p_meta.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p_meta.add_run("BỘ GIÁO DỤC VÀ ĐÀO TẠO — TRƯỜNG ĐẠI HỌC BÁCH KHOA\nKHOA CÔNG NGHỆ THÔNG TIN VÀ TRUYỀN THÔNG\n***")
    r.font.size = Pt(10)
    r.font.bold = True
    r.font.color.rgb = RGBColor(71, 85, 105)

    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p_title.add_run("KỊCH BẢN THUYẾT TRÌNH BẢO VỆ ĐỒ ÁN\nCHUYÊN ĐỀ: THIẾT KẾ CƠ SỞ DỮ LIỆU (1.5 / 1.5 ĐIỂM)")
    r.font.size = Pt(18)
    r.font.bold = True
    r.font.color.rgb = RGBColor(27, 54, 93)

    p_sub = doc.add_paragraph()
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p_sub.add_run("Đề tài: Mạng Cộng tác Học thuật & Phòng thí nghiệm Tối ưu hóa CSDL (ARI Research Lab)\nThời lượng dự kiến: 5 – 7 phút | Tác phong học thuật, lập luận sắc bén")
    r.font.size = Pt(11)
    r.font.italic = True
    r.font.color.rgb = RGBColor(15, 118, 110)

    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    slides = [
        {
            "slide": "SLIDE 1: TỔNG QUAN BÀI TOÁN NGHIỆP VỤ & THÁCH THỨC MÔ HÌNH HÓA DỮ LIỆU",
            "bullets": [
                "Bối cảnh: Quản lý vòng đời hoạt động khoa học tại các viện nghiên cứu và trường đại học.",
                "Phân cấp học thuật: Admin, Giáo sư chủ nhiệm (PI), Nhà nghiên cứu (Researcher), Học viên (Student).",
                "3 Không gian bài viết: Cộng đồng (Community), Trang cá nhân (Personal), Phòng thí nghiệm (Lab).",
                "Thách thức cốt lõi: Mô hình hóa đồng thời 3 cấu trúc dữ liệu kinh điển: Đồ thị có hướng (Directed Graph), Cây phân cấp đệ quy (Tree), và Quan hệ Nhiều-Nhiều (Many-to-Many)."
            ],
            "script": (
                "Kính thưa quý Thầy Cô trong Hội đồng và các bạn! Sau đây em xin đại diện nhóm trình bày Phần 1: "
                "Phân tích nghiệp vụ và Thiết kế Mô hình Cơ sở Dữ liệu cho hệ thống ARI Research Lab.\n\n"
                "Xuất phát từ thực tiễn hoạt động tại các viện nghiên cứu và trường đại học, một hệ thống mạng xã hội học thuật "
                "đặt ra những bài toán dữ liệu phức tạp hơn rất nhiều so với mạng xã hội thông thường: "
                "Thứ nhất, đối tượng người dùng không thuần nhất mà có sự phân hóa vai trò và quyền hạn học thuật rất nghiêm ngặt "
                "giữa Giáo sư chủ nhiệm đề tài (PI), Nghiên cứu viên và Học viên cao học. "
                "Thứ hai, tri thức khoa học cần được phân vùng rành mạch theo 3 phạm vi: bài đăng mở toàn cộng đồng, bài nghiên cứu cá nhân, "
                "và bài báo cáo tiến độ nội bộ của từng phòng Lab. "
                "Và quan trọng nhất, về mặt cấu trúc dữ liệu, hệ sinh thái học thuật đòi hỏi phải giải quyết trọn vẹn 3 mô hình phức hợp: "
                "Đồ thị mạng lưới quan hệ theo dõi có hướng giữa các nhà khoa học; Mạng lưới đồng tác giả đa chiều qua các ấn phẩm quốc tế; "
                "và Cây thảo luận phản biện phân cấp vô hạn cấp độ. Để đáp ứng hoàn hảo các yêu cầu này, nhóm em đã xây dựng mô hình "
                "thực thể mở rộng EER với cơ chế chuyên biệt hóa, quy tắc dữ liệu toàn vẹn và chiến lược ánh xạ quan hệ tối ưu."
            )
        },
        {
            "slide": "SLIDE 2: MÔ HÌNH THỰC THỂ MỞ RỘNG EER & CHUYÊN BIỆT HÓA (SPECIALIZATION)",
            "bullets": [
                "Thực thể Cha User: Chuyên biệt hóa (d, total) thành 4 phân lớp: Admin, PI (grant_number, h_index), Researcher (research_fields), Student (student_id, advisor_id).",
                "Thực thể Cha Post: Chuyên biệt hóa (d, total) thành 3 phân lớp: CommunityPost (group_id = NULL), PersonalPost (group_id = NULL), LabPost (group_id NOT NULL).",
                "Ràng buộc Disjoint (d): Một người dùng tại một thời điểm chỉ giữ đúng một vai trò chính xác định.",
                "Ràng buộc Total: Mọi người dùng bắt buộc phải thuộc một trong 4 vai trò trên."
            ],
            "script": (
                "Kính thưa Thầy Cô, điểm nhấn học thuật đầu tiên trong thiết kế của nhóm là việc áp dụng Mô hình Thực thể Mở rộng EER "
                "(Enhanced Entity-Relationship) thay vì mô hình ER truyền thống.\n\n"
                "Như Thầy Cô có thể quan sát trên sơ đồ, nhóm đã mô hình hóa cơ chế Tổng quát hóa và Chuyên biệt hóa (Generalization / Specialization) "
                "cho 2 thực thể trung tâm:\n"
                "Trước hết là thực thể User: Hệ thống định nghĩa một thực thể cha tổng quát mang các thuộc tính chung như mã định danh, họ tên, email, "
                "cơ quan công tác. Từ thực thể cha này, nhóm chuyên biệt hóa thành 4 phân lớp với hai ràng buộc ngữ nghĩa quan trọng: "
                "Một là tính chất Rời rạc (Disjoint - ký hiệu d) đảm bảo một tài khoản tại một thời điểm chỉ đảm nhận một chức danh học thuật chính; "
                "Hai là tính chất Toàn phần (Total) bắt buộc bất kỳ cá nhân nào tham gia hệ thống cũng phải được xác định rõ là Admin, Giáo sư PI, "
                "Nghiên cứu viên hay Sinh viên. Mỗi phân lớp sở hữu thuộc tính đặc thù riêng biệt, ví dụ như Giáo sư PI quản lý mã số đề tài grant_number "
                "và chỉ số h_index, trong khi Sinh viên quản lý mã sinh viên và giảng viên hướng dẫn advisor_id.\n\n"
                "Thứ hai là thực thể Post: Bài viết được chuyên biệt hóa Disjoint và Total thành 3 phân lớp tương ứng với 3 không gian đăng tải: "
                "CommunityPost cho cộng đồng, PersonalPost cho blog cá nhân, và LabPost dành riêng cho phòng Lab gắn với group_id hợp lệ."
            )
        },
        {
            "slide": "SLIDE 3: CHIẾN LƯỢC ÁNH XẠ EER SANG MÔ HÌNH QUAN HỆ & BIỆN LUẬN HIỆU NĂNG",
            "bullets": [
                "So sánh: Class Table Inheritance (nhiều JOIN) vs Concrete Table (khó truy vấn đa hình) vs Single Table with Discriminator.",
                "Lựa chọn của ARI: Single Table with Type Discriminator (cột role trên users, cột scope trên posts).",
                "Hiệu năng: Loại bỏ hoàn toàn phép JOIN khi tải bảng tin (độ phức tạp O(1) thay vì O(JOIN)).",
                "Toàn vẹn: Dùng CHECK constraints chk_post_scope_group khống chế group_id theo scope."
            ],
            "script": (
                "Một câu hỏi kinh điển khi chuyển từ mô hình EER sang Cơ sở dữ liệu quan hệ là: Nên chọn chiến lược ánh xạ nào để tối ưu hóa hiệu năng?\n\n"
                "Nếu chúng em chọn chiến lược Class Table Inheritance - tức là tách mỗi phân lớp thành một bảng riêng biệt (như community_posts, personal_posts, lab_posts), "
                "thì mỗi khi cần hiển thị Dòng thời gian chung trên Trang chủ, PostgreSQL sẽ bắt buộc phải thực hiện phép nối FULL OUTER JOIN hoặc UNION 3 bảng lớn, "
                "gây suy giảm hiệu năng nghiêm trọng khi dữ liệu tăng cao.\n\n"
                "Vì vậy, nhóm em quyết định áp dụng chiến lược Single Table with Type Discriminator (Bảng đơn kết hợp cột phân biệt): "
                "Toàn bộ phân lớp User được ánh xạ vào một bảng duy nhất là users với cột phân biệt là role; toàn bộ phân lớp Post được ánh xạ vào bảng posts "
                "với cột phân biệt là scope.\n\n"
                "Để bảo vệ tuyệt đối tính toàn vẹn dữ liệu, nhóm thiết lập Ràng buộc mức CSDL bằng mệnh đề CHECK: Nếu scope là 'lab' thì group_id bắt buộc NOT NULL; "
                "ngược lại nếu scope là 'community' hoặc 'personal' thì group_id bắt buộc phải là NULL. "
                "Chiến lược này giúp hệ thống đạt độ trễ cực thấp, quét trực tiếp trên B-Tree index mà không phải trả chi phí cho bất kỳ phép JOIN dư thừa nào."
            )
        },
        {
            "slide": "SLIDE 4: SƠ ĐỒ THỰC THỂ - LIÊN KẾT TOÀN THỂ (12 BẢNG) & 3 CẤU TRÚC DỮ LIỆU CỐT LÕI",
            "bullets": [
                "12 Bảng chuẩn hóa: users, follows, research_groups, group_members, posts, tags, post_tags, post_likes, comments, publications, publication_authors, notifications.",
                "Cấu trúc 1: Directed Graph (follows) với ràng buộc CHECK (follower_id <> following_id).",
                "Cấu trúc 2: Hierarchical Tree / Forest (comments) với parent_id ON DELETE CASCADE.",
                "Cấu trúc 3: Many-to-Many Graphs (group_members, publication_authors, post_tags đạt chuẩn 4NF)."
            ],
            "script": (
                "Trên màn hình là Sơ đồ Quan hệ Toàn thể gồm 12 bảng chuẩn hóa của hệ thống ARI Research Lab.\n\n"
                "Em xin nhấn mạnh vào 3 Cấu trúc Dữ liệu trọng tâm mà CSDL của nhóm đã mô hình hóa thành công:\n"
                "Thứ nhất, Cấu trúc Đồ thị có hướng (Directed Graph) qua bảng follows: Đây là liên kết đệ quy nhiều-nhiều trên cùng thực thể users. "
                "Để ngăn chặn việc tự follow chính mình, nhóm thiết lập CHECK (follower_id <> following_id) và khóa chính (follower_id, following_id). "
                "Bảng này chính là nền tảng để nhóm thực thi các thuật toán đệ quy chuyên sâu như Tìm đường đi ngắn nhất BFS và Mạng lưới N-bước.\n\n"
                "Thứ hai, Cấu trúc Cây thảo luận phân cấp vô hạn bậc (Hierarchical Tree) trong bảng comments: Mỗi bình luận có parent_id trỏ về comment_id "
                "kèm hành vi ON DELETE CASCADE. Khi một nhánh cha bị xóa, toàn bộ cây con cháu bên dưới sẽ được giải phóng an toàn và tự động.\n\n"
                "Thứ ba, Cấu trúc Mạng lưới Đồng tác giả & Nhóm nghiên cứu qua group_members và publication_authors: Bảng publication_authors lưu trữ "
                "thứ tự tác giả author_order, phản ánh chính xác cấu trúc bài báo quốc tế theo chuẩn Scopus và ISI."
            )
        },
        {
            "slide": "SLIDE 5: TỪ ĐIỂN DỮ LIỆU & RÀNG BUỘC TOÀN VẸN MỨC CƠ SỞ DỮ LIỆU",
            "bullets": [
                "Kiểu dữ liệu nâng cao: SERIAL (PK), TIMESTAMPTZ (ISO standard), TEXT[] (mảng lĩnh vực), tsvector (Full-Text Search).",
                "Referential Actions có chủ đích: ON DELETE CASCADE cho comments/likes; ON DELETE SET NULL cho owner_id của phòng Lab.",
                "Trigger tự động: Trigger PL/pgSQL posts_tsvector_trigger tự động tính trọng số A/B cho tìm kiếm toàn văn khi thêm/sửa bài."
            ],
            "script": (
                "Thưa Thầy Cô, một cơ sở dữ liệu mạnh mẽ phải đảm bảo dữ liệu luôn 'sạch' và 'toàn vẹn' ngay tại tầng lưu trữ.\n\n"
                "Trong Từ điển Dữ liệu của dự án, nhóm đã áp dụng 4 cấp độ ràng buộc toàn vẹn:\n"
                "1. Ràng buộc miền giá trị CHECK để khống chế nghiêm ngặt các tập giá trị hợp lệ của vai trò học thuật, phạm vi và thể loại bài viết.\n"
                "2. Ràng buộc khóa chính và khóa duy nhất UNIQUE cho email học giả, mã mời phòng lab invite_code, và mã định danh bài báo quốc tế doi.\n"
                "3. Ràng buộc tham chiếu có chủ đích: Đối với dữ liệu phụ thuộc như bình luận hoặc lượt thích, hệ thống dùng ON DELETE CASCADE để dọn dẹp sạch sẽ. "
                "Nhưng đối với chủ nhiệm phòng Lab (owner_id), hệ thống áp dụng ON DELETE SET NULL để khi một Giáo sư chuyển công tác, phòng Lab và các công trình "
                "của tập thể vẫn được bảo tồn trọn vẹn chứ không bị xóa mất.\n"
                "4. Ràng buộc tự động hóa bằng Trigger: posts_tsvector_trigger tự động phân tích ngữ pháp, sinh lexeme trọng số A cho tiêu đề và B cho nội dung "
                "ngay khi INSERT hoặc UPDATE, phục vụ cho chỉ mục đảo GIN Index."
            )
        },
        {
            "slide": "SLIDE 6: KẾT NỐI VỚI PHẦN CHUẨN HÓA 4NF, THIẾT KẾ VẬT LÝ & KẾT LUẬN",
            "bullets": [
                "Cầu nối Chuẩn hóa: Phân rã 2 phụ thuộc đa trị (MVDs) post_id ↠ tag_id và post_id ↠ user_id theo Định lý Fagin đạt Chuẩn 4NF.",
                "Cầu nối Vật lý: Chỉ mục B-tree Composite (follower_id, following_id) đạt Index-Only Scan; Chỉ mục Keyset (created_at, post_id); Chỉ mục GIN FTS.",
                "Hiệu năng thực nghiệm: Tăng tốc đệ quy 7 lần, tăng tốc phân trang Keyset 133 lần, tăng tốc tìm kiếm GIN 12 lần."
            ],
            "script": (
                "Kính thưa Hội đồng, thiết kế EER và Lược đồ 12 bảng này chính là nền móng vững chắc cho các kết quả học thuật tiếp theo của đồ án:\n\n"
                "Ở phần tiếp theo, nhóm sẽ trình bày chi tiết chứng minh toán học: từ tập 15 phụ thuộc hàm nghiệp vụ, thuật toán tìm phủ tối tiểu, "
                "chứng minh tính nối không mất mát Lossless Join, bảo toàn phụ thuộc hàm đạt BCNF, và đặc biệt là việc nhận diện Phụ thuộc đa trị (MVDs) "
                "để phân rã đạt Dạng Chuẩn 4 (4NF) cho bảng tương tác, triệt tiêu hiện tượng nhân tích Descartes M × N.\n\n"
                "Đồng thời, trên nền tảng thiết kế vật lý này, nhóm đã xây dựng 12 truy vấn SQL nâng cao với các kỹ thuật đệ quy WITH RECURSIVE, "
                "phân trang Keyset Seek và chỉ mục GIN, đem lại hiệu năng tăng tốc thực nghiệm đo lường thực tế lên đến hơn 133 lần so với cách làm truyền thống.\n\n"
                "Em xin chân thành cảm ơn Thầy Cô đã lắng nghe phần thuyết trình Thiết kế CSDL của nhóm em, và em rất mong nhận được những câu hỏi góp ý từ quý Thầy Cô ạ!"
            )
        }
    ]

    for item in slides:
        p_h = doc.add_paragraph()
        r = p_h.add_run(item["slide"])
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
        r.font.size = Pt(10.5)
        r.font.color.rgb = RGBColor(51, 65, 85)

        doc.add_paragraph().paragraph_format.space_after = Pt(8)

    # Q&A Appendix
    p_qa_h = doc.add_paragraph()
    r = p_qa_h.add_run("PHỤ LỤC: 4 CÂU HỎI PHẢN BIỆN TIỀM NĂNG & CÂU TRẢ LỜI MẪU")
    r.font.size = Pt(14)
    r.font.bold = True
    r.font.color.rgb = RGBColor(27, 54, 93)

    qa_list = [
        ("Câu hỏi 1: Tại sao nhóm lại dùng một bảng posts chung cho cả 3 loại bài viết thay vì tách thành 3 bảng riêng: community_posts, personal_posts, lab_posts?",
         "Trả lời: Nếu tách thành 3 bảng riêng, mỗi khi người dùng tải Bảng tin tổng hợp (Feed) trên trang chủ, hệ thống sẽ phải thực hiện phép nối FULL OUTER JOIN hoặc UNION 3 bảng lại với nhau. Phép nối này phá vỡ khả năng tận dụng chỉ mục B-tree theo thời gian (created_at DESC, post_id DESC) và khiến việc phân trang Keyset trở nên cực kỳ phức tạp. Bằng việc gom vào bảng đơn với cột phân biệt scope kết hợp ràng buộc CHECK chk_post_scope_group, hệ thống vừa đảm bảo tính toàn vẹn nghiệp vụ, vừa giúp truy vấn bảng tin đạt tốc độ tối đa O(1) chỉ với một lần quét chỉ mục duy nhất."),
        ("Câu hỏi 2: Ràng buộc CHECK (follower_id <> following_id) đã đủ để đồ thị theo dõi không bị lặp vô tận chưa?",
         "Trả lời: Ràng buộc CHECK này chỉ loại bỏ được chu trình độ dài 1 (tự follow chính mình). Trong đồ thị mạng xã hội, chu trình hoàn toàn có thể xảy ra ở độ dài lớn hơn (A -> B -> A hoặc A -> B -> C -> A). Bảng follows cho phép các chu trình này tồn tại vì phản ánh đúng thực tế quan hệ xã hội. Nhưng khi thực thi truy vấn đệ quy WITH RECURSIVE, nhóm đã cài đặt giải thuật khử chu trình bằng cách tích lũy mảng đường đi ARRAY[follower_id, following_id] và kiểm tra điều kiện WHERE NOT (f.following_id = ANY(path)), triệt tiêu hoàn toàn nguy cơ lặp vô hạn và tràn bộ nhớ WorkTable."),
        ("Câu hỏi 3: Tại sao nhóm chọn mô hình Adjacency List cho cây bình luận thay vì Nested Sets hay Closure Table?",
         "Trả lời: Trong các hệ thống thảo luận học thuật, thao tác ghi (INSERT bình luận mới) diễn ra liên tục. Nếu dùng Nested Sets, mỗi lần thêm bình luận sẽ phải cập nhật lại toàn bộ các nút phía sau, gây nghẽn I/O rất lớn. Nếu dùng Closure Table, chi phí lưu trữ sẽ bùng nổ O(N^2) cho các đường dẫn. Do đó, việc chọn Adjacency List (parent_id) kết hợp với sức mạnh của PostgreSQL WITH RECURSIVE là tối ưu nhất: Thao tác INSERT chỉ tốn O(1), trong khi thao tác đọc toàn bộ cây chỉ cần một câu lệnh đệ quy duy nhất tạo chuỗi sort_path để hiển thị phân cấp hoàn hảo."),
        ("Câu hỏi 4: Thuộc tính research_fields TEXT[] trong bảng users có vi phạm Dạng Chuẩn 1 (1NF) không?",
         "Trả lời: Theo chuẩn 1NF cổ điển của E.F. Codd, thuộc tính phải mang giá trị nguyên tử. Tuy nhiên trong các RDBMS hiện đại chuẩn SQL:1999 trở đi và đặc biệt là PostgreSQL, kiểu mảng (Array Type) được hỗ trợ như một kiểu dữ liệu tích hợp sẵn có cấu trúc nội tại và hỗ trợ các toán tử tập hợp (&&, @>). Đây là kỹ thuật phi chuẩn hóa có kiểm soát (Controlled Denormalization) giúp tối ưu hóa hiển thị hồ sơ cá nhân mà không cần bảng nối trung gian, trong khi đối với các quan hệ học thuật bắt buộc chuẩn hóa cao, nhóm đã thiết kế các bảng quan hệ riêng biệt đạt chuẩn 4NF như tags và post_tags.")
    ]

    for q, a in qa_list:
        p_q = doc.add_paragraph()
        r1 = p_q.add_run(q + "\n")
        r1.font.bold = True
        r1.font.size = Pt(10.5)
        r1.font.color.rgb = RGBColor(180, 83, 9) # Amber 700
        r2 = p_q.add_run(a)
        r2.font.size = Pt(10)
        p_q.paragraph_format.space_after = Pt(6)

    out_path = os.path.abspath(r"C:\Users\1\Desktop\DA\ARI Research Lab\docs\THUYET_TRINH_THIET_KE_CSDL.docx")
    doc.save(out_path)
    print(f"Successfully generated Presentation Word file at: {out_path}")

if __name__ == "__main__":
    build_presentation_docx()
