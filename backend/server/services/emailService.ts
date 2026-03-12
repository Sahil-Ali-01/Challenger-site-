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

function shouldPreferResendApi() {
  const mode = String(process.env.EMAIL_DELIVERY_MODE || "").toLowerCase();
  const provider = String(process.env.EMAIL_PROVIDER || "").toLowerCase();
  const smtpHost = String(process.env.SMTP_HOST || "").toLowerCase();

  return (
    mode === "api-first" ||
    provider === "resend_api" ||
    smtpHost === "smtp.resend.com"
  );
}

async function sendWithResendApi(options: EmailOptions, from: string, replyTo: string) {
  const resendApiKey = process.env.RESEND_API_KEY || process.env.SMTP_PASS;

  if (!resendApiKey) {
    return false;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [options.to],
        subject: options.subject,
        html: options.html,
        text: options.text || "",
        reply_to: replyTo,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`❌ Resend API send failed for ${options.to}:`, errorBody);
      return false;
    }

    const payload = (await response.json()) as { id?: string };
    console.log(`✅ Email sent via Resend API to ${options.to}. ID: ${payload.id || "unknown"}`);
    return true;
  } catch (error) {
    console.error(`❌ Resend API request failed for ${options.to}:`, error);
    return false;
  }
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
  const fromAddress = process.env.EMAIL_FROM || "noreply@biharicoder.com";
  const fromName = process.env.EMAIL_FROM_NAME || "BihariCoder";
  const replyToAddress = process.env.REPLY_TO || fromAddress;
  const from = `${fromName} <${fromAddress}>`;

  if (shouldPreferResendApi()) {
    const sentByApi = await sendWithResendApi(options, from, replyToAddress);
    if (sentByApi) {
      return true;
    }
    console.warn(`⚠️ Resend API-first delivery failed for ${options.to}; trying SMTP fallback`);
  }

  const mailOptions = {
    // Visible sender users see in inbox.
    from,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text || "",
    replyTo: replyToAddress,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent via SMTP to ${options.to}. Message ID: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`❌ SMTP send failed for ${options.to}:`, error);

    if (shouldPreferResendApi()) {
      return false;
    }

    const sentByApi = await sendWithResendApi(options, from, replyToAddress);
    if (sentByApi) {
      return true;
    }

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
