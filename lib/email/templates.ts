type VerificationEmailParams = {
  name: string;
  verificationCode: string;
  verificationUrl: string;
  locale: string;
};

export function getVerificationEmailTemplate({
  name,
  verificationCode,
  verificationUrl,
  locale,
}: VerificationEmailParams) {
  const isPortuguese = locale === 'pt';

  const subject = isPortuguese
    ? 'Código de Verificação - Secret Santa'
    : 'Verification Code - Secret Santa';

  const htmlBody = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #18181b; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .code { font-size: 32px; font-weight: bold; letter-spacing: 8px; text-align: center; padding: 20px; background-color: white; border-radius: 8px; margin: 20px 0; color: #18181b; }
          .button { display: inline-block; padding: 14px 32px; background-color: #16a34a !important; color: #ffffff !important; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 600; font-size: 16px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎅 Secret Santa</h1>
          </div>
          <div class="content">
            <h2>${isPortuguese ? `Olá, ${name}!` : `Hello, ${name}!`}</h2>
            <p>
              ${
                isPortuguese
                  ? 'Obrigado por se registrar no Secret Santa. Clique no botão abaixo para verificar seu e-mail:'
                  : 'Thank you for signing up for Secret Santa. Click the button below to verify your email:'
              }
            </p>
            <p style="text-align: center;">
              <a href="${verificationUrl}" class="button" style="display: inline-block; padding: 14px 32px; background-color: #16a34a; color: #ffffff; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 600; font-size: 16px;">
                ${isPortuguese ? 'Verificar E-mail' : 'Verify Email'}
              </a>
            </p>
            <p style="text-align: center;">
              ${isPortuguese ? 'Ou digite o código abaixo:' : 'Or enter the code below:'}
            </p>
            <div class="code">${verificationCode}</div>
            <p>
              ${
                isPortuguese
                  ? 'Este código expira em 30 minutos.'
                  : 'This code expires in 30 minutes.'
              }
            </p>
            <p>
              ${
                isPortuguese
                  ? 'Se você não solicitou este código, pode ignorar este e-mail.'
                  : "If you didn't request this code, you can safely ignore this email."
              }
            </p>
          </div>
          <div class="footer">
            <p>${isPortuguese ? '© 2025 Secret Santa. Todos os direitos reservados.' : '© 2025 Secret Santa. All rights reserved.'}</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const textBody = `
${isPortuguese ? `Olá, ${name}!` : `Hello, ${name}!`}

${isPortuguese ? 'Obrigado por se registrar no Secret Santa.' : 'Thank you for signing up for Secret Santa.'}

${isPortuguese ? 'Clique no link abaixo para verificar seu e-mail:' : 'Click the link below to verify your email:'}
${verificationUrl}

${isPortuguese ? 'Ou digite o código de verificação:' : 'Or enter the verification code:'} ${verificationCode}

${isPortuguese ? 'Este código expira em 30 minutos.' : 'This code expires in 30 minutes.'}

${isPortuguese ? 'Se você não solicitou este código, pode ignorar este e-mail.' : "If you didn't request this code, you can safely ignore this email."}
  `;

  return { subject, htmlBody, textBody };
}

type AssignmentEmailParams = {
  participantName: string;
  recipientName: string;
  groupName: string;
  groupDate: string;
  groupPlace: string;
  groupBudget: string;
  locale: string;
};

export function getAssignmentEmailTemplate({
  participantName,
  recipientName,
  groupName,
  groupDate,
  groupPlace,
  groupBudget,
  locale,
}: AssignmentEmailParams) {
  const isPortuguese = locale === 'pt';

  const subject = isPortuguese
    ? `🎅 Seu Amigo Secreto - ${groupName}`
    : `🎅 Your Secret Santa - ${groupName}`;

  const htmlBody = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #18181b; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .recipient { font-size: 28px; font-weight: bold; text-align: center; padding: 30px; background-color: white; border-radius: 8px; margin: 20px 0; color: #18181b; }
          .info { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .info-item { margin: 10px 0; }
          .label { font-weight: bold; color: #666; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎅 Secret Santa</h1>
          </div>
          <div class="content">
            <h2>${isPortuguese ? `Olá, ${participantName}!` : `Hello, ${participantName}!`}</h2>
            <p>
              ${
                isPortuguese
                  ? `O sorteio do ${groupName} foi realizado!`
                  : `The ${groupName} lottery has been drawn!`
              }
            </p>
            <div class="recipient">
              ${isPortuguese ? 'Seu Amigo Secreto é:' : 'Your Secret Santa is:'}<br/>
              🎁 ${recipientName}
            </div>
            <div class="info">
              <div class="info-item">
                <span class="label">${isPortuguese ? '📅 Data:' : '📅 Date:'}</span> ${groupDate}
              </div>
              <div class="info-item">
                <span class="label">${isPortuguese ? '📍 Local:' : '📍 Location:'}</span> ${groupPlace}
              </div>
              <div class="info-item">
                <span class="label">${isPortuguese ? '💰 Orçamento:' : '💰 Budget:'}</span> ${groupBudget}
              </div>
            </div>
            <p>
              ${
                isPortuguese
                  ? '🤫 Lembre-se: mantenha o segredo!'
                  : '🤫 Remember: keep it a secret!'
              }
            </p>
          </div>
          <div class="footer">
            <p>${isPortuguese ? '© 2025 Secret Santa. Todos os direitos reservados.' : '© 2025 Secret Santa. All rights reserved.'}</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const textBody = `
${isPortuguese ? `Olá, ${participantName}!` : `Hello, ${participantName}!`}

${isPortuguese ? `O sorteio do ${groupName} foi realizado!` : `The ${groupName} lottery has been drawn!`}

${isPortuguese ? 'Seu Amigo Secreto é:' : 'Your Secret Santa is:'} ${recipientName}

${isPortuguese ? '📅 Data:' : '📅 Date:'} ${groupDate}
${isPortuguese ? '📍 Local:' : '📍 Location:'} ${groupPlace}
${isPortuguese ? '💰 Orçamento:' : '💰 Budget:'} ${groupBudget}

${isPortuguese ? '🤫 Lembre-se: mantenha o segredo!' : '🤫 Remember: keep it a secret!'}
  `;

  return { subject, htmlBody, textBody };
}
