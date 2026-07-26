const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const candidatePath = path.join(__dirname, '..', 'docs', 'package-candidates.json');
const candidates = JSON.parse(fs.readFileSync(candidatePath, 'utf8'));
const concurrency = Math.max(1, Math.min(8, Number(process.env.SETUPKIT_VERIFY_CONCURRENCY) || 6));

function verify(candidate) {
  return new Promise((resolve) => {
    const child = spawn('winget', [
      'show',
      '--id', candidate.pkg,
      '--exact',
      '--source', candidate.source || 'winget',
      '--accept-source-agreements',
      '--disable-interactivity'
    ], {
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe']
    });
    let stdout = '';
    let stderr = '';
    let settled = false;

    const finish = (result) => {
      if (settled) return;
      settled = true;
      resolve({ ...candidate, ...result });
    };
    const timer = setTimeout(() => {
      child.kill();
      finish({ ok: false, code: null, error: 'timeout' });
    }, 25000);

    child.stdout.on('data', (chunk) => { stdout += chunk.toString('utf8'); });
    child.stderr.on('data', (chunk) => { stderr += chunk.toString('utf8'); });
    child.on('error', (error) => {
      clearTimeout(timer);
      finish({ ok: false, code: null, error: error.message });
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      finish({
        ok: code === 0,
        code,
        error: code === 0 ? '' : (stderr || stdout).trim().split(/\r?\n/).at(-1)
      });
    });
  });
}

async function main() {
  const results = new Array(candidates.length);
  let cursor = 0;

  async function worker() {
    while (cursor < candidates.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await verify(candidates[index]);
      const status = results[index].ok ? 'OK  ' : 'FAIL';
      process.stdout.write(`${status} ${candidates[index].pkg}\n`);
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  const valid = results.filter((item) => item.ok);
  const invalid = results.filter((item) => !item.ok);
  const reportPath = path.join(__dirname, '..', 'docs', 'winget-verification-report.json');
  fs.writeFileSync(reportPath, `${JSON.stringify({
    verifiedAt: new Date().toISOString(),
    wingetSource: 'winget',
    valid,
    invalid
  }, null, 2)}\n`);

  process.stdout.write(`\nValid: ${valid.length}/${results.length}\n`);
  if (invalid.length) {
    process.stdout.write('Invalid package IDs:\n');
    invalid.forEach((item) => process.stdout.write(`- ${item.pkg} (${item.name})\n`));
  }
  process.stdout.write(`Report: ${reportPath}\n`);
  process.exitCode = invalid.length ? 2 : 0;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
