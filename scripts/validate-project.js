const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..');
const frontendRoot = path.join(projectRoot, 'frontend');
const html = fs.readFileSync(path.join(frontendRoot, 'index.html'), 'utf8');
const renderer = fs.readFileSync(path.join(frontendRoot, 'renderer.js'), 'utf8');
const styles = fs.readFileSync(path.join(frontendRoot, 'styles.css'), 'utf8');
const catalog = JSON.parse(fs.readFileSync(path.join(frontendRoot, 'catalog.json'), 'utf8'));

function unique(values) {
  return new Set(values);
}

const htmlIDs = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
if (unique(htmlIDs).size !== htmlIDs.length) {
  throw new Error('index.html contains duplicate element IDs');
}

const rendererIDs = [...renderer.matchAll(/getElementById\(['"]([^'"]+)['"]\)/g)]
  .map((match) => match[1]);
const missingDOMIDs = unique(rendererIDs.filter((id) => !htmlIDs.includes(id)));
if (missingDOMIDs.size) {
  throw new Error(`renderer.js references missing DOM IDs: ${[...missingDOMIDs].join(', ')}`);
}

const missingLogos = catalog.apps.filter((app) => (
  app.logo && !fs.existsSync(path.join(frontendRoot, 'assets', 'apps', app.logo))
));
if (missingLogos.length) {
  throw new Error(`Catalog references missing logos: ${missingLogos.map((app) => app.logo).join(', ')}`);
}

for (const [name, content] of Object.entries({ 'index.html': html, 'renderer.js': renderer, 'styles.css': styles })) {
  if (/[—–]/u.test(content)) throw new Error(`${name} contains a visible em dash or en dash`);
}

console.log(
  `Validated ${catalog.apps.length} apps, ${catalog.plans.length} plans, `
  + `${catalog.tags.length} tags, ${catalog.apps.filter((app) => app.logo).length} logos, `
  + `${rendererIDs.length} DOM references.`
);
