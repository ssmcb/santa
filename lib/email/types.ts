export type SendEmailParams = {
  to: string;
  subject: string;
  htmlBody: string;
  textBody: string;
};

export type SendEmailResult = {
  success: boolean;
  messageId?: string;
};

export interface EmailProvider {
  sendEmail(params: SendEmailParams): Promise<SendEmailResult>;
}
