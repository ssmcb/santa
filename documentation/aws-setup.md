# AWS SES & SNS/SQS Setup Guide

This guide walks you through setting up AWS SES for sending emails and configuring SNS/SQS for email delivery tracking.

## Prerequisites

- AWS Account
- AWS CLI installed (optional but recommended)
- Access to AWS Console

## Part 1: AWS SES Setup (Required)

### Step 1: Verify Your Email Address or Domain

1. Go to AWS SES Console: https://console.aws.amazon.com/ses/
2. Click "Verified identities" in the left sidebar
3. Click "Create identity"
4. Choose either:
   - **Email address** (easier for testing)
   - **Domain** (recommended for production)
5. Follow the verification steps (check your email or add DNS records)

### Step 2: Request Production Access (for production use)

By default, SES is in sandbox mode (can only send to verified emails).

1. In SES Console, click "Account dashboard"
2. Click "Request production access"
3. Fill out the form explaining your use case
4. Wait for approval (usually 24 hours)

### Step 3: Create IAM User for SES

1. Go to IAM Console: https://console.aws.amazon.com/iam/
2. Click "Users" → "Create user"
3. User name: `secret-santa-ses-user`
4. Click "Next"
5. Select "Attach policies directly"
6. Add these policies:
   - `AmazonSESFullAccess` (or create a custom policy with minimal permissions)
7. Click "Next" → "Create user"
8. Go to the user → "Security credentials"
9. Click "Create access key"
10. Choose "Application running outside AWS"
11. Copy the **Access Key ID** and **Secret Access Key**
12. Save these in your `.env.local` file

### Step 4: Test Email Sending

```bash
# Install AWS CLI if you haven't
brew install awscli  # macOS
# or
sudo apt-get install awscli  # Linux

# Configure AWS CLI
aws configure

# Test sending an email
aws ses send-email \
  --from noreply@yourdomain.com \
  --to recipient@example.com \
  --subject "Test Email" \
  --text "This is a test email from Secret Santa app"
```

## Part 2: SNS/SQS Setup (Optional - for Email Delivery Tracking)

This setup allows you to track email delivery status (delivered, bounced, failed).

### Step 1: Create SNS Topic

1. Go to SNS Console: https://console.aws.amazon.com/sns/
2. Click "Topics" → "Create topic"
3. Type: **Standard**
4. Name: `secret-santa-ses-notifications`
5. Click "Create topic"
6. Copy the **Topic ARN** (you'll need it later)

### Step 2: Create SQS Queue

1. Go to SQS Console: https://console.aws.amazon.com/sqs/
2. Click "Create queue"
3. Type: **Standard**
4. Name: `secret-santa-ses-notifications`
5. Configuration:
   - Visibility timeout: 300 seconds
   - Message retention: 4 days
   - Maximum message size: 256 KB
6. Click "Create queue"
7. Copy the **Queue URL** and **Queue ARN**

### Step 3: Subscribe SQS to SNS

1. In the SQS queue you just created, click "Subscribe to Amazon SNS topic"
2. Select the SNS topic you created: `secret-santa-ses-notifications`
3. Click "Save"

### Step 4: Update IAM User Permissions

Add SQS permissions to your IAM user:

1. Go to IAM Console → Users → `secret-santa-ses-user`
2. Click "Add permissions" → "Attach policies directly"
3. Add: `AmazonSQSFullAccess` (or custom policy)

### Step 5: Configure SES to Send Notifications to SNS

1. Go to SES Console
2. Click "Configuration sets" in left sidebar
3. Click "Create configuration set"
4. Name: `secret-santa-config-set`
5. Click "Create configuration set"
6. Click on the configuration set
7. Click "Event destinations" → "Add destination"
8. Select event types:
   - ✅ Delivery
   - ✅ Bounce
   - ✅ Complaint
9. Destination: **SNS**
10. SNS topic: Select `secret-santa-ses-notifications`
11. Click "Next" → "Add destination"

### Step 6: Update Your Code to Use Configuration Set

The app is already configured to use this! Just make sure your SES emails include the configuration set.

### Step 7: Add Environment Variables

Update your `.env.local`:

```bash
AWS_SES_NOTIFICATION_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/YOUR_ACCOUNT_ID/secret-santa-ses-notifications
WEBHOOK_SECRET=your-random-secret-token-here
```

### Step 8: Set Up Periodic Processing

The notification queue needs to be processed periodically. You have several options:

#### Option A: Cron Job (Simple)

Add a cron job to your server:

```bash
# Run every 5 minutes
*/5 * * * * curl -X POST https://your-domain.com/api/webhooks/ses-notifications \
  -H "Authorization: Bearer your-webhook-secret"
```

#### Option B: Vercel Cron (if deploying to Vercel)

Create `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/webhooks/ses-notifications",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

#### Option C: AWS Lambda (Advanced)

Create a Lambda function that:
1. Triggers on SQS messages
2. Calls your webhook endpoint
3. Processes notifications immediately

## Testing Email Delivery Tracking

1. Run the lottery on a test group
2. Check the SQS queue in AWS Console
3. You should see messages appearing
4. Call the webhook endpoint:
   ```bash
   curl -X POST http://localhost:3000/api/webhooks/ses-notifications \
     -H "Authorization: Bearer your-webhook-secret"
   ```
5. Check the database - participant `assignment_email_status` should update

## Troubleshooting

### Emails Not Sending

- Verify your sender email in SES
- Check if you're in sandbox mode
- Verify IAM permissions
- Check CloudWatch logs in AWS

### Notifications Not Processing

- Verify SNS topic subscription is confirmed
- Check SQS queue has messages
- Verify IAM permissions include SQS
- Check application logs for errors

### Status Not Updating

- Verify the webhook endpoint is being called
- Check MongoDB connection
- Verify participant emails match exactly
- Check application logs

## Production Checklist

- [ ] SES account approved for production
- [ ] Domain verified in SES
- [ ] IAM user has minimal required permissions
- [ ] SNS topic created and configured
- [ ] SQS queue created and subscribed to SNS
- [ ] SES configuration set created with event destinations
- [ ] Environment variables set in production
- [ ] Cron job or Lambda function set up for processing
- [ ] Webhook endpoint secured with secret token
- [ ] Test email sending and delivery tracking

## Cost Estimation

- **SES**: $0.10 per 1,000 emails
- **SNS**: $0.50 per 1 million notifications
- **SQS**: $0.40 per 1 million requests

For a typical Secret Santa group of 20 people, costs are negligible (< $0.01 per event).
