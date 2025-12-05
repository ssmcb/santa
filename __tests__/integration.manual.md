# Manual Integration Tests for Rate Limiting & CSRF

Since we're working with Next.js API routes and sessions, here's a manual test plan to verify everything works correctly.

## Prerequisites

1. Start the dev server: `npm run dev`
2. Open browser to `http://localhost:3011`

## Test 1: CSRF Protection Works

### Test Invalid CSRF Token (Should Fail)

```bash
# Try to signup without CSRF token
curl -X POST http://localhost:3011/api/admin-signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test User"}'

# Expected: 403 Forbidden with "Invalid CSRF token"
```

### Test Valid Flow (Should Succeed)

1. Open browser to `http://localhost:3011/en/get-started`
2. Open DevTools > Network tab
3. Enter email and submit form
4. Check the request headers - should include `X-CSRF-Token`
5. Should succeed and redirect to verification page

## Test 2: Rate Limiting on Signup

### Test IP-based Rate Limiting

```bash
# Get CSRF token first (open browser, check cookies/session)
# Then make 6 requests quickly:

for i in {1..6}; do
  echo "Request $i"
  curl -X POST http://localhost:3011/api/admin-signup \
    -H "Content-Type: application/json" \
    -H "X-CSRF-Token: YOUR_TOKEN_HERE" \
    -d "{\"email\":\"test$i@example.com\",\"name\":\"Test $i\"}"
  echo ""
done

# Expected:
# - First 5 requests: Should succeed or fail validation
# - 6th request: Should return 429 with "Too many requests"
```

### Test Email-based Rate Limiting

```bash
# Make 4 requests with SAME email (but different IPs if possible)
for i in {1..4}; do
  echo "Request $i for same email"
  curl -X POST http://localhost:3011/api/admin-signup \
    -H "Content-Type: application/json" \
    -H "X-CSRF-Token: YOUR_TOKEN_HERE" \
    -d '{"email":"same@example.com","name":"Test User"}'
  echo ""
done

# Expected:
# - First 3 requests: Should succeed
# - 4th request: Should return 429 (3 per email per day limit)
```

## Test 3: Rate Limiting on Verification

1. Go to verification page: `http://localhost:3011/en/verify?email=test@example.com`
2. Try entering wrong codes repeatedly
3. After 5 attempts (per email limit), should see rate limit error

## Test 4: Rate Limiting on Group Operations

### Test Invitation Sending (10 per hour per user)

1. Login and create a group
2. Send 10 invitations quickly
3. Try to send 11th invitation
4. Should see rate limit error

### Test Lottery Running (3 per hour per group)

1. Create a group with 3+ participants
2. Run lottery
3. Void lottery
4. Run lottery again
5. Void and run a 3rd time
6. Try to run 4th time - should be rate limited

## Test 5: Verify Rate Limit Headers

```bash
# Make a rate-limited request
curl -v -X POST http://localhost:3011/api/admin-signup \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: YOUR_TOKEN_HERE" \
  -d '{"email":"test@example.com","name":"Test"}'

# After hitting rate limit, check response headers:
# - X-RateLimit-Limit: 5
# - X-RateLimit-Remaining: 0
# - X-RateLimit-Reset: <timestamp>
# - Retry-After: <seconds>
```

## Test 6: Verify Both Work Together

```bash
# Test that CSRF is checked BEFORE rate limiting
curl -X POST http://localhost:3011/api/admin-signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test"}'

# Expected: 403 CSRF error (not 429 rate limit)
# This proves CSRF is checked first
```

## Test 7: Code Resend Cooldown (30 seconds)

1. Go to verification page
2. Click "Resend Code"
3. Try to click "Resend Code" again immediately
4. Should see 429 error or disabled button
5. Wait 30 seconds
6. Should be able to resend again

## Expected Results Summary

✅ All POST/PUT/DELETE requests require CSRF token
✅ Signup limited to 5 per IP per 15 minutes
✅ Signup limited to 3 per email per day
✅ Verification limited to 10 per IP per 15 min
✅ Verification limited to 5 per email per 15 min
✅ Code resend has 30 second cooldown
✅ Group join limited to 5 per IP per 15 min
✅ Invitations limited to 10 per user per hour
✅ Lottery runs limited to 3 per group per hour
✅ Rate limit responses include proper headers
✅ Rate limits reset after time window expires

## Troubleshooting

### Can't get CSRF token

- Open browser DevTools > Application > Cookies
- Look for session cookie
- The CSRF token is managed by the `useCSRF` hook on the client

### Rate limits not resetting

- Rate limits are in-memory and reset on server restart
- Check that cleanup interval is running (every 10 minutes)
- For testing, you may want to reduce time windows

### Can't test from curl

- CSRF tokens are session-based
- You'll need to:
  1. Get session cookie from browser
  2. Get CSRF token from `/api/csrf/token`
  3. Include both in curl requests

Better approach: Use the browser and DevTools Network tab to test.
