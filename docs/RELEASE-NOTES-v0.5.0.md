## SetupKit v0.5.0

Một file `SetupKit.exe` duy nhất (~12 MB), mở là chạy — hoặc cài bằng một dòng lệnh:

```powershell
irm https://raw.githubusercontent.com/TrisMinh/setupkit/main/scripts/install.ps1 | iex
```

### Sửa lỗi quan trọng

- 🐛 **Quét ứng dụng đã hoạt động trở lại** — bản trước không đọc được trạng thái cài đặt trên máy (cầu nối native lệch tên sau khi tái cấu trúc). Giờ SetupKit lại quét đúng winget, Registry và Start Menu để biết máy bạn đã có app nào.

### Thêm mới

- 📊 **Thanh trạng thái dưới cùng** (kiểu IDE) hiện ở mọi tab: trạng thái winget, số app đã cài, số đang chọn, và nút mở terminal nhanh
- 📁 **Office nổi bật hơn** — gói Office & Remote Work (Microsoft 365: Word, Excel, PowerPoint, Outlook, Teams, OneDrive...) được đưa lên đầu danh sách plan

### Cải thiện

- 🔲 **Lưới ứng dụng dày hơn** — 3-4 app mỗi hàng trên màn rộng thay vì 2, tận dụng tối đa màn hình và tự co theo cửa sổ

### Cài đặt

| Cách | Thao tác |
|---|---|
| Một dòng lệnh | Dán lệnh PowerShell ở trên |
| Thủ công | Tải `SetupKit.exe` bên dưới và mở |

Windows 11 dùng ngay; Windows 10 thiếu WebView2 sẽ được app đề nghị cài tự động.
