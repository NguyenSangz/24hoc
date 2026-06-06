# Nhật ký cập nhật hệ thống (Changelog) - MazeMind Academic Support

Tất cả các thay đổi, tính năng mới và cải tiến quan trọng được lưu trữ và cập nhật chi tiết tại đây.

---

## [Phiên bản v1.8.0] - 2026-06-06 (Mới nhất)

### 1. Đồng bộ cơ chế Đóng gói Máy chủ & Giải quyết Lộ trình triển khai (Cloud Deployment Optimization)
*   **Chuyển đổi phương thức phân giải thư mục:** Thay thế `__dirname` bằng `process.cwd()` khi tải tệp cơ sở dữ liệu `db.json` và thư mục phục vụ tĩnh `dist/` nhằm triệt tiêu hoàn toàn sự cố phân giải đường dẫn sai lệch giữa môi trường thử nghiệm và container sản xuất.
*   **Đóng gói Máy chủ bằng Esbuild:** Bổ sung gói `esbuild` làm nhiệm vụ biên dịch tập tin máy chủ `server.ts` sang định dạng tệp đơn độc CommonJS (`dist/server.cjs`), gỡ bỏ rào cản phân giải ES Modules tương đối của Node.js.
*   **Đồng bộ lệnh Khởi chạy thực tế:** Đã thiết kế lại cấu hình các tập lệnh `"dev"`, `"build"`, và `"start"` trong `package.json` đạt cấu hình quy chuẩn Cloud Run, đảm bảo dự án tự động xây dựng và vận hành trơn tru sau khi bàn giao.

---

## [Phiên bản v1.7.5] - 2026-06-06

### 1. Bản sắc hóa Lịch sử kiến tạo MazeMind (Website Origin Story)
*   **Hồi ức khởi nguồn công nghệ:** Thay đổi toàn bộ các câu chuyện thảo luận mẫu ban đầu thành câu chuyện lịch sử chân thực về cách website MazeMind được hình thành và phát triển từ trợ lý lập trình chuyên sâu Google Gemini AI kết hợp sức mạnh React, TypeScript và Tailwind CSS.
*   **Chia sẻ và Kết nối:** Tạo không gian truyền cảm hứng học tập tới đông đảo học sinh cả nước, định nghĩa rõ ràng mục đích trò chơi hóa (Gamification) để cải tiến khả năng học tập bứt phá.

## [Phiên bản v1.7.0] - 2026-06-05 (Mới nhất)

### 1. Đồng bộ Giám tuyển biên soạn & Ảnh đại diện Ban học thuật (Curated Educator Profiles)
*   **Chuyên gia theo bộ môn:** Mỗi bài học thuộc các bộ môn khác nhau (Toán học, Vật lý, Ngữ văn, Tiếng Anh, Sinh học...) đều tự động liên kết với một Thầy/Cô cố vấn chuyên môn dày dặn kinh nghiệm lý thuyết (ví dụ: Thầy Minh Trí cho Toán học, Cô Mai Lan cho Tiếng Anh...).
*   **Giao diện tiểu sử tinh tế:** Tích hợp bộ thẻ thông tin phong cách học thuật hiện đại ngay đầu bài giảng, có ảnh đại diện sắc nét từ Unsplash (sử dụng thuộc tính tránh chặn tải), danh vị chuyên môn được đóng dấu kiểm định "Verified Expert" tạo độ uy tín cao.

### 2. Diễn đàn Câu chuyện học tập tương tác & Ghi chú cá nhân (Interactive Learning Story Feed)
*   **Tính năng "Câu chuyện của tôi":** Thêm khu vực viết và đăng tải câu chuyện vượt ải mê cung tri thức hoặc mẹo học tập của bản thân học sinh trực tiếp ở cuối bài học.
*   **Hộp phản hồi đa chủ đề:** Hỗ trợ lựa chọn gắn thẻ phân loại (Kinh nghiệm học 💡, Nhật ký học 🔥, Mẹo giải nhanh ⚡, Thắc mắc ❓) cùng bộ đếm giới hạn ký tự chữ tự động trực quan.
*   **Lưu trữ bền vững & Tương tác:** Tích hợp nút Thích (bộ đếm Like mượt mà) và nút Xóa các bài viết do user đăng tải. Toàn bộ hội thoại thảo luận được đồng bộ lưu trữ trực quan trong `localStorage` theo từng mã bài riêng tư.

---

## [Phiên bản v1.6.1] - 2026-06-05

