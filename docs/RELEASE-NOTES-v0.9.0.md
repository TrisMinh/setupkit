## SetupKit v0.9.0

Một file `SetupKit.exe` duy nhất, mở là chạy - hoặc cài bằng một dòng lệnh:

```powershell
irm https://raw.githubusercontent.com/TrisMinh/setupkit/main/scripts/install.ps1 | iex
```

### Có gì mới

- **Tab Cập nhật** - SetupKit gom các ứng dụng đã cài có bản mới vào một màn hình riêng, có search và nút cập nhật từng app.
- **Cập nhật tất cả** - xác nhận một lần, sau đó SetupKit chạy tuần tự đúng những package đã duyệt qua `winget upgrade`, có terminal và tiến trình như khi cài.
- **Tab Versions** - tải danh sách version cũ của app nguồn `winget` bằng `winget show --versions`.
- **Rollback version** - chọn version rồi dùng **Cài version này** hoặc **Gỡ rồi cài version này**. Store app được đánh dấu không phù hợp vì Microsoft Store không cho chọn version cũ qua winget.
- **Lọc nhanh app trong Versions** - chuyển giữa `Đã cài`, `Chưa cài`, `Tất cả` để không phải kéo trong danh sách dài.
- **Sort catalog** - thêm sắp xếp thông minh, tên, thứ tự cài, danh mục, tình trạng, nguồn, app lớn và app chưa cài.
- **UI filter rõ hơn** - icon trong dropdown, dot màu chỉ dùng cho tình trạng, search và motion được làm mượt lại.

### An toàn

- Tất cả thao tác install/update/rollback vẫn chỉ chạy package ID nằm trong allowlist nhúng từ catalog.
- Rollback luôn hỏi xác nhận trước khi gỡ hoặc cài version, và cảnh báo rõ rủi ro mất cấu hình nếu chọn chế độ gỡ rồi cài.
- SetupKit không tự tải installer từ URL ngoài; version cũ đi qua manifest và cơ chế xác minh của winget.

### Cài đặt

| Cách | Thao tác |
|---|---|
| Một dòng lệnh | Dán lệnh PowerShell ở trên |
| Thủ công | Tải `SetupKit.exe` bên dưới và mở |

Windows 11 dùng ngay; Windows 10 thiếu WebView2 sẽ được app đề nghị cài tự động.

> `SetupKit.exe` chưa được ký số (cần chứng chỉ trả phí) nên SmartScreen có thể cảnh báo lần đầu: chọn "More info" rồi "Run anyway".
