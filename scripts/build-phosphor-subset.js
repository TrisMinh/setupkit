#!/usr/bin/env node
/**
 * Tạo assets/phosphor/style.css chỉ chứa những icon Phosphor mà app thật sự
 * dùng (index.html + renderer.js + catalog.json). Bản CSS đầy đủ ~78KB với
 * hơn 1500 icon nằm ở scripts/phosphor-full/style.css; sau khi trim chỉ còn
 * vài KB nên WebView2 parse nhanh hơn lúc khởi động.
 *
 * Chạy tự động trong scripts/build-native.ps1 (sau build-catalog.js).
 * Nếu một icon được dùng nhưng không tồn tại trong bộ Phosphor, script sẽ
 * fail để lỗi được phát hiện ngay lúc build thay vì icon trống trong app.
 */
const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.join(__dirname, '..');
const frontendRoot = path.join(projectRoot, 'frontend');
const fullCssPath = path.join(__dirname, 'phosphor-full', 'style.css');
const outputPath = path.join(frontendRoot, 'assets', 'phosphor', 'style.css');

const fullCss = fs.readFileSync(fullCssPath, 'utf8');

// Bảng icon -> codepoint từ CSS đầy đủ.
const iconMap = new Map();
for (const match of fullCss.matchAll(/\.ph\.ph-([a-z0-9-]+):before\s*\{\s*content:\s*"(\\[0-9a-f]+)";\s*\}/g)) {
  iconMap.set(match[1], match[2]);
}
if (iconMap.size < 1000) {
  console.error(`phosphor-full/style.css có vẻ không đầy đủ (chỉ thấy ${iconMap.size} icon).`);
  process.exit(1);
}

// Thu thập icon đang được dùng.
const used = new Set(['package']); // fallback mặc định trong renderer.js
const scanText = (text) => {
  for (const match of text.matchAll(/(?<![a-z0-9])ph-([a-z0-9-]+)/g)) {
    used.add(match[1]);
  }
};

scanText(fs.readFileSync(path.join(frontendRoot, 'index.html'), 'utf8'));
scanText(fs.readFileSync(path.join(frontendRoot, 'renderer.js'), 'utf8'));

const catalog = JSON.parse(fs.readFileSync(path.join(frontendRoot, 'catalog.json'), 'utf8'));
const addIconField = (item) => {
  if (item?.icon?.startsWith('ph-')) used.add(item.icon.slice(3));
};
(catalog.categories || []).forEach(addIconField);
(catalog.tags || []).forEach(addIconField);
(catalog.plans || []).forEach(addIconField);

// Icon nào không tồn tại trong bộ Phosphor thì báo lỗi ngay.
const missing = [...used].filter((name) => !iconMap.has(name));
if (missing.length) {
  console.error(`Icon không tồn tại trong Phosphor: ${missing.join(', ')}`);
  process.exit(1);
}

const header = fullCss.slice(0, fullCss.indexOf('.ph.ph-')).trimEnd();
const rules = [...used]
  .sort()
  .map((name) => `.ph.ph-${name}:before {\n  content: "${iconMap.get(name)}";\n}`)
  .join('\n');

const banner = `/*\n * File này được tạo tự động bởi scripts/build-phosphor-subset.js.\n * Đừng sửa tay — hãy sửa scripts/phosphor-full/style.css rồi chạy lại script.\n * ${used.size} / ${iconMap.size} icon được giữ lại.\n */\n`;

fs.writeFileSync(outputPath, `${banner}${header}\n\n${rules}\n`);
console.log(`Đã tạo frontend/assets/phosphor/style.css với ${used.size}/${iconMap.size} icon.`);
