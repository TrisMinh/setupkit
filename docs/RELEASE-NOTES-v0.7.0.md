## SetupKit v0.7.0

Một file `SetupKit.exe` duy nhất (~12 MB), mở là chạy - hoặc cài bằng một dòng lệnh:

```powershell
irm https://raw.githubusercontent.com/TrisMinh/setupkit/main/scripts/install.ps1 | iex
```

### Có gì mới

- ⬆️ **Cập nhật ứng dụng đã cài** - SetupKit tự phát hiện app có bản mới và gắn nhãn "Có bản cập nhật mới" trên thẻ. Mở chi tiết, bấm **Cập nhật** để chạy `winget upgrade` cho đúng app đó, có terminal và tiến trình như khi cài.
- 🗑️ **Gỡ cài đặt ngay trong app** - nút **Gỡ cài đặt** trong hộp thoại chi tiết chạy `winget uninstall`, hỏi xác nhận rồi cập nhật lại trạng thái.
- 📥 **Nhập hồ sơ JSON** - áp lại đúng bộ ứng dụng từ hồ sơ đã xuất để dựng máy tiếp theo y hệt, tự bỏ qua app đã cài.
- ⚡ **Chọn nhanh hàng loạt** - "Chọn hết" thêm mọi app đang lọc mà chưa cài; "Bỏ chọn" làm trống gói trong một bấm.
- 💾 **Nhớ danh sách đang chọn** - gói cài đặt được khôi phục nguyên vẹn ở lần mở sau.
- 🔁 **Cài lại ứng dụng lỗi** và ⏸️ **Dừng giữa chừng** - thử lại đúng app thất bại, hoặc dừng hàng đợi an toàn sau app đang chạy.
- 🧰 **Máy chưa có winget** - hiện banner mời cài **App Installer** từ Microsoft Store chỉ với một bấm, thay vì báo lỗi cụt.

### Gỡ bỏ

- Gỡ bỏ trang Kích hoạt Windows (cả giao diện lẫn backend).

### Cho người phát triển

- Thêm GitHub Actions tự build `SetupKit.exe` và tạo Release khi đẩy tag `v*`.

### Cài đặt

| Cách | Thao tác |
|---|---|
| Một dòng lệnh | Dán lệnh PowerShell ở trên |
| Thủ công | Tải `SetupKit.exe` bên dưới và mở |

Windows 11 dùng ngay; Windows 10 thiếu WebView2 sẽ được app đề nghị cài tự động.

> `SetupKit.exe` chưa được ký số (cần chứng chỉ trả phí) nên SmartScreen có thể cảnh báo lần đầu: chọn "More info" rồi "Run anyway".