### 1. Đồng bộ cấu hình Độ Khó Mê Cung của AI (Customizable AI Question Difficulty)
*   **Wired-up Difficulty Selector:** Trước đây, mặc dù giao diện có nút chọn độ khó "Dễ", "Trung bình", "Khó", hệ thống vẫn luôn áp dụng mặc định `Difficulty.MEDIUM` cho các câu hỏi do AI tạo ra. 
*   **Trải nghiệm tùy biến 100%:** Đã thiết lập trạng thái `difficulty` động tại máy khách, liên kết trực tiếp hành vi nhấn chọn của học sinh với cơ cấu thiết lập trò chơi để chuyển dữ liệu chính xác lên Google Gemini API.
*   **Cấp độ câu hỏi thông minh cực hạn:** Giúp người dùng có thể thoải mái thử thách bản thân với câu hỏi mang đậm tính tư duy phản biện cao khi chọn chế độ "Khó", hoặc củng cố kiến thức gốc dễ dàng ở chế độ "Dễ".

---

## [Phiên bản v1.6.0] - 2026-06-05

### 1. Phân hệ Chẩn đoán Học tập Trực quan (AI Visual Diagnostics System)
*   **Chỉ số Năng lực cốt lõi (Core Subject Mastery Chart):**
    *   Tích hợp trực tiếp biểu đồ Recharts cột ngang (`BarChart` layout mượt mà) biểu thị tỉ lệ phần trăm thông hiểu học trình trong 9 môn học trọng tâm (Toán chuyên sâu lý thuyết-đại số, Hình học, Văn học, Anh ngữ...).
    *   Sắp xếp màu sắc dải quang phổ (Spectrum Colors) trực quan cho từng thanh môn học giúp học sinh tức thời phân tách rõ ràng khối kiến thức mạnh & điểm yếu cần tập trung bồi dưỡng.
*   **Hải trình Tích lũy Tri thức (XP Growth Area Chart):**
    *   Khắc họa bản đồ tăng trưởng XP mượt mà dạng Biểu đồ miền (`AreaChart`) đổ bóng mờ rực sáng (`linearGradient`), thống kê mốc tích lũy và phản ánh liên tục nỗ lực học tập thực tế.
    *   Hỗ trợ cơ cấu tự động giả lập điểm số tiến gần mốc thời gian thực gần nhất nếu lịch sử số điểm còn sơ khai, mang đến trải nghiệm thẩm mỹ chuyên nghiệp, trực quan tức thì.
*   **Trình Chẩn Đoán Thói Quen Lỗi Tư Duy:**
    *   Tổng hợp các lối tư duy sai lệch thường phạm phải của học sinh (sai sót cẩu thả, giả định sai lầm, áp dụng sai quy tắc, hiểu sai khái niệm...) trích xuất từ AI Gemini phân tích bài học trong mê cung.
    *   Liên kết trực diện với các gợi ý học tập sâu sắc và lời khuyên quý báu của AI Gia sư để tối ưu hóa năng suất kiểm soát lỗi sai.

---

## [Phiên bản v1.5.0] - 2026-06-01

### 1. Hệ thống Trợ lý Giọng nói AI (AI Voice Assistance System - Text To Speech)
*   **Gia Sư Giọng Nói Việt:** Tích hợp bộ giải mã âm nói Web Speech Synthesis API (`lang: vi-VN`). Tự động phát âm thanh giải thích tư duy học tập của Gemini rành rọt, tự nhiên bằng tiếng Việt đầy cảm xúc.
*   **Tích hợp Trực quan:**
    *   **Tại Bảng Lời Giải & Chẩn Đoán:** Một nút "Nghe AI đọc / Dừng đọc" tiện ích được bố trí rực sáng bên cạnh tiêu đề lời giải mê cung và phân tích thói quen tư duy.
    *   **Tại Floating AI Chatbox:** Mọi tin nhắn trả lời từ Trợ lý AI đều được đính kèm nút đọc thoại thông minh, ẩn hiện tự động khi người dùng di chuột qua (`hover:opacity-100`) và chuyển sang trạng thái nhấp nháy bập bùng sống động lúc phát nhạc thoại.
*   **Tiết kiệm hoàn hảo:** Tận dụng công nghệ kết xuất giọng nói ngay phía máy khách (Client-Side) giúp tăng trưởng tốc độ chuyển văn bản thành tiếng nói mượt mà, độc lập mà không tiêu tốn hạn ngạch khóa trả phí bên ngoài.

---

