const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..');
const seedDirectory = path.join(__dirname, 'ecosystem-seeds');
const requiredFields = ['id', 'name', 'kind', 'category', 'url', 'tags', 'summary'];

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function validateSeed(file) {
  const relative = path.relative(projectRoot, file);
  const seed = readJson(file);
  assert(seed.schemaVersion === 1, `${relative}: unsupported schemaVersion`);
  assert(Array.isArray(seed.items), `${relative}: items must be an array`);
  assert(seed.items.length > 0, `${relative}: items must not be empty`);

  const ids = new Set();
  const urls = new Set();
  for (const item of seed.items) {
    for (const field of requiredFields) {
      assert(Object.hasOwn(item, field), `${relative}: item is missing ${field}`);
    }
    assert(/^[a-z0-9][a-z0-9-]*$/.test(item.id), `${relative}: bad id ${item.id}`);
    assert(!ids.has(item.id), `${relative}: duplicate id ${item.id}`);
    ids.add(item.id);

    assert(/^https:\/\/github\.com\/[^/]+\/[^/]+\/?$/.test(item.url), `${relative}: non-GitHub URL ${item.url}`);
    assert(!urls.has(item.url.toLowerCase()), `${relative}: duplicate URL ${item.url}`);
    urls.add(item.url.toLowerCase());

    assert(Array.isArray(item.tags) && item.tags.length > 0, `${relative}: ${item.id} needs tags`);
    assert(item.summary.length >= 24, `${relative}: ${item.id} summary is too short`);
  }
  return seed.items.length;
}

function main() {
  const files = fs.readdirSync(seedDirectory)
    .filter((name) => name.endsWith('.json'))
    .map((name) => path.join(seedDirectory, name));
  assert(files.length > 0, 'No ecosystem seed files found.');

  const total = files.reduce((sum, file) => sum + validateSeed(file), 0);
  console.log(`Validated ${total} ecosystem seed items across ${files.length} files.`);
}

main();
