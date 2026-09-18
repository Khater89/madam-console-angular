import { spawn } from 'node:child_process';

console.log('[Dev Runner] Starting Madama Group Console development environment...');

// 1. Start the backend API server on 127.0.0.1:3001
const apiProcess = spawn(process.execPath, ['api-server.mjs'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    PORT: '3001'
  }
});

// 2. Start Angular dev server on 0.0.0.0:3000 with Vite proxy
const ngArgs = [
  'ng',
  'serve',
  '--host',
  '0.0.0.0',
  '--port',
  '3000',
  '--proxy-config',
  'proxy.conf.json'
];

const ngProcess = spawn('npx', ngArgs, {
  stdio: 'inherit',
  env: process.env
});

let isShuttingDown = false;
function shutdown(code = 0) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log('[Dev Runner] Shutting down development processes...');

  try {
    apiProcess.kill('SIGTERM');
  } catch (e) {}

  try {
    ngProcess.kill('SIGTERM');
  } catch (e) {}

  setTimeout(() => {
    try {
      apiProcess.kill('SIGKILL');
    } catch (e) {}
    try {
      ngProcess.kill('SIGKILL');
    } catch (e) {}
    process.exit(code);
  }, 1000);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));
process.on('SIGHUP', () => shutdown(0));
process.on('exit', () => shutdown(0));

apiProcess.on('error', (err) => {
  console.error('[Dev Runner] API Server error:', err);
});

ngProcess.on('error', (err) => {
  console.error('[Dev Runner] Angular serve error:', err);
});

ngProcess.on('exit', (code) => {
  console.log(`[Dev Runner] Angular serve exited with code ${code}`);
  shutdown(code ?? 0);
});
