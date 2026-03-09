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
const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpSecure, // true for 465, false for other ports
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
});

// Verify connection on startup
export async function verifyMailerConnection() {
  try {
    await transporter.verify();
    console.log("✅ Email service connected successfully");
    return true;
  } catch (error) {
    console.error("❌ Email service connection failed:", error);
    return false;
  }
}

export default transporter;
