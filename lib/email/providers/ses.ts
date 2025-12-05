import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

import type { EmailProvider, SendEmailParams, SendEmailResult } from '@/lib/email/types';

export class SESProvider implements EmailProvider {
  private client: SESClient;
  private senderEmail: string;

  constructor() {
    const region = process.env.AWS_REGION || 'us-east-1';
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

    if (!accessKeyId || !secretAccessKey) {
      throw new Error('AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY must be configured');
    }

    const senderEmail = process.env.AWS_SES_SENDER_EMAIL;
    if (!senderEmail) {
      throw new Error('AWS_SES_SENDER_EMAIL is not configured');
    }

    this.client = new SESClient({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
    this.senderEmail = senderEmail;
  }

  async sendEmail({ to, subject, htmlBody, textBody }: SendEmailParams): Promise<SendEmailResult> {
    const command = new SendEmailCommand({
      Source: this.senderEmail,
      Destination: {
        ToAddresses: [to],
      },
      Message: {
        Subject: {
          Data: subject,
          Charset: 'UTF-8',
        },
        Body: {
          Text: {
            Data: textBody,
            Charset: 'UTF-8',
          },
          Html: {
            Data: htmlBody,
            Charset: 'UTF-8',
          },
        },
      },
    });

    try {
      const response = await this.client.send(command);
      return { success: true, messageId: response.MessageId };
    } catch (error) {
      console.error('Error sending email via SES:', error);
      throw error;
    }
  }
}
