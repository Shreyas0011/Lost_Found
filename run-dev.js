const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const rootDir = __dirname;
const serverDir = path.join(rootDir, 'server');
const clientDir = path.join(rootDir, 'client');
const mongodExe = path.join(rootDir, 'mongodb', 'extracted', 'mongodb-win32-x86_64-windows-7.0.12', 'bin', 'mongod.exe');
const mongoDataDir = path.join(rootDir, 'mongodb', 'data');
const mongoLogPath = path.join(rootDir, 'mongodb', 'mongod.log');

console.log('🚀 Starting Transcend Lost & Found Development Environment...\n');

// 1. Ensure MongoDB data dir exists
if (!fs.existsSync(mongoDataDir)) {
  fs.mkdirSync(mongoDataDir, { recursive: true });
}

// 2. Start MongoDB daemon if binary exists
if (fs.existsSync(mongodExe)) {
  try {
    const mongoProcess = spawn(mongodExe, [
      '--dbpath', mongoDataDir,
      '--port', '27017',
      '--logpath', mongoLogPath,
      '--logappend'
    ], { stdio: 'ignore', detached: true, shell: false });
    mongoProcess.unref();
    console.log('✅ MongoDB daemon verified on port 27017');
  } catch (err) {
    console.log('ℹ️  MongoDB status note:', err.message);
  }
}

// Helper to spawn processes cleanly without shell escaping issues
function runProcess(name, command, args, cwd) {
  console.log(`▶ Launching ${name}...`);
  const proc = spawn(command, args, { cwd, shell: false, env: process.env });

  proc.stdout.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach(line => {
      if (line) console.log(`[${name}] ${line}`);
    });
  });

  proc.stderr.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach(line => {
      if (line) console.log(`[${name}] ${line}`);
    });
  });

  proc.on('close', (code) => {
    console.log(`[${name}] process finished (code ${code})`);
  });

  return proc;
}

// 3. Start Express Backend
const serverNode = process.execPath;
const serverScript = path.join(serverDir, 'server.js');
runProcess('BACKEND', serverNode, [serverScript], serverDir);

// 4. Start React Vite Frontend
const viteScript = path.join(clientDir, 'node_modules', 'vite', 'bin', 'vite.js');
runProcess('FRONTEND', serverNode, [viteScript], clientDir);

console.log('\n✨ Both services active!');
console.log('   ➜ React Frontend:  http://localhost:3000');
console.log('   ➜ Express Backend: http://localhost:5000\n');
