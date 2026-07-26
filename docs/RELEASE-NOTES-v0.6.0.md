## SetupKit v0.6.0

Một file `SetupKit.exe` duy nhất (~12 MB), mở là chạy — hoặc cài bằng một dòng lệnh:

```powershell
irm https://raw.githubusercontent.com/TrisMinh/setupkit/main/scripts/install.ps1 | iex
```

### Có gì mới

- 🔑 **Kích hoạt Windows ngay trong app** — thêm trang "Kích hoạt" với console lệnh sửa được: có sẵn lệnh `slmgr` chính thức, bạn sửa key hoặc tham số (kể cả KMS của tổ chức, MAK...) rồi chạy trực tiếp, kết quả hiện ngay. App tự đọc trạng thái hiện tại (phiên bản Windows, đã kích hoạt hay chưa).
  - Console chấp nhận mọi lệnh PowerShell, bao gồm pipe, chuyển hướng, URL và lệnh nhiều dòng; có chế độ mở PowerShell tương tác riêng cho lệnh cần nhập dữ liệu, chọn menu hoặc bấm phím. Lệnh mặc định được che mờ và có nút hiện/ẩn. Luôn hỏi xác nhận trước khi chạy và cần chạy app bằng quyền Administrator.

### Sửa lỗi giao diện

- 🧊 Khối "ứng dụng đã chọn" bỏ nền kính mờ gây vạch ở góc và lộ nội dung phía sau (artifact trên WebView2), nay dùng nền đục sạch
- 🧱 Đổi icon "ứng dụng đã chọn" sang biểu tượng chồng lớp rõ nét hơn

### Cài đặt

| Cách | Thao tác |
|---|---|
| Một dòng lệnh | Dán lệnh PowerShell ở trên |
| Thủ công | Tải `SetupKit.exe` bên dưới và mở |

Windows 11 dùng ngay; Windows 10 thiếu WebView2 sẽ được app đề nghị cài tự động.
