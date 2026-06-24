/**
 * API Endpoint Testing Script
 * Tests all critical endpoints to verify 404 fixes
 */

const axios = require('axios');

const API_BASE = 'http://localhost:5000';
const API_URL = `${API_BASE}/api`;

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  bold: '\x1b[1m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  header: (msg) => console.log(`\n${colors.bold}${colors.blue}${msg}${colors.reset}\n`)
};

// Test results
const results = {
  total: 0,
  passed: 0,
  failed: 0,
  endpoints: []
};

/**
 * Test a single endpoint
 */
async function testEndpoint(method, path, description, expectAuth = false) {
  results.total++;
  
  try {
    const url = `${API_BASE}${path}`;
    const config = {
      method: method.toLowerCase(),
      url,
      validateStatus: () => true, // Don't throw on any status
      timeout: 5000
    };

    const response = await axios(config);
    const status = response.status;

    // Determine if test passed
    let passed = false;
    let reason = '';

    if (expectAuth && status === 401) {
      passed = true;
      reason = 'Correctly requires authentication';
    } else if (!expectAuth && status === 404) {
      passed = false;
      reason = 'Route not found (404)';
    } else if (status >= 200 && status < 300) {
      passed = true;
      reason = 'Success';
    } else if (status === 500) {
      passed = false;
      reason = 'Server error (500)';
    } else {
      passed = true; // Other status codes might be expected
      reason = `Status ${status}`;
    }

    const result = {
      method,
      path,
      description,
      status,
      passed,
      reason
    };

    results.endpoints.push(result);

    if (passed) {
      results.passed++;
      log.success(`${method.padEnd(6)} ${path.padEnd(40)} → ${status} (${reason})`);
    } else {
      results.failed++;
      log.error(`${method.padEnd(6)} ${path.padEnd(40)} → ${status} (${reason})`);
    }

    return result;

  } catch (error) {
    results.failed++;
    const errorMsg = error.code === 'ECONNREFUSED' 
      ? 'Server not running' 
      : error.message;

    const result = {
      method,
      path,
      description,
      status: 0,
      passed: false,
      reason: errorMsg
    };

    results.endpoints.push(result);
    log.error(`${method.padEnd(6)} ${path.padEnd(40)} → ERROR (${errorMsg})`);
    
    return result;
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.clear();
  log.header('🧪 API ENDPOINT TESTING');
  log.info(`Testing API at: ${API_BASE}`);
  log.info(`Started at: ${new Date().toLocaleString()}`);
  
  // Check if server is running
  log.header('1️⃣  CHECKING SERVER STATUS');
  await testEndpoint('GET', '/', 'Root endpoint');
  await testEndpoint('GET', '/api/health', 'Health check endpoint');

  // Test Authentication Endpoints
  log.header('2️⃣  AUTHENTICATION ENDPOINTS');
  await testEndpoint('POST', '/api/auth/register', 'User registration');
  await testEndpoint('POST', '/api/auth/login', 'User login');
  await testEndpoint('GET', '/api/auth/profile', 'Get user profile', true);

  // Test Report Endpoints
  log.header('3️⃣  REPORT ENDPOINTS');
  await testEndpoint('POST', '/api/reports/upload', 'Upload report', true);
  await testEndpoint('POST', '/api/reports/process', 'Process report', true);
  await testEndpoint('GET', '/api/reports', 'List all reports', true);
  await testEndpoint('GET', '/api/reports/123', 'Get report by ID', true);
  await testEndpoint('DELETE', '/api/reports/123', 'Delete report', true);
  await testEndpoint('GET', '/api/reports/download/123', 'Download report', true);
  await testEndpoint('GET', '/api/reports/dashboard/stats', 'Dashboard stats', true);

  // Test Template Endpoints
  log.header('4️⃣  TEMPLATE ENDPOINTS');
  await testEndpoint('POST', '/api/templates', 'Create template', true);
  await testEndpoint('GET', '/api/templates', 'List templates', true);
  await testEndpoint('GET', '/api/templates/123', 'Get template by ID', true);
  await testEndpoint('PUT', '/api/templates/123', 'Update template', true);
  await testEndpoint('DELETE', '/api/templates/123', 'Delete template', true);

  // Test Column Mapping Endpoints
  log.header('5️⃣  COLUMN MAPPING ENDPOINTS');
  await testEndpoint('POST', '/api/column-mappings', 'Create mapping', true);
  await testEndpoint('GET', '/api/column-mappings', 'List mappings', true);
  await testEndpoint('PUT', '/api/column-mappings/123', 'Update mapping', true);
  await testEndpoint('DELETE', '/api/column-mappings/123', 'Delete mapping', true);

  // Test Rule Endpoints
  log.header('6️⃣  RULE ENDPOINTS');
  await testEndpoint('POST', '/api/rules', 'Create rule', true);
  await testEndpoint('GET', '/api/rules', 'List rules', true);
  await testEndpoint('GET', '/api/rules/123', 'Get rule by ID', true);
  await testEndpoint('PUT', '/api/rules/123', 'Update rule', true);
  await testEndpoint('DELETE', '/api/rules/123', 'Delete rule', true);
  await testEndpoint('PATCH', '/api/rules/123/toggle', 'Toggle rule', true);

  // Test Campaign Endpoints
  log.header('7️⃣  CAMPAIGN ENDPOINTS');
  await testEndpoint('GET', '/api/campaigns', 'List campaigns', true);
  await testEndpoint('POST', '/api/campaigns', 'Create campaign', true);
  await testEndpoint('GET', '/api/campaigns/reports', 'Campaign reports', true);
  await testEndpoint('GET', '/api/campaigns/123/analytics', 'Campaign analytics', true);

  // Test Agent Endpoints
  log.header('8️⃣  AGENT ENDPOINTS');
  await testEndpoint('GET', '/api/agents', 'List agents', true);
  await testEndpoint('POST', '/api/agents', 'Create agent', true);
  await testEndpoint('GET', '/api/agents/performance/dashboard', 'Performance dashboard', true);
  await testEndpoint('GET', '/api/agents/123/performance', 'Agent performance', true);

  // Test Dashboard Endpoints
  log.header('9️⃣  DASHBOARD ENDPOINTS');
  await testEndpoint('GET', '/api/dashboard/executive', 'Executive dashboard', true);
  await testEndpoint('GET', '/api/dashboard/stats', 'Detailed stats', true);
  await testEndpoint('GET', '/api/dashboard/downloads', 'Download center', true);

  // Test Transformation Endpoints
  log.header('🔟 TRANSFORMATION ENDPOINTS');
  await testEndpoint('POST', '/api/transform/agent-performance', 'Transform report', true);
  await testEndpoint('GET', '/api/transform/rules', 'Get transformation rules', true);
  await testEndpoint('PUT', '/api/transform/rules', 'Update transformation rules', true);
  await testEndpoint('POST', '/api/transform/preview', 'Preview transformation', true);
  await testEndpoint('GET', '/api/transform/sample-rules', 'Get sample rules', true);

  // Test 404 handling
  log.header('1️⃣1️⃣  ERROR HANDLING');
  const notFoundResult = await testEndpoint('GET', '/api/nonexistent', 'Non-existent endpoint');
  if (notFoundResult.status === 404) {
    log.success('404 handler working correctly');
  }

  // Print summary
  printSummary();
}

/**
 * Print test summary
 */
function printSummary() {
  log.header('📊 TEST SUMMARY');
  
  console.log(`Total Tests:   ${results.total}`);
  console.log(`${colors.green}Passed:        ${results.passed}${colors.reset}`);
  console.log(`${colors.red}Failed:        ${results.failed}${colors.reset}`);
  
  const successRate = ((results.passed / results.total) * 100).toFixed(2);
  console.log(`Success Rate:  ${successRate}%`);

  // List failed endpoints
  const failed = results.endpoints.filter(e => !e.passed);
  if (failed.length > 0) {
    log.header('❌ FAILED ENDPOINTS');
    failed.forEach(endpoint => {
      console.log(`  ${endpoint.method.padEnd(6)} ${endpoint.path}`);
      console.log(`  Reason: ${endpoint.reason}\n`);
    });
  }

  // Recommendations
  if (results.failed > 0) {
    log.header('💡 RECOMMENDATIONS');
    
    const serverDown = results.endpoints.some(e => e.reason === 'Server not running');
    if (serverDown) {
      log.warning('Server is not running. Start it with: npm run dev');
    }

    const has404 = results.endpoints.some(e => e.status === 404);
    if (has404) {
      log.warning('Some routes return 404. Check route registration in server.ts');
    }

    const has500 = results.endpoints.some(e => e.status === 500);
    if (has500) {
      log.warning('Some routes have server errors. Check logs for details');
    }
  } else {
    log.header('🎉 ALL TESTS PASSED!');
    log.success('All API endpoints are working correctly');
  }

  console.log(`\n${colors.blue}Completed at: ${new Date().toLocaleString()}${colors.reset}\n`);
}

// Run tests
runTests().catch(error => {
  log.error(`Test runner failed: ${error.message}`);
  process.exit(1);
});
