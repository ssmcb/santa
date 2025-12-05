import { Resend } from 'resend';

import type { EmailProvider, SendEmailParams, SendEmailResult } from '@/lib/email/types';

export class ResendProvider implements EmailProvider {
  private client: Resend;
  private senderEmail: string;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY is not configured');
    }

    const senderEmail = process.env.RESEND_SENDER_EMAIL;
    if (!senderEmail) {
      throw new Error('RESEND_SENDER_EMAIL is not configured');
    }

    this.client = new Resend(apiKey);
    this.senderEmail = senderEmail;
  }

  async sendEmail({ to, subject, htmlBody, textBody }: SendEmailParams): Promise<SendEmailResult> {
    try {
      const { data, error } = await this.client.emails.send({
        from: this.senderEmail,
        to: [to],
        subject,
        html: htmlBody,
        text: textBody,
      });

      if (error) {
        console.error('Error sending email via Resend:', error);
        throw error;
      }

      return { success: true, messageId: data?.id };
    } catch (error) {
      console.error('Error sending email via Resend:', error);
      throw error;
    }
  }
}
