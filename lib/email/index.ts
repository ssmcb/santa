import { ResendProvider } from '@/lib/email/providers/resend';
import { SESProvider } from '@/lib/email/providers/ses';

import type { EmailProvider, SendEmailParams } from '@/lib/email/types';

let emailProvider: EmailProvider | null = null;

function getEmailProvider(): EmailProvider {
  if (emailProvider) {
    return emailProvider;
  }

  const provider = process.env.EMAIL_PROVIDER || 'ses';

  switch (provider.toLowerCase()) {
    case 'resend':
      emailProvider = new ResendProvider();
      break;
    case 'ses':
      emailProvider = new SESProvider();
      break;
    default:
      throw new Error(
        `Invalid EMAIL_PROVIDER: ${provider}. Must be either "ses" or "resend"`
      );
  }

  return emailProvider;
}

export async function sendEmail(params: SendEmailParams) {
  const provider = getEmailProvider();
  return provider.sendEmail(params);
}
