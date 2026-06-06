# 24hoc - Nền Tảng Học Tập Tương Tác

> Nền tảng học tập được tích hợp AI, biến giáo dục thành niềm vui thông qua các trò chơi tương tác, bảng xếp hạng toàn cầu và trải nghiệm học tập được cá nhân hóa.

<div align="center">

[![Node.js](https://img.shields.io/badge/Node.js->=18-green?logo=node.js)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3-blue?logo=tailwindcss)](https://tailwindcss.com)
[![Giấy phép](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

</div>

## Tính Năng

✨ **Học Tập Tương Tác**
- Trải nghiệm học tập gamified với hệ thống nhiệm vụ
- Câu hỏi và phản hồi do AI cung cấp bằng Google Gemini
- Bảng hoạt động thời gian thực và theo dõi tiến độ

🎮 **Tính Năng Hấp Dẫn**
- Hệ thống bảng xếp hạng toàn cầu
- Hồ sơ người dùng với theo dõi thành tích
- Cửa hàng trong trò chơi với phần thưởng
- Hiệu ứng âm thanh để tăng cảm giác nhập vai

🤖 **Tích Hợp AI**
- API Gemini để tạo câu hỏi thông minh
- Hỗ trợ trò chuyện do AI cung cấp
- Khuyến nghị học tập thông minh

📊 **Phân Tích Dữ Liệu**
- Trực quan hóa bản đồ trò chơi bằng D3.js
- Theo dõi hiệu suất và thống kê
- Bảng điều khiển phân tích người dùng

## Công Nghệ Sử Dụng

- **Frontend:** React 19, TypeScript, Tailwind CSS, Framer Motion
- **Backend:** Node.js, Express
- **AI:** Google Generative AI (Gemini)
- **Trực Quan Hóa:** D3.js, Recharts
- **Build Tool:** Vite
- **Styling:** Lucide React Icons, Tailwind CSS

## Hướng Dẫn Nhanh

### Yêu Cầu Hệ Thống
- Node.js 18+ và npm

### Cài Đặt

1. **Clone repository**
   ```bash
   git clone https://github.com/NguyenSangz/24hoc.git
   cd 24hoc
   ```

2. **Cài đặt dependencies**
   ```bash
   npm install
   ```

3. **Cấu hình biến môi trường**
   
   Tạo file `.env.local` trong thư mục gốc:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
   
   Lấy Gemini API key từ [Google AI Studio](https://ai.google.dev)

4. **Chạy máy chủ phát triển**
   ```bash
   npm run dev
   ```

5. **Mở trong trình duyệt**
   ```
   http://localhost:5173
   ```

## Các Lệnh Khả Dụng

```bash
# Máy chủ phát triển
npm run dev

# Build sản xuất
npm run build

# Kiểm tra kiểu dữ liệu
npm run lint

# Xem trước build sản xuất
npm preview
```

## Cấu Trúc Dự Án

```
├── components/          # Các thành phần React
│   ├── GameMap.tsx
│   ├── Leaderboard.tsx
│   ├── ProfileModal.tsx
│   ├── AIChatFloating.tsx
│   └── ...
├── services/           # Các dịch vụ API
│   ├── db.ts          # Hoạt động cơ sở dữ liệu
│   ├── gemini.ts      # Tích hợp Gemini AI
├── utils/             # Các hàm tiện ích
│   ├── audio.ts       # Tiện ích âm thanh
│   ├── crypto.ts      # Tiện ích mã hóa
│   ├── storage.ts     # Trợ giúp lưu trữ cục bộ
│   └── quests.ts      # Quản lý nhiệm vụ
├── App.tsx            # Thành phần gốc
├── index.tsx          # Điểm vào ứng dụng
├── server.ts          # Máy chủ Express
└── vite.config.ts     # Cấu hình Vite
```

## Đóng Góp

Chúng tôi rất hoan nghênh những đóng góp! Vui lòng tạo một Pull Request.

## Giấy Phép

Dự án này được cấp phép theo MIT License - xem tệp [LICENSE](LICENSE) để biết chi tiết.

## Hỗ Trợ

Để nhận hỗ trợ, vui lòng liên hệ với đội phát triển hoặc mở một issue trên GitHub.
