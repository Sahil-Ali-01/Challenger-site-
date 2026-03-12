import transporter from "../config/mailer";
import {
  getVerificationEmailTemplate,
  getPasswordResetEmailTemplate,
  getWelcomeEmailTemplate,
  getAdminNewUserRegistrationTemplate,
} from "./emailTemplates";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

function getFrontendUrl() {
  return (
    process.env.CLIENT_URL ||
    process.env.FRONTEND_URL ||
    "http://localhost:5173"
  );
}

/**
 * Send generic email
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const fromAddress = process.env.EMAIL_FROM || "noreply@biharicoder.com";
    const fromName = process.env.EMAIL_FROM_NAME || "BihariCoder";
    const replyToAddress = process.env.REPLY_TO || fromAddress;

    const mailOptions = {
      // Visible sender users see in inbox.
      from: `${fromName} <${fromAddress}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || "",
      replyTo: replyToAddress,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${options.to}. Message ID: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send email to ${options.to}:`, error);
    return false;
  }
}

/**
 * Send email verification email
 */
export async function sendVerificationEmail(
  email: string,
  name: string,
  verificationToken: string
): Promise<boolean> {
  try {
    const clientUrl = getFrontendUrl();
    const verificationLink = `${clientUrl}/auth/verify-email?token=${verificationToken}`;
    const htmlContent = getVerificationEmailTemplate(name, verificationLink);

    return await sendEmail({
      to: email,
      subject: "Verify Your Email - Quiz Challenge Arena",
      html: htmlContent,
      text: `Please verify your email by clicking this link: ${verificationLink}`,
    });
  } catch (error) {
    console.error("❌ Error preparing verification email:", error);
    return false;
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  name: string,
  resetToken: string,
  expirationTime: string = "1 hour"
): Promise<boolean> {
  try {
    const clientUrl = getFrontendUrl();
    const resetLink = `${clientUrl}/auth/reset-password?token=${resetToken}`;
    const htmlContent = getPasswordResetEmailTemplate(name, resetLink, expirationTime);

    return await sendEmail({
      to: email,
      subject: "Password Reset Request - Quiz Challenge Arena",
      html: htmlContent,
      text: `Reset your password by clicking this link: ${resetLink}`,
    });
  } catch (error) {
    console.error("❌ Error preparing password reset email:", error);
    return false;
  }
}

/**
 * Send welcome email after verification (optional)
 */
export async function sendWelcomeEmail(
  email: string,
  name: string
): Promise<boolean> {
  try {
    const htmlContent = getWelcomeEmailTemplate(name);

    return await sendEmail({
      to: email,
      subject: "Welcome to Quiz Challenge Arena! 🎉",
      html: htmlContent,
      text: "Your email has been verified. Welcome to Quiz Challenge Arena!",
    });
  } catch (error) {
    console.error("❌ Error sending welcome email:", error);
    return false;
  }
}

/**
 * Notify admin when a new user registers.
 */
export async function sendAdminNewUserRegistrationEmail(
  name: string,
  email: string,
  userId: string
): Promise<boolean> {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_FROM;

    if (!adminEmail) {
      console.warn("⚠️ ADMIN_EMAIL is not set; skipping admin registration notification email.");
      return false;
    }

    const htmlContent = getAdminNewUserRegistrationTemplate(name, email, userId);

    return await sendEmail({
      to: adminEmail,
      subject: "New User Registration - Quiz Challenge Arena",
      html: htmlContent,
      text: `New user registered. Name: ${name}, Email: ${email}, User ID: ${userId}`,
    });
  } catch (error) {
    console.error("❌ Error sending admin new user registration email:", error);
    return false;
  }
}
