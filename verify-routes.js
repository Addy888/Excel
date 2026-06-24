/**
 * Quick Route Verification Script
 * Verifies server is running and key endpoints are accessible
 */

const http = require('http');

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

console.log('\n🔍 Verifying API Routes...\n');

const tests = [
  { path: '/', name: 'Root Endpoint' },
  { path: '/api/health', name: 'Health Check' },
  { path: '/api/auth/login', name: 'Auth Login', method: 'POST' },
  { path: '/api/reports', name: 'Reports List' },
  { path: '/api/reports/upload', name: 'Upload Endpoint', method: 'POST' },
];

let passed = 0;
let failed = 0;

function testEndpoint(test) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: test.path,
      method: test.method || 'GET',
      timeout: 3000
    };

    const req = http.request(options, (res) => {
      // Any response (even 401) means the route exists
      if (res.statusCode === 404) {
        console.log(`${RED}❌ ${test.name.padEnd(30)} → 404 NOT FOUND${RESET}`);
        failed++;
      } else {
        console.log(`${GREEN}✅ ${test.name.padEnd(30)} → ${res.statusCode}${RESET}`);
        passed++;
      }
      resolve();
    });

    req.on('error', (error) => {
      if (error.code === 'ECONNREFUSED') {
        console.log(`${RED}❌ ${test.name.padEnd(30)} → SERVER NOT RUNNING${RESET}`);
      } else {
        console.log(`${RED}❌ ${test.name.padEnd(30)} → ${error.message}${RESET}`);
      }
      failed++;
      resolve();
    });

    req.on('timeout', () => {
      console.log(`${YELLOW}⚠️  ${test.name.padEnd(30)} → TIMEOUT${RESET}`);
      failed++;
      req.destroy();
      resolve();
    });

    req.end();
  });
}

async function runTests() {
  for (const test of tests) {
    await testEndpoint(test);
  }

  console.log(`\n${passed > 0 ? GREEN : RED}Passed: ${passed}${RESET}`);
  console.log(`${failed > 0 ? RED : GREEN}Failed: ${failed}${RESET}\n`);

  if (failed > 0) {
    console.log(`${YELLOW}💡 To fix:${RESET}`);
    console.log('   1. Make sure server is running: npm run dev');
    console.log('   2. Check server.ts route registration');
    console.log('   3. Verify routes are using correct paths\n');
    process.exit(1);
  } else {
    console.log(`${GREEN}🎉 All routes verified successfully!${RESET}\n`);
    process.exit(0);
  }
}

runTests();
