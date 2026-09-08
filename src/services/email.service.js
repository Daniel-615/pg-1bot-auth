const nodemailer = require('nodemailer');
const { FRONTEND_URL } = require('../config/config');

let transporter;

async function sendWithResend({ to, subject, text, html }) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.MAIL_FROM || process.env.RESEND_FROM,
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
}

function getTransporter() {
  if (transporter) return transporter;

  const required = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASSWORD'];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(`Faltan variables SMTP: ${missing.join(', ')}`);
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  return transporter;
}

async function enviarCorreoRecuperacion(email, token) {
  const resetUrl = `${(FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(token)}`;
  const message = {
    from: process.env.MAIL_FROM || process.env.RESEND_FROM || process.env.SMTP_USER,
    to: email,
    subject: 'Restablece tu contraseña de 1bot',
    text: `Solicitaste restablecer tu contraseña. Abre este enlace antes de 15 minutos: ${resetUrl}`,
    html: `<p>Solicitaste restablecer tu contraseña de 1bot.</p><p><a href="${resetUrl}">Restablecer contraseña</a></p><p>Este enlace expira en 15 minutos.</p>`,
  };

  if (process.env.RESEND_API_KEY) {
    if (!message.from) throw new Error('Falta MAIL_FROM o RESEND_FROM para Resend.');
    await sendWithResend(message);
    return;
  }

  await getTransporter().sendMail(message);
}

async function enviarCodigoVerificacion(email, code) {
  const message = {
    from: process.env.MAIL_FROM || process.env.RESEND_FROM || process.env.SMTP_USER,
    to: email,
    subject: 'Confirma tu cuenta de 1bot',
    text: `Tu código de confirmación de 1bot es: ${code}. Expira en 10 minutos.`,
    html: `<p>Tu código de confirmación de 1bot es:</p><p style="font-size:28px;font-weight:bold;letter-spacing:8px">${code}</p><p>Este código expira en 10 minutos.</p>`,
  };

  if (process.env.RESEND_API_KEY) {
    if (!message.from) throw new Error('Falta MAIL_FROM o RESEND_FROM para Resend.');
    await sendWithResend(message);
    return;
  }

  await getTransporter().sendMail(message);
}

module.exports = { enviarCorreoRecuperacion, enviarCodigoVerificacion };
