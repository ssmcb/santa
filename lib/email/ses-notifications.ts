import { SQSClient, ReceiveMessageCommand, DeleteMessageCommand } from '@aws-sdk/client-sqs';

import { Participant, EmailStatus } from '@/lib/db/models/Participant';
import { connectDB } from '@/lib/db/mongodb';

const sqsClient = new SQSClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

type SESNotification = {
  notificationType: 'Delivery' | 'Bounce' | 'Complaint';
  mail: {
    messageId: string;
    destination: string[];
  };
  delivery?: {
    timestamp: string;
  };
  bounce?: {
    bounceType: string;
    bouncedRecipients: Array<{ emailAddress: string }>;
  };
  complaint?: {
    complainedRecipients: Array<{ emailAddress: string }>;
  };
};

type SNSMessage = {
  Type: string;
  Message: string;
  MessageId: string;
};

export async function processSQSMessages(queueUrl: string): Promise<number> {
  try {
    const command = new ReceiveMessageCommand({
      QueueUrl: queueUrl,
      MaxNumberOfMessages: 10,
      WaitTimeSeconds: 1,
    });

    const response = await sqsClient.send(command);

    if (!response.Messages || response.Messages.length === 0) {
      return 0;
    }

    await connectDB();

    let processedCount = 0;

    for (const message of response.Messages) {
      try {
        if (!message.Body) continue;

        // Parse SNS message
        const snsMessage: SNSMessage = JSON.parse(message.Body);

        if (snsMessage.Type !== 'Notification') continue;

        // Parse SES notification
        const sesNotification: SESNotification = JSON.parse(snsMessage.Message);

        // Process the notification
        await processSESNotification(sesNotification);

        // Delete the message from the queue
        if (message.ReceiptHandle) {
          await sqsClient.send(
            new DeleteMessageCommand({
              QueueUrl: queueUrl,
              ReceiptHandle: message.ReceiptHandle,
            })
          );
        }

        processedCount++;
      } catch (error) {
        console.error('Error processing individual message:', error);
        // Continue processing other messages
      }
    }

    return processedCount;
  } catch (error) {
    console.error('Error processing SQS messages:', error);
    throw error;
  }
}

async function processSESNotification(notification: SESNotification): Promise<void> {
  const { notificationType, mail } = notification;

  // Extract recipient emails
  const recipientEmails = mail.destination;

  let newStatus: EmailStatus = 'sent';

  switch (notificationType) {
    case 'Delivery':
      newStatus = 'delivered';
      break;
    case 'Bounce':
      newStatus = 'bounced';
      break;
    case 'Complaint':
      newStatus = 'failed';
      break;
    default:
      console.warn('Unknown notification type:', notificationType);
      return;
  }

  // Update participant email status
  for (const email of recipientEmails) {
    try {
      const result = await Participant.updateMany(
        {
          email: email.toLowerCase(),
          assignment_email_status: { $in: ['sent', 'pending'] },
        },
        {
          $set: {
            assignment_email_status: newStatus,
          },
        }
      );

      console.info(
        `Updated ${result.modifiedCount} participant(s) for ${email} to status: ${newStatus}`
      );
    } catch (error) {
      console.error(`Failed to update status for ${email}:`, error);
    }
  }
}

export function getEmailStatusColor(status: EmailStatus): string {
  switch (status) {
    case 'delivered':
      return 'green';
    case 'sent':
      return 'yellow';
    case 'bounced':
    case 'failed':
      return 'red';
    case 'pending':
    default:
      return 'gray';
  }
}
