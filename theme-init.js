// Áp theme đã lưu TRƯỚC khi CSS render để tránh chớp sáng/tối khi mở app.
// File này phải được nạp trong <head>, trước các stylesheet.
(() => {
  try {
    const saved = localStorage.getItem('setupkit-theme');
    if (saved === 'light' || saved === 'dark') {
      document.documentElement.dataset.theme = saved;
    }
  } catch {
    // localStorage không khả dụng thì dùng theme hệ thống.
  }
})();
