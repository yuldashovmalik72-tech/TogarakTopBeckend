import { OAuth2Client } from "google-auth-library";
import env from "../config/env.js";

const client = new OAuth2Client(env.google.clientId);

// Frontend'dan kelgan Google ID tokenni tekshiradi va
// foydalanuvchi ma'lumotlarini qaytaradi.
async function verifyGoogleToken(idToken) {
  const ticket = await client.verifyIdToken({
    idToken,
    audience: env.google.clientId,
  });
  const payload = ticket.getPayload();

  return {
    googleId: payload.sub,
    email: payload.email,
    firstName: payload.given_name || "",
    lastName: payload.family_name || "",
    avatarUrl: payload.picture || null,
  };
}

export { verifyGoogleToken };
