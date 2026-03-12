import nodemailer from "nodemailer";

const smtpHost = process.env.SMTP_HOST || "smtp.resend.com";
const smtpPort = parseInt(process.env.SMTP_PORT || "587");
const smtpSecure = process.env.SMTP_SECURE === "true";
const smtpUser = process.env.SMTP_USER || "resend";
const smtpPass = process.env.SMTP_PASS || process.env.RESEND_API_KEY || "";

// Debug: Log SMTP configuration (masked for security)
const smtpConfig = {
  host: smtpHost,
  port: smtpPort,
  secure: smtpSecure,
  auth: {
    user: smtpUser ? smtpUser.substring(0, 5) + "***" : "NOT SET",
    pass: smtpPass ? "SET (hidden)" : "NOT SET",
  },
};
console.log("📧 SMTP Configuration:", smtpConfig);

if (!smtpPass) {
  console.warn("⚠️ SMTP_PASS/RESEND_API_KEY is not set; email delivery will fail until configured.");
}

// Initialize Nodemailer transporter
const primaryTransporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpSecure, // true for 465, false for other ports
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
  // Prevent jobs from hanging indefinitely on provider/network stalls.
  connectionTimeout: 15000,
  greetingTimeout: 15000,
  socketTimeout: 20000,
});

const shouldUseResendFallback =
  smtpHost === "smtp.resend.com" && smtpPort !== 465;

const fallbackTransporter = shouldUseResendFallback
  ? nodemailer.createTransport({
      host: smtpHost,
      port: 465,
      secure: true,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 20000,
    })
  : null;

const transporter = {
  async sendMail(mailOptions: Parameters<typeof primaryTransporter.sendMail>[0]) {
    try {
      return await primaryTransporter.sendMail(mailOptions);
    } catch (error: any) {
      const isTimeout = String(error?.code || "").toUpperCase() === "ETIMEDOUT";

      if (!fallbackTransporter || !isTimeout) {
        throw error;
      }

      console.warn("⚠️ Primary SMTP connection timed out; retrying with Resend SMTPS fallback (465)");
      return fallbackTransporter.sendMail(mailOptions);
    }
  },

  async verify() {
    try {
      await primaryTransporter.verify();
      return true;
    } catch (error: any) {
      const isTimeout = String(error?.code || "").toUpperCase() === "ETIMEDOUT";

      if (!fallbackTransporter || !isTimeout) {
        throw error;
      }

      console.warn("⚠️ Primary SMTP verify timed out; trying Resend SMTPS fallback (465)");
      await fallbackTransporter.verify();
      return true;
    }
  },
};

// Verify connection on startup
export async function verifyMailerConnection() {
  try {
    await transporter.verify();
    console.log("✅ Email service connected successfully");
    return true;
  } catch (error) {
    if (process.env.RESEND_API_KEY || process.env.SMTP_PASS) {
      console.warn("⚠️ SMTP verification failed, but API fallback is configured; continuing with fallback mode");
      return true;
    }
    console.error("❌ Email service connection failed:", error);
    return false;
  }
}

export default transporter;
