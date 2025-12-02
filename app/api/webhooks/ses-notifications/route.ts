import { NextRequest, NextResponse } from 'next/server';

import { processSQSMessages } from '@/lib/email/ses-notifications';

/**
 * This endpoint can be called to manually process SES notifications from the SQS queue.
 * In production, you would either:
 * 1. Set up a cron job to call this endpoint periodically
 * 2. Use AWS Lambda to trigger on SQS messages
 * 3. Use a background worker to poll the queue
 */
export async function POST(request: NextRequest) {
  try {
    const queueUrl = process.env.AWS_SES_NOTIFICATION_QUEUE_URL;

    if (!queueUrl) {
      return NextResponse.json(
        { error: 'AWS_SES_NOTIFICATION_QUEUE_URL not configured' },
        { status: 500 }
      );
    }

    // Require webhook secret for security
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.WEBHOOK_SECRET;

    if (!expectedToken) {
      return NextResponse.json({ error: 'WEBHOOK_SECRET not configured' }, { status: 500 });
    }

    if (authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const processedCount = await processSQSMessages(queueUrl);

    return NextResponse.json({
      success: true,
      processedMessages: processedCount,
      message: `Processed ${processedCount} notification(s)`,
    });
  } catch (error) {
    console.error('SES notification processing error:', error);
    return NextResponse.json({ error: 'Failed to process notifications' }, { status: 500 });
  }
}

/**
 * GET endpoint to check the status of the notification processor
 */
export async function GET() {
  const queueUrl = process.env.AWS_SES_NOTIFICATION_QUEUE_URL;
  const isConfigured = !!queueUrl;

  return NextResponse.json({
    configured: isConfigured,
    queueUrl: isConfigured ? '***configured***' : 'not configured',
    message: isConfigured
      ? 'SES notification processing is configured'
      : 'AWS_SES_NOTIFICATION_QUEUE_URL is not set',
  });
}
