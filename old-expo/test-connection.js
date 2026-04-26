#!/usr/bin/env node
/**
 * Connection Test Script
 * Tests connection to Unraid server with provided credentials
 */

// Try both with and without port
const SERVER_URLS = [
  'http://192.168.21.1:3001/graphql',  // Default port
  'http://192.168.21.1/graphql',       // No port (nginx/proxy)
];
const API_KEY = '89a7ae67e300c9c05441cec0951930de654058ac61bde7f23a3625cec8568781';

// HealthCheck query
const HEALTH_CHECK_QUERY = `
  query HealthCheck {
    info {
      os {
        platform
        __typename
      }
      __typename
    }
  }
`;

console.log('🔍 Unraid Connection Test\n');
console.log('━'.repeat(60));
console.log(`🔑 API Key: ${API_KEY.substring(0, 10)}...${API_KEY.substring(API_KEY.length - 10)}`);
console.log('━'.repeat(60));
console.log('\n⏳ Testing connections...\n');

// Create timeout promise
const timeoutPromise = (ms) => {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`timeout`));
    }, ms);
  });
};

// Test connection for a single URL
async function testSingleConnection(serverUrl) {
  const startTime = Date.now();
  
  console.log(`📡 Testing: ${serverUrl}`);
  
  try {
    const fetchPromise = fetch(serverUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
      },
      body: JSON.stringify({
        operationName: 'HealthCheck',
        query: HEALTH_CHECK_QUERY,
        variables: {},
      }),
    });

    // Race between fetch and timeout (5 seconds per URL)
    const response = await Promise.race([
      fetchPromise,
      timeoutPromise(5000)
    ]);

    const elapsed = Date.now() - startTime;

    if (!response.ok) {
      console.log(`   ❌ HTTP Error: ${response.status} ${response.statusText} (${elapsed}ms)\n`);
      return { success: false, error: `HTTP ${response.status}`, elapsed };
    }

    const data = await response.json();
    
    if (data.errors) {
      console.log(`   ⚠️  GraphQL Errors (${elapsed}ms)`);
      data.errors.forEach(err => {
        console.log(`      • ${err.message}`);
      });
      console.log('');
      return { success: false, error: 'GraphQL Error', elapsed };
    }
    
    if (data.data && data.data.info) {
      console.log(`   ✅ Success! (${elapsed}ms)`);
      console.log(`   📊 Platform: ${data.data.info.os.platform}\n`);
      return { success: true, data, elapsed, url: serverUrl };
    } else {
      console.log(`   ❌ Unexpected response (${elapsed}ms)\n`);
      return { success: false, error: 'Invalid response', elapsed };
    }
    
  } catch (error) {
    const elapsed = Date.now() - startTime;
    
    if (error.message === 'timeout') {
      console.log(`   ⏱️  Timeout (${elapsed}ms)\n`);
      return { success: false, error: 'Timeout', elapsed };
    }
    
    console.log(`   ❌ ${error.message} (${elapsed}ms)\n`);
    return { success: false, error: error.message, elapsed };
  }
}

// Test all URLs
async function testAllConnections() {
  const results = [];
  
  for (const url of SERVER_URLS) {
    const result = await testSingleConnection(url);
    results.push(result);
    
    if (result.success) {
      // Found working connection
      console.log('━'.repeat(60));
      console.log('✨ CONNECTION SUCCESSFUL!\n');
      console.log(`Use this URL in your app: ${result.url}`);
      console.log('\nServer Response:');
      console.log(JSON.stringify(result.data, null, 2));
      console.log('━'.repeat(60));
      process.exit(0);
    }
  }
  
  // No successful connections
  console.log('━'.repeat(60));
  console.log('❌ ALL CONNECTIONS FAILED\n');
  console.log('🔧 Troubleshooting Steps:\n');
  console.log('1. Check Server Status:');
  console.log('   • SSH into Unraid server');
  console.log('   • Run: systemctl status unraid-api');
  console.log('   • Ensure service is "active (running)"\n');
  
  console.log('2. Verify Network:');
  console.log('   • Ensure device is on same network (192.168.21.x)');
  console.log('   • Try: ping 192.168.21.1');
  console.log('   • Check firewall settings\n');
  
  console.log('3. Check Port:');
  console.log('   • Default Unraid API port is 3001');
  console.log('   • Verify in Unraid API settings');
  console.log('   • Try accessing in browser: http://192.168.21.1:3001\n');
  
  console.log('4. Test from Browser:');
  console.log('   • Open: http://192.168.21.1:3001/graphql');
  console.log('   • Should see GraphQL Playground or API docs\n');
  
  console.log('5. Check API Key:');
  console.log('   • Generate new key: unraid-api apikey --create');
  console.log('   • Copy the new key to your app\n');
  
  console.log('📝 Test Results:');
  results.forEach((result, index) => {
    console.log(`   ${index + 1}. ${SERVER_URLS[index]}`);
    console.log(`      Error: ${result.error}`);
    console.log(`      Time: ${result.elapsed}ms`);
  });
  
  console.log('\n━'.repeat(60));
  process.exit(1);
}

// Run the tests
testAllConnections().catch(error => {
  console.error('\n❌ Unexpected error:', error);
  process.exit(1);
});
