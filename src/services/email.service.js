import env from "../config/env.js";

/**
 * Email yuborish. SMTP sozlanmagan bo'lsa development'da konsolga chiqaradi.
 * Production'da SMTP_HOST/USER/PASS to'ldirilishi kerak.
 */
async function sendEmail({ to, subject, html, text }) {
  const hasSmtp = Boolean(env.smtp.host && env.smtp.user);

  if (!hasSmtp) {
    // eslint-disable-next-line no-console
    console.log("[EMAIL - SMTP yo'q, konsolga chiqarildi]", {
      to,
      subject,
      text: text || html?.slice(0, 200),
    });
    return { ok: true, mode: "console" };
  }

  try {
    // Dinamik import — nodemailer o'rnatilmagan bo'lsa ham server ishlaydi
    const nodemailer = await import("nodemailer");
    const transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.port === 465,
      auth: { user: env.smtp.user, pass: env.smtp.pass },
    });

    await transporter.sendMail({
      from: env.smtp.from,
      to,
      subject,
      html,
      text,
    });
    return { ok: true, mode: "smtp" };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[EMAIL xato]", err.message);
    return { ok: false, error: err.message };
  }
}

function verificationEmailHtml(firstName, verifyUrl) {
  return `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
      <h2>Salom, ${firstName}!</h2>
      <p>Togarak platformasida emailingizni tasdiqlash uchun quyidagi tugmani bosing:</p>
      <p><a href="${verifyUrl}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px">Emailni tasdiqlash</a></p>
      <p style="color:#666;font-size:13px">Yoki havolani brauzerga nusxalang:<br/>${verifyUrl}</p>
      <p style="color:#999;font-size:12px">Havola 24 soat amal qiladi.</p>
    </div>
  `;
}

function moderationEmailHtml(firstName, circleName, approved, reason) {
  const status = approved ? "tasdiqlandi ✅" : "rad etildi ❌";
  return `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
      <h2>Salom, ${firstName}!</h2>
      <p><strong>${circleName}</strong> togaragingiz moderatsiyadan o'tdi: <strong>${status}</strong></p>
      ${reason ? `<p>Izoh: ${reason}</p>` : ""}
      <p><a href="${env.clientUrl}">Platformaga o'tish</a></p>
    </div>
  `;
}

export { sendEmail, verificationEmailHtml, moderationEmailHtml };
