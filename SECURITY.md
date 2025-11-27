# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in this project, please report it privately. **Do NOT use the public issue tracker for security vulnerabilities.**

Please report security vulnerabilities by emailing the maintainer directly or using GitHub's private vulnerability reporting feature.

Response timeline:
- Initial response: Within 48 hours
- Status update: Within 7 days
- Fix timeline: Depends on severity and complexity

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |

## Security Features

This application implements multiple security layers:

### CSRF Protection
- CSRF tokens on all state-changing requests (POST, PUT, DELETE, PATCH)
- Timing-safe token comparison
- Per-session token generation

### Session Security
- Encrypted session management using iron-session
- HttpOnly cookies to prevent XSS attacks
- SameSite cookie attribute set to `lax`
- Secure flag in production (HTTPS only)

### Input Validation
- Zod schema validation on all API endpoints
- Type-safe request/response handling
- Sanitization of user inputs

### Communication Security
- Security headers configured:
  - X-Frame-Options: DENY
  - X-Content-Type-Options: nosniff
  - Referrer-Policy: strict-origin-when-cross-origin
- CORS protection with explicit origin configuration
- HTTPS required in production

### Email Security
- AWS SES webhook authentication
- SNS signature verification
- Rate limiting on email operations

## Best Practices for Deployment

### Required Environment Variables

Keep these secrets secure and never commit them to version control:

- `SESSION_SECRET`: 32+ character random string
  ```bash
  # Generate with: openssl rand -base64 32
  ```
- `WEBHOOK_SECRET`: Used for AWS webhook verification
  ```bash
  # Generate with: openssl rand -hex 32
  ```

### Production Checklist

- [ ] Use HTTPS (required)
- [ ] Set strong `SESSION_SECRET` (32+ characters)
- [ ] Configure AWS IAM with minimal required permissions
- [ ] Enable AWS SES monitoring and alerts
- [ ] Regularly update dependencies (`npm audit`)
- [ ] Review and rotate secrets periodically
- [ ] Monitor application logs for suspicious activity
- [ ] Keep MongoDB connection string secure

### AWS IAM Permissions

The application requires minimal AWS permissions:
- `ses:SendEmail` - Send emails via SES
- `ses:SendRawEmail` - Send templated emails

Never use AWS root credentials. Create a dedicated IAM user with minimal permissions.

## Security Updates

Security updates will be released as patch versions (e.g., 1.0.1, 1.0.2) and will be clearly marked in the release notes.

To stay informed about security updates:
- Watch this repository for releases
- Enable GitHub security alerts
- Monitor Dependabot alerts

## Known Security Considerations

### Session Management
- Sessions are stored in encrypted cookies
- Default session lifetime is configurable
- Sessions are invalidated on logout

### Email Verification
- Email verification required for account activation
- Links expire after a set time period
- One-time use verification tokens

### Rate Limiting
Consider implementing rate limiting for:
- Login attempts
- Email sending
- API endpoints

## Security Hall of Fame

We appreciate responsible disclosure. Security researchers who report valid vulnerabilities will be acknowledged here (with permission).

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security Best Practices](https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy)
- [MongoDB Security Checklist](https://www.mongodb.com/docs/manual/administration/security-checklist/)
