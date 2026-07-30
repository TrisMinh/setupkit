## SetupKit v0.8.0

Một file `SetupKit.exe` duy nhất (~12 MB), mở là chạy - hoặc cài bằng một dòng lệnh:

```powershell
irm https://raw.githubusercontent.com/TrisMinh/setupkit/main/scripts/install.ps1 | iex
```

### Có gì mới

- **Tab Workspaces riêng** - xem toàn bộ 24 bộ công cụ theo vai trò/lĩnh vực, không chỉ vài workspace nổi bật trên trang chính.
- **Chi tiết workspace** - mở từng workspace để xem quy mô, số app cần cài, app đã có, nguồn WinGet/Store, danh sách app compact và preview lệnh cài.
- **Preview logo khi hover** - card workspace/preset chỉ bung rail logo 2 dòng khi hover/focus, giữ giao diện sạch khi duyệt.
- **Workspace card gọn hơn** - logo tự dàn đều theo chiều ngang, bỏ caret thừa, nút xem chi tiết chỉ hiện khi cần.
- **Danh sách app trong workspace detail dày hơn** - desktop xếp 2-3 app mỗi hàng, giảm cuộn dọc.
- **Icon view cân hàng nút** - nút chọn/chi tiết thẳng hàng dù tên app dài ngắn khác nhau.
- **List view nhiều thông tin hơn** - row dùng thêm khoảng trống để hiện mô tả, type/tag và trạng thái cài đặt.

### Cho người phát triển

- `npm run validate` kiểm tra thêm ecosystem seed data qua `scripts/validate-ecosystem-seeds.js`.
- Release mặc định chuyển sang tag `v0.8.0`.

### Cài đặt

| Cách | Thao tác |
|---|---|
| Một dòng lệnh | Dán lệnh PowerShell ở trên |
| Thủ công | Tải `SetupKit.exe` bên dưới và mở |

Windows 11 dùng ngay; Windows 10 thiếu WebView2 sẽ được app đề nghị cài tự động.

> `SetupKit.exe` chưa được ký số (cần chứng chỉ trả phí) nên SmartScreen có thể cảnh báo lần đầu: chọn "More info" rồi "Run anyway".
