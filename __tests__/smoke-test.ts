/**
 * Smoke Test for Rate Limiting
 *
 * This is a simple script to verify rate limiting works
 * Run with: npx tsx __tests__/smoke-test.ts
 */

import { NextRequest } from 'next/server';
import { rateLimit } from '../lib/middleware/rateLimit';

// Mock request helper
function createRequest(url: string, ip: string): NextRequest {
  const request = new NextRequest(url, {
    method: 'POST',
    headers: new Headers({
      'x-forwarded-for': ip,
      'content-type': 'application/json',
    }),
  });
  return request;
}

async function runSmokeTests() {
  console.log('🧪 Running Rate Limiting Smoke Tests\n');

  // Test 1: Basic rate limiting
  console.log('Test 1: Basic IP-based rate limiting');
  const url = 'http://localhost:3000/api/test';
  const ip = '192.168.1.100';

  let passedRequests = 0;
  let blockedRequests = 0;

  for (let i = 1; i <= 7; i++) {
    const request = createRequest(url, ip);
    const result = await rateLimit(request, {
      max: 5,
      windowSeconds: 60,
    });

    if (result === null) {
      passedRequests++;
      console.log(`  ✅ Request ${i}: Allowed`);
    } else {
      blockedRequests++;
      const json = await result.json();
      console.log(`  ❌ Request ${i}: Blocked - ${json.error}`);
    }
  }

  console.log(`\n  Summary: ${passedRequests} allowed, ${blockedRequests} blocked`);

  if (passedRequests === 5 && blockedRequests === 2) {
    console.log('  ✅ Test 1 PASSED: Correctly allowed 5 and blocked 2\n');
  } else {
    console.log('  ❌ Test 1 FAILED: Expected 5 allowed and 2 blocked\n');
    process.exit(1);
  }

  // Test 2: Different IPs are independent
  console.log('Test 2: Different IPs are rate limited independently');
  const ip2 = '192.168.1.101';
  const request2 = createRequest(url, ip2);
  const result2 = await rateLimit(request2, {
    max: 5,
    windowSeconds: 60,
  });

  if (result2 === null) {
    console.log('  ✅ Test 2 PASSED: Different IP can still make requests\n');
  } else {
    console.log('  ❌ Test 2 FAILED: Different IP should not be rate limited\n');
    process.exit(1);
  }

  // Test 3: Custom key generator
  console.log('Test 3: Custom key generator (email-based)');
  const email = 'test@example.com';

  let emailPassed = 0;
  let emailBlocked = 0;

  for (let i = 1; i <= 4; i++) {
    // Use different IPs but same email
    const request = createRequest(url, `192.168.1.${200 + i}`);
    const result = await rateLimit(request, {
      max: 3,
      windowSeconds: 60,
      keyGenerator: async () => `email:${email}`,
    });

    if (result === null) {
      emailPassed++;
      console.log(`  ✅ Request ${i} (${email}): Allowed`);
    } else {
      emailBlocked++;
      console.log(`  ❌ Request ${i} (${email}): Blocked`);
    }
  }

  if (emailPassed === 3 && emailBlocked === 1) {
    console.log('  ✅ Test 3 PASSED: Email-based rate limiting works\n');
  } else {
    console.log('  ❌ Test 3 FAILED: Expected 3 allowed and 1 blocked\n');
    process.exit(1);
  }

  // Test 4: Rate limit response format
  console.log('Test 4: Rate limit response format');
  const blockedRequest = createRequest(url, ip); // IP already over limit from Test 1
  const blockedResult = await rateLimit(blockedRequest, {
    max: 5,
    windowSeconds: 60,
  });

  if (blockedResult) {
    const json = await blockedResult.json();
    const hasError = json.error === 'Too many requests';
    const hasCode = json.code === 'RATE_LIMIT_EXCEEDED';
    const hasRetryAfter = typeof json.retryAfter === 'number';
    const hasHeaders =
      blockedResult.headers.get('X-RateLimit-Limit') === '5' &&
      blockedResult.headers.get('X-RateLimit-Remaining') === '0';

    if (hasError && hasCode && hasRetryAfter && hasHeaders) {
      console.log('  ✅ Test 4 PASSED: Response format is correct');
      console.log(`     - Error: "${json.error}"`);
      console.log(`     - Code: ${json.code}`);
      console.log(`     - Retry After: ${json.retryAfter}s`);
      console.log(
        `     - Headers: Limit=${blockedResult.headers.get('X-RateLimit-Limit')}, Remaining=${blockedResult.headers.get('X-RateLimit-Remaining')}\n`
      );
    } else {
      console.log('  ❌ Test 4 FAILED: Response format incorrect\n');
      console.log('     Response:', json);
      process.exit(1);
    }
  } else {
    console.log('  ❌ Test 4 FAILED: Expected blocked response\n');
    process.exit(1);
  }

  // Test 5: Fail open on key generation failure
  console.log('Test 5: Fail open when key generation fails');
  const request5 = createRequest(url, '192.168.1.102');
  const result5 = await rateLimit(request5, {
    max: 1,
    windowSeconds: 60,
    keyGenerator: async () => null, // Return null = can't generate key
  });

  if (result5 === null) {
    console.log('  ✅ Test 5 PASSED: Fails open when key generation fails\n');
  } else {
    console.log('  ❌ Test 5 FAILED: Should fail open\n');
    process.exit(1);
  }

  // All tests passed!
  console.log('\n✅ ALL SMOKE TESTS PASSED!');
  console.log('\n📊 Summary:');
  console.log('   ✓ Basic IP-based rate limiting works');
  console.log('   ✓ Different IPs are independent');
  console.log('   ✓ Custom key generators work (email-based)');
  console.log('   ✓ Response format is correct');
  console.log('   ✓ Fails open on errors');
  console.log('\n🎉 Rate limiting implementation is working correctly!\n');
}

// Run the tests
runSmokeTests().catch((error) => {
  console.error('\n❌ Smoke test failed with error:', error);
  process.exit(1);
});
