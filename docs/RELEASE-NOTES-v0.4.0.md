## SetupKit v0.4.0 — nhẹ hơn, mượt hơn, thông minh hơn

Một file `SetupKit.exe` duy nhất (~12 MB), mở là chạy. Windows 11 dùng ngay; Windows 10 thiếu WebView2 sẽ được app đề nghị cài tự động.

### Nổi bật

- 🔍 **Tìm kiếm không cần gõ dấu** — "trinh duyet", "may ao" ra đúng kết quả; phím tắt `/` hoặc `Ctrl+K`
- ⚡ **Render thông minh** — chọn/bỏ app không vẽ lại cả lưới 440 card; thanh tiến trình cập nhật tại chỗ, không còn giật khi winget đổ log
- 🌙 **Hết chớp trắng khi mở app ở dark mode** — theme áp trước khi render, nền cửa sổ theo theme Windows
- ✨ **Animation nhẹ toàn CSS** — card xuất hiện lần lượt, dialog/dock/toast có hiệu ứng vào-ra, ánh sáng chạy trên thanh cài đặt; tự tắt khi Windows bật "giảm chuyển động"
- 🖱️ **UX mới**: click thân card mở chi tiết, toast bấm để đóng, cuộn dải plan bằng lăn chuột/nút mũi tên, terminal không tự nhảy khi bạn đang đọc log cũ

### Sửa 10 lỗi

Icon nhóm CLI trống, dialog che mất nút khi nội dung dài, nút "Mở ứng dụng" chạy nhầm file .ico, không bỏ được app đã cài khỏi gói, Enter trong dialog làm dialog tự đóng, double-click tự hủy lựa chọn, crash khi tìm kiếm lúc catalog chưa tải xong, spinner giật, và nhiều lỗi nhỏ khác — chi tiết trong [CHANGELOG.md](CHANGELOG.md).

### Cài đặt

Tải `SetupKit.exe` bên dưới và mở. Không cần cài đặt, không cần quyền admin cho tới khi bạn thật sự cài app bằng winget.

| File | Mô tả |
|---|---|
| `SetupKit.exe` | Chạy trực tiếp |
| `SetupKit-win-x64.zip` | Kèm README và tài liệu catalog |