## [Phiên bản v1.4.0] - 2026-06-01

### 1. Hệ thống Âm Thanh Sinh Động (Audio Sound Effects System)
*   **Tích hợp Sound Effects:** Thêm phản hồi âm thanh sống động cho các hành động quan trọng trong game (click phương án lựa chọn, di chuyển trong mê cung, trả lời câu hỏi đúng/sai, chiến thắng boss mê cung).
*   **Hệ thống Bật/Tắt Âm Thanh:**
    *   Tích hợp toggle tắt/bật âm thanh trực quan cả ở **Thanh bên (Sidebar)** và **Thanh điều hướng đỉnh (Top Header)**.
    *   Hiệu ứng sóng động (`animate-pulse`) khi bật âm thanh và hiển thị trạng thái mờ dịu khi tắt âm thanh.
    *   Lưu trữ trạng thái lựa chọn tự động để giữ trải nghiệm người dùng liền mạch.

### 2. Hệ thống Nhiệm vụ Hàng ngày & Điểm danh 7 Ngày (Daily Quests & Weekly Attendance)
*   **Bảng Nhiệm Vụ Hàng Ngày:** Thiết kế bảng ghim nhiệm vụ tinh tế bên trong trang Tổng quan gồm 4 thử thách mỗi ngày:
    1.  *Khởi nguồn tri thức ☀️* - Báo danh điểm danh hàng ngày.
    2.  *Vượt ải tư duy 🧠* - Vượt 3 ải câu hỏi trong mê cung.
    3.  *Nghiên học tinh thông 📖* - Tham khảo bài giảng hoặc sơ đồ tư duy AI.
    4.  *Thăng cấp trang bị 🛒* - Mua sắm vật phẩm trợ giúp tại Cửa hàng.
*   **Điểm danh 7 Ngày:** Phân chia phần thưởng lũy tiến theo từng ngày học (tặng miễn phí *Khiên Bảo Vệ*, *Gợi ý AI* và lượng Xu khổng lồ lên tới 150 xu vào ngày chủ nhật).
*   **Nhận Quà & Cập nhật Trạng thái:** Toàn bộ dữ liệu nhiệm vụ được đồng bộ trực tiếp với túi đồ (Inventory) và số dư Xu thực tế của người dùng qua hệ quản trị trạng thái an toàn.

### 3. Widget Chuỗi Học Tập Siêu Cấp (Super Learning Streak Counter Widget)
*   **Mô đun Đếm Chuỗi Đẹp mắt:** Nâng cấp khu vực chuỗi học tập trong Hồ sơ cá nhân thành một Widget thiết kế trực quan siêu đẹp.
*   **Hiệu ứng Ngọn lửa Thánh đường (Flame & Ember Effect):** 
    *   Khi người dùng đạt chuỗi học tập **lớn hơn 7 ngày**, widget sẽ tự động bùng cháy với hiệu ứng gradient rực rỡ, hạt lửa bay lơ lửng bốc lên (`framer-motion` embers) cùng danh hiệu **SIÊU VIỆT 🔥**.
*   **Cột Mốc Lũy Tiến:** Minh họa 7 mốc ranh giới kiên trì (1, 2, 3, 5, 7, 10, 15 ngày học liên tục) với icon đẹp mắt.
*   **Bộ giả lập Thử Nghiệm (Simulation Toggle):** Thêm tính năng chạy thử chuỗi liên tục >7 ngày để kiểm tra ngay lập tức mà không cần đợi 1 tuần.

---

## [Các Phiên Bản Trước]

### Hệ thống Mê Cung Học Tập (Core Gameplay & Maze System)
*   Tự động sinh mê cung ngẫu nhiên với các nốt câu hỏi từ dễ đến khó tùy theo môn học và lớp học đã chọn (Toán, Vật lý, Hóa học, Sinh học, Lịch sử, Địa lý, Tiếng Anh...).
*   Phòng thủ boss, phân tích lỗi sai tư duy bằng AI thế hệ mới (Gemini) cung cấp lời giải thích sâu sắc và rèn luyện kiến thức hiệu quả.

### Trợ Lý Bài Giảng AI & Bản Đồ Tư Duy (Mindmap & Study Docs)
*   Tạo tài liệu học tập, dàn ý chi tiết và tóm tắt kiến thức chỉ thông qua một cú bấm dựa trên giáo trình lớp học.
*   Học thông qua phòng Chat AI tương tác thời gian thực và phát giọng nói giải thích trực quan.
