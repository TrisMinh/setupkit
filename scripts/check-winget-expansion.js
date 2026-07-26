const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..');
const candidates = JSON.parse(
  fs.readFileSync(path.join(projectRoot, 'docs', 'package-expansion-candidates.json'), 'utf8')
);
const concurrency = Math.max(1, Math.min(10, Number(process.env.SETUPKIT_VERIFY_CONCURRENCY) || 8));

function verify(candidate) {
  return new Promise((resolve) => {
    const child = spawn('winget', [
      'show',
      '--id', candidate.pkg,
      '--exact',
      '--source', 'winget',
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
    }, 30000);

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
  let completed = 0;

  async function worker() {
    while (cursor < candidates.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await verify(candidates[index]);
      completed += 1;
      if (completed % 20 === 0 || completed === candidates.length) {
        const validSoFar = results.filter((item) => item?.ok).length;
        process.stdout.write(`Checked ${completed}/${candidates.length}, valid ${validSoFar}\n`);
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  const valid = results.filter((item) => item.ok);
  const invalid = results.filter((item) => !item.ok);
  const reportPath = path.join(projectRoot, 'docs', 'winget-expansion-verification.json');
  fs.writeFileSync(reportPath, `${JSON.stringify({
    verifiedAt: new Date().toISOString(),
    policy: 'legitimate-packages-from-winget-community-repository',
    wingetSource: 'winget',
    valid,
    invalid
  }, null, 2)}\n`);

  process.stdout.write(`Valid expansion: ${valid.length}/${results.length}\n`);
  process.stdout.write(`Excluded unavailable IDs: ${invalid.length}\n`);
  process.stdout.write(`Report: ${reportPath}\n`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
