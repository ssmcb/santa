# 🎅 Secret Santa App

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-green)](https://www.mongodb.com/)

A modern, full-stack Secret Santa application built with Next.js 16, supporting multiple languages and automated email notifications.

## ✨ Features

- 🌍 **Bilingual Support**: Full internationalization (English & Portuguese)
- 📧 **Email Verification**: Passwordless authentication with verification codes
- 🎁 **Smart Lottery**: Automated Secret Santa assignment (no one draws themselves)
- 📱 **Easy Invitations**: Share via link, WhatsApp, or direct email
- 📊 **Owner Dashboard**: Track participants and manage groups
- ✉️ **Email Tracking**: Monitor delivery status (optional)
- 🔒 **Secure Sessions**: Encrypted cookie-based authentication
- 🎨 **Modern UI**: Beautiful interface with Shadcn UI + Tailwind CSS 4

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- MongoDB instance (local or cloud)
- AWS account with SES configured

### Installation

1. **Clone and install dependencies:**

   ```bash
   npm install
   ```

2. **Set up environment variables:**

   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` and fill in:
   - `MONGODB_URI`: Your MongoDB connection string
   - `SESSION_SECRET`: Random 32+ character string
   - `AWS_ACCESS_KEY_ID`: Your AWS access key
   - `AWS_SECRET_ACCESS_KEY`: Your AWS secret key
   - `AWS_SES_SENDER_EMAIL`: Verified email in SES
   - `NEXT_PUBLIC_APP_URL`: Your app URL

3. **Run the development server:**

   ```bash
   npm run dev
   ```

4. **Open your browser:**
   - English: http://localhost:3000/en
   - Portuguese: http://localhost:3000/pt

## 📖 User Guide

### Creating a Secret Santa Group

1. Visit the app and click "Get Started"
2. Enter your name and email
3. Verify your email with the code sent to you
4. Create a new group with event details
5. Share the invitation link with participants

### Joining a Group

1. Click on the invitation link
2. Enter your name and email
3. Verify your email with the code
4. Wait for the group owner to run the lottery

### Running the Lottery

1. As group owner, wait until all participants have joined
2. Click "Run Lottery" (minimum 3 participants)
3. Everyone receives their assignment via email
4. Participants can view their recipient in the dashboard

## 🏗️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4 + Shadcn UI
- **Database**: MongoDB + Mongoose
- **Authentication**: iron-session (encrypted cookies)
- **Email**: AWS SES
- **i18n**: next-intl
- **Form Validation**: react-hook-form + Zod

## 📁 Project Structure

```
santa/
├── app/
│   ├── [locale]/              # Localized routes
│   │   ├── get-started/       # Initial signup
│   │   ├── verify/            # Email verification
│   │   ├── dashboard/         # User dashboard
│   │   ├── join/              # Join group
│   │   └── group/
│   │       ├── create/        # Create group
│   │       └── [groupId]/
│   │           └── dashboard/ # Group management
│   └── api/
│       ├── admin-signup/      # Create admin user
│       ├── verify/            # Verify email code
│       ├── resend-code/       # Resend verification
│       ├── group/
│       │   ├── create/        # Create new group
│       │   ├── join/          # Join existing group
│       │   └── send-invitation/ # Email invitations
│       ├── lottery/
│       │   └── run/           # Execute lottery
│       └── webhooks/
│           └── ses-notifications/ # Email tracking
├── lib/
│   ├── db/                    # Database models
│   ├── email/                 # Email utilities
│   ├── utils/                 # Helper functions
│   ├── auth.ts                # Authentication
│   └── session.ts             # Session management
├── components/ui/             # Shadcn UI components
├── messages/                  # i18n translations
└── documentation/             # Project docs

```

## 🔧 Configuration

### MongoDB

Use MongoDB Atlas (cloud) or local instance:

```bash
# Local MongoDB
MONGODB_URI=mongodb://localhost:27017/secretsanta

# MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/secretsanta
```

### AWS SES

See [AWS Setup Guide](./documentation/aws-setup.md) for detailed instructions.

### Session Secret

Generate a secure random string:

```bash
# macOS/Linux
openssl rand -base64 32

# Or use any random string generator
```

## 📧 Email Delivery Tracking (Optional)

To enable email delivery status tracking:

1. Follow the [AWS Setup Guide](./documentation/aws-setup.md) Part 2
2. Set up SNS topic and SQS queue
3. Add `AWS_SES_NOTIFICATION_QUEUE_URL` to `.env.local`
4. Configure a cron job to process notifications

## 🚢 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Environment Variables for Production

Make sure to set these in your deployment platform:

- `MONGODB_URI`
- `SESSION_SECRET`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`
- `AWS_SES_SENDER_EMAIL`
- `NEXT_PUBLIC_APP_URL`
- `AWS_SES_NOTIFICATION_QUEUE_URL` (optional)
- `WEBHOOK_SECRET` (optional)

### Other Platforms

The app can be deployed to any platform supporting Next.js:

- Railway
- Render
- AWS Amplify
- Digital Ocean App Platform

## 🧪 Testing

### Manual Testing Checklist

- [ ] Sign up as admin user
- [ ] Verify email with code
- [ ] Create a Secret Santa group
- [ ] Copy invitation link
- [ ] Join group as another participant (incognito/different browser)
- [ ] Verify participant email
- [ ] Add at least 3 participants total
- [ ] Run lottery as owner
- [ ] Check email for assignment
- [ ] View assignment in dashboard
- [ ] Test resend code functionality
- [ ] Test email invitation sending
- [ ] Test WhatsApp share link

## 🐛 Troubleshooting

### Emails Not Sending

- Verify sender email in AWS SES Console
- Check if SES is in sandbox mode (can only send to verified emails)
- Request production access if needed
- Check AWS credentials are correct

### Database Connection Issues

- Verify MongoDB URI is correct
- Check network access (MongoDB Atlas: whitelist IP)
- Ensure database user has proper permissions

### Session/Authentication Issues

- Verify SESSION_SECRET is set
- Check cookies are enabled in browser
- Try clearing browser cache/cookies

## 🔒 Security

This application has been designed with security best practices in mind. However, please review and follow these guidelines when deploying:

### Before Deployment

**CRITICAL - Must Do:**

1. **Never commit secrets**: Ensure `.env` is in `.gitignore` and use `.env.example` for documentation
2. **Rotate credentials**: If this is a fork/clone, generate new credentials for:
   - `SESSION_SECRET` (use `openssl rand -base64 32`)
   - MongoDB credentials
   - AWS access keys
   - `WEBHOOK_SECRET` (if using SQS notifications)
3. **Check git history**: Verify no secrets were accidentally committed
   ```bash
   git log --all --full-history -- .env
   ```

**RECOMMENDED:**

4. **Configure allowed origins**: Update `NEXT_PUBLIC_APP_URL` in production for CORS
5. **Enable security monitoring**: Use GitHub Dependabot for automatic security updates
6. **Review AWS permissions**: Use minimal IAM permissions (SES send only, SQS receive only)
7. **Use HTTPS**: Always deploy with SSL/TLS certificates

### Security Features

- **Encrypted sessions**: Uses iron-session for tamper-proof authentication
- **Input validation**: All API endpoints validate input with Zod schemas
- **No passwords**: Passwordless authentication reduces attack surface
- **Security headers**: X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy
- **CORS protection**: API routes restricted to configured origin
- **Webhook authentication**: Required Bearer token for webhook endpoints
- **Rate limiting**: Built-in request throttling on sensitive endpoints

### Reporting Vulnerabilities

Found a security issue? Please see [SECURITY.md](./SECURITY.md) for responsible disclosure guidelines.

### Best Practices

- **MongoDB**: Use connection string with authentication, restrict network access
- **AWS SES**: Keep in sandbox mode for testing, request production access only when needed
- **Session Secret**: Use cryptographically random string, never reuse across environments
- **Environment Variables**: Never log or expose in error messages
- **Dependencies**: Regularly update packages to patch known vulnerabilities

## 📚 Documentation

- [Technical Design](./documentation/design.md)
- [Implementation Timeline](./documentation/timeline.md)
- [AWS Setup Guide](./documentation/aws-setup.md)
- [Security Policy](./SECURITY.md)
- [Security Audit](./SECURITY_AUDIT.md)

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guidelines](./CONTRIBUTING.md) and [Code of Conduct](./CODE_OF_CONDUCT.md) before submitting PRs.

### How to Contribute

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests: `npm run check`
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to your branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

For more details, see [CONTRIBUTING.md](./CONTRIBUTING.md).

### Reporting Issues

- **Bug Reports**: Use the [bug report template](.github/ISSUE_TEMPLATE/bug_report.md)
- **Feature Requests**: Use the [feature request template](.github/ISSUE_TEMPLATE/feature_request.md)
- **Security Issues**: See [SECURITY.md](./SECURITY.md) for responsible disclosure

## 📄 License

MIT License - see the [LICENSE](./LICENSE) file for details.

## 🎄 Happy Holidays!

Built with ❤️ using Next.js, TypeScript, and modern web technologies
