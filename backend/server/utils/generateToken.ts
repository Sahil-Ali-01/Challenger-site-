import jwt from "jsonwebtoken";

interface TokenPayload {
  email: string;
  userId: string;
  type: "email_verification" | "password_reset" | "email_change" | "login";
}

function getJwtSecret() {
  const jwtSecret = process.env.JWT_SECRET || process.env.SESSION_SECRET;

  if (!jwtSecret) {
    throw new Error("JWT_SECRET or SESSION_SECRET environment variable must be set");
  }

  if (!process.env.JWT_SECRET && process.env.SESSION_SECRET) {
    console.warn("⚠️ JWT_SECRET not set; using SESSION_SECRET for token signing");
  }

  return jwtSecret;
}

/**
 * Generate JWT token for email verification, password reset, or login
 */
export function generateToken(
  email: string,
  userId: string,
  type: "email_verification" | "password_reset" | "email_change" | "login" = "email_verification",
  expiresIn: string = "24h"
): string {
  const jwtSecret = getJwtSecret();

  const payload: TokenPayload = {
    email,
    userId,
    type,
  };

  const token = jwt.sign(payload, jwtSecret as string, {
    expiresIn,
    issuer: "quiz-challenge-arena",
  } as any);

  return token;
}

/**
 * Verify and decode JWT token
 */
export function verifyToken(token: string): TokenPayload | null {
  try {
    const jwtSecret = getJwtSecret();

    const decoded = jwt.verify(token, jwtSecret as string) as TokenPayload;
    return decoded;
  } catch (error) {
    console.error("🔴 Token verification failed:", error);
    return null;
  }
}

/**
 * Generate secure random token (alternative method without JWT)
 */
export function generateRandomToken(length: number = 32): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < length; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}
