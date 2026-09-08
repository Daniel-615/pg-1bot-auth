const { FRONTEND_URL } = require('../config/config');


async function sendWithResend({ to, subject, text, html }) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM,
      to: [to],
      subject,
      text,
      html,
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Resend rechazó el correo (${response.status}): ${details}`);
  }

  const result = await response.json();
  if (!result.id) {
    throw new Error('Resend aceptó la petición, pero no devolvió un ID de correo.');
  }

  console.info(`Correo aceptado por Resend: ${result.id}`);
  return result;
}

async function enviarCorreoRecuperacion(email, token) {
  const resetUrl = `${(FRONTEND_URL).replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(token)}`;
  const message = {
    from:  process.env.RESEND_FROM,
    to: email,
    subject: 'Restablece tu contraseña de 1bot',
    text: `Solicitaste restablecer tu contraseña. Abre este enlace antes de 15 minutos: ${resetUrl}`,
    html: `<!DOCTYPE html>
<html lang="es">
  <body style="margin:0;padding:0;background-color:#f4f7fb;color:#172033;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f7fb;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border:1px solid #e3e9f2;border-radius:16px;overflow:hidden;">
            <tr>
              <td style="background-color:#182848;padding:28px 36px;">
                <div style="color:#ffffff;font-size:24px;font-weight:bold;letter-spacing:-0.5px;">1bot</div>
              </td>
            </tr>
            <tr>
              <td style="padding:40px 36px 36px;">
                <p style="margin:0 0 10px;color:#667085;font-size:13px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;">Seguridad de tu cuenta</p>
                <h1 style="margin:0 0 18px;color:#172033;font-size:28px;line-height:1.25;">Restablece tu contraseña</h1>
                <p style="margin:0 0 28px;color:#526078;font-size:16px;line-height:1.6;">Solicitaste restablecer tu contraseña de 1bot. Haz clic en el botón para continuar de forma segura.</p>
                <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
                  <tr>
                    <td style="border-radius:8px;background-color:#3867f2;">
                      <a href="${resetUrl}" style="display:inline-block;padding:14px 24px;color:#ffffff;font-size:15px;font-weight:bold;text-decoration:none;">Restablecer contraseña</a>
                    </td>
                  </tr>
                </table>
                <p style="margin:0 0 8px;color:#667085;font-size:14px;line-height:1.5;">Este enlace expira en <strong style="color:#172033;">15 minutos</strong>.</p>
                <p style="margin:24px 0 0;padding-top:20px;border-top:1px solid #edf0f5;color:#98a2b3;font-size:12px;line-height:1.5;">Si no solicitaste este cambio, puedes ignorar este correo.</p>
              </td>
            </tr>
          </table>
          <p style="margin:20px 0 0;color:#98a2b3;font-size:12px;">Este es un mensaje automático de 1bot.</p>
        </td>
      </tr>
    </table>
  </body>
</html>`,
  };

  if (process.env.RESEND_API_KEY) {
    if (!message.from) throw new Error('Falta RESEND_FROM para Resend.');
    await sendWithResend(message);
    return;
  }

}

async function enviarCodigoVerificacion(email, code) {
  const message = {
    from:  process.env.RESEND_FROM,
    to: email,
    subject: 'Confirma tu cuenta de 1bot',
    text: `Tu código de confirmación de 1bot es: ${code}. Expira en 10 minutos.`,
    html: `<!DOCTYPE html>
<html lang="es">
  <body style="margin:0;padding:0;background-color:#f4f7fb;color:#172033;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f7fb;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border:1px solid #e3e9f2;border-radius:16px;overflow:hidden;">
            <tr>
              <td style="background-color:#182848;padding:28px 36px;">
                <div style="color:#ffffff;font-size:24px;font-weight:bold;letter-spacing:-0.5px;">1bot</div>
              </td>
            </tr>
            <tr>
              <td style="padding:40px 36px 36px;">
                <p style="margin:0 0 10px;color:#667085;font-size:13px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;">Verificación de cuenta</p>
                <h1 style="margin:0 0 18px;color:#172033;font-size:28px;line-height:1.25;">Confirma tu cuenta</h1>
                <p style="margin:0 0 24px;color:#526078;font-size:16px;line-height:1.6;">Tu código de confirmación de 1bot es:</p>
                <div style="margin:0 0 24px;padding:20px 16px;background-color:#f0f4ff;border:1px solid #d9e2ff;border-radius:10px;text-align:center;">
                  <div style="color:#3867f2;font-size:32px;font-weight:bold;letter-spacing:8px;line-height:1.2;">${code}</div>
                </div>
                <p style="margin:0;color:#667085;font-size:14px;line-height:1.5;">Este código expira en <strong style="color:#172033;">10 minutos</strong>.</p>
                <p style="margin:24px 0 0;padding-top:20px;border-top:1px solid #edf0f5;color:#98a2b3;font-size:12px;line-height:1.5;">Si no intentaste crear una cuenta, puedes ignorar este correo.</p>
              </td>
            </tr>
          </table>
          <p style="margin:20px 0 0;color:#98a2b3;font-size:12px;">Este es un mensaje automático de 1bot.</p>
        </td>
      </tr>
    </table>
  </body>
</html>`,
  };

  if (process.env.RESEND_API_KEY) {
    if (!message.from) throw new Error('Falta MAIL_FROM o RESEND_FROM para Resend.');
    await sendWithResend(message);
    return;
  }

}

module.exports = { enviarCorreoRecuperacion, enviarCodigoVerificacion };
