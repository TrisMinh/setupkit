## SetupKit v0.4.1

Một file `SetupKit.exe` duy nhất (~12 MB), mở là chạy — hoặc cài bằng một dòng lệnh:

```powershell
irm https://raw.githubusercontent.com/TrisMinh/setupkit/main/scripts/install.ps1 | iex
```

### Có gì mới

- 🎛️ **Dropdown lọc hoàn toàn mới** — danh mục, nguồn và tình trạng cài đặt giờ dùng menu tùy chỉnh đồng bộ theme sáng/tối, có đánh dấu mục đang chọn và điều khiển được bằng bàn phím
- 🧹 **Sửa ô tìm kiếm hiện hai nút xóa**
- 🗂️ **Mã nguồn tái cấu trúc** theo bố cục chuẩn Wails + Go: giao diện trong `frontend/`, logic trong `internal/kit/`, gốc dự án chỉ còn bootstrap - dễ đọc, dễ đóng góp
- 📦 **Exe nhẹ hơn ~300 KB** nhờ bỏ catalog bị nhúng trùng hai lần
- ⚡ Kèm toàn bộ cải tiến của v0.4.0: theo dõi cài đặt mượt, hết chớp trắng dark mode, sửa 10 lỗi giao diện

### Cài đặt

| Cách | Thao tác |
|---|---|
| Một dòng lệnh | Dán lệnh PowerShell ở trên |
| Thủ công | Tải `SetupKit.exe` bên dưới và mở, không cần cài đặt |

Windows 11 dùng ngay; Windows 10 thiếu WebView2 sẽ được app đề nghị cài tự động.
