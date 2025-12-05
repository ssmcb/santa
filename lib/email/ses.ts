import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

const sesClient = new SESClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

type SendEmailParams = {
  to: string;
  subject: string;
  htmlBody: string;
  textBody: string;
};

export async function sendEmail({ to, subject, htmlBody, textBody }: SendEmailParams) {
  const senderEmail = process.env.AWS_SES_SENDER_EMAIL;

  if (!senderEmail) {
    throw new Error('AWS_SES_SENDER_EMAIL is not configured');
  }

  const command = new SendEmailCommand({
    Source: senderEmail,
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
    const response = await sesClient.send(command);
    return { success: true, messageId: response.MessageId };
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}
