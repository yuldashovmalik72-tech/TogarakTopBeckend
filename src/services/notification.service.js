import prisma from "../config/db.js";
import { sendEmail, moderationEmailHtml } from "./email.service.js";

/**
 * In-app bildirishnoma yaratish + (ixtiyoriy) email
 */
async function notify({ userId, type, title, message, link = null, meta = null, email = null }) {
  const notification = await prisma.notification.create({
    data: { userId, type, title, message, link, meta: meta || undefined },
  });

  if (email?.to) {
    await sendEmail({
      to: email.to,
      subject: email.subject || title,
      html: email.html,
      text: email.text || message,
    });
  }

  return notification;
}

async function notifyCircleModeration(circle, status, reason = null) {
  const owner = await prisma.user.findUnique({ where: { id: circle.ownerId } });
  if (!owner) return null;

  const approved = status === "ACTIVE";
  const title = approved ? "Togarak tasdiqlandi" : "Togarak rad etildi";
  const message = approved
    ? `"${circle.name}" togaragingiz qidiruvda ko'rinadi.`
    : `"${circle.name}" togaragingiz rad etildi.${reason ? ` Sabab: ${reason}` : ""}`;

  return notify({
    userId: owner.id,
    type: approved ? "CIRCLE_APPROVED" : "CIRCLE_REJECTED",
    title,
    message,
    link: `/circles/${circle.id}`,
    meta: { circleId: circle.id, status, reason },
    email: {
      to: owner.email,
      subject: title,
      html: moderationEmailHtml(owner.firstName, circle.name, approved, reason),
      text: message,
    },
  });
}

async function notifyVerified(userId, kind, itemTitle, itemId) {
  const title = kind === "certificate" ? "Sertifikat tasdiqlandi" : "Natija tasdiqlandi";
  const message = `"${itemTitle}" ${kind === "certificate" ? "sertifikati" : "natijasi"} admin tomonidan tasdiqlandi.`;
  return notify({
    userId,
    type: kind === "certificate" ? "CERTIFICATE_VERIFIED" : "RESULT_VERIFIED",
    title,
    message,
    link: kind === "certificate" ? `/certificates/${itemId}` : `/results/${itemId}`,
    meta: { kind, itemId },
  });
}

export { notify, notifyCircleModeration, notifyVerified };
