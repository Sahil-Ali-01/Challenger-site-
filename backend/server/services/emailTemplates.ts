/**
 * Email verification HTML template
 */
export function getVerificationEmailTemplate(
  name: string,
  verificationLink: string
): string {
  const currentYear = new Date().getFullYear();

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email - Quiz Challenge Arena</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
                line-height: 1.6;
                color: #333;
                background-color: #f5f5f5;
                margin: 0;
                padding: 0;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }
            .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 40px 20px;
                text-align: center;
            }
            .header h1 {
                margin: 0;
                font-size: 28px;
                font-weight: 700;
            }
            .content {
                padding: 40px 30px;
            }
            .greeting {
                font-size: 16px;
                color: #333;
                margin-bottom: 20px;
            }
            .message {
                font-size: 14px;
                color: #666;
                margin-bottom: 30px;
                line-height: 1.8;
            }
            .button-container {
                text-align: center;
                margin: 40px 0;
            }
            .verify-button {
                display: inline-block;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 14px 40px;
                text-decoration: none;
                border-radius: 6px;
                font-weight: 600;
                font-size: 16px;
                transition: opacity 0.2s;
            }
            .verify-button:hover {
                opacity: 0.9;
            }
            .link-container {
                background-color: #f9f9f9;
                padding: 20px;
                border-radius: 6px;
                margin-top: 20px;
                word-break: break-all;
            }
            .link-label {
                font-size: 12px;
                color: #999;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin-bottom: 8px;
            }
            .verification-link {
                font-size: 13px;
                color: #667eea;
                text-decoration: none;
            }
            .expiry-notice {
                background-color: #fff3cd;
                border-left: 4px solid #ffc107;
                padding: 12px 15px;
                margin: 20px 0;
                border-radius: 4px;
                font-size: 13px;
                color: #856404;
            }
            .footer {
                background-color: #f5f5f5;
                padding: 30px;
                text-align: center;
                border-top: 1px solid #eee;
                font-size: 12px;
                color: #999;
            }
            .footer-links {
                margin: 15px 0 0 0;
            }
            .footer-links a {
                color: #667eea;
                text-decoration: none;
                margin: 0 10px;
            }
            .divider {
                height: 1px;
                background-color: #eee;
                margin: 20px 0;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <!-- Header -->
            <div class="header">
                <h1>⚔️ Quiz Challenge Arena</h1>
            </div>

            <!-- Content -->
            <div class="content">
                <div class="greeting">
                    <p>Hi ${name},</p>
                </div>

                <div class="message">
                    <p>Welcome to Quiz Challenge Arena! We're excited to have you join our community of developers.</p>
                    <p>To complete your registration and access all features, please verify your email address by clicking the button below:</p>
                </div>

                <!-- Verify Button -->
                <div class="button-container">
                    <a href="${verificationLink}" class="verify-button">Verify Email Address</a>
                </div>

                <!-- Link as text fallback -->
                <div class="link-container">
                    <div class="link-label">Or copy and paste this link:</div>
                    <a href="${verificationLink}" class="verification-link">${verificationLink}</a>
                </div>

                <!-- Expiry Notice -->
                <div class="expiry-notice">
                    <strong>⏰ Important:</strong> This verification link will expire in 24 hours. If it expires, you can request a new one.
                </div>

                <div class="divider"></div>

                <div class="message" style="font-size: 13px; color: #999;">
                    <p>If you didn't create an account, please ignore this email or contact our support team.</p>
                    <p><strong>Need help?</strong> Reply to this email or visit our help center.</p>
                </div>
            </div>

            <!-- Footer -->
            <div class="footer">
                <p>© ${currentYear} Quiz Challenge Arena. All rights reserved.</p>
                <div class="footer-links">
                    <a href="https://yourdomain.com">Website</a>
                    <a href="https://yourdomain.com/help">Help</a>
                    <a href="https://yourdomain.com/privacy">Privacy</a>
                </div>
            </div>
        </div>
    </body>
    </html>
  `;
}

/**
 * Password reset email template
 */
export function getPasswordResetEmailTemplate(
  name: string,
    resetLink: string,
    expirationTime: string = "1 hour"
): string {
  const currentYear = new Date().getFullYear();

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password - Quiz Challenge Arena</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
                line-height: 1.6;
                color: #333;
                background-color: #f5f5f5;
                margin: 0;
                padding: 0;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }
            .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 40px 20px;
                text-align: center;
            }
            .header h1 {
                margin: 0;
                font-size: 28px;
                font-weight: 700;
            }
            .content {
                padding: 40px 30px;
            }
            .button-container {
                text-align: center;
                margin: 40px 0;
            }
            .reset-button {
                display: inline-block;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 14px 40px;
                text-decoration: none;
                border-radius: 6px;
                font-weight: 600;
                font-size: 16px;
                transition: opacity 0.2s;
            }
            .reset-button:hover {
                opacity: 0.9;
            }
            .warning {
                background-color: #fee;
                border-left: 4px solid #f66;
                padding: 12px 15px;
                margin: 20px 0;
                border-radius: 4px;
                font-size: 13px;
                color: #c33;
            }
            .footer {
                background-color: #f5f5f5;
                padding: 30px;
                text-align: center;
                border-top: 1px solid #eee;
                font-size: 12px;
                color: #999;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Password Reset Request</h1>
            </div>

            <div class="content">
                <p>Hi ${name},</p>
                <p>We received a request to reset the password for your account. Click the button below to create a new password:</p>

                <div class="button-container">
                    <a href="${resetLink}" class="reset-button">Reset Password</a>
                </div>

                <div class="warning">
                    <strong>Security Note:</strong> This link will expire in ${expirationTime}. If you didn't request a password reset, please ignore this email and your password will remain unchanged.
                </div>
            </div>

            <div class="footer">
                <p>© ${currentYear} Quiz Challenge Arena. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
  `;
}

/**
 * Welcome email template
 */
export function getWelcomeEmailTemplate(name: string): string {
  const currentYear = new Date().getFullYear();

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Quiz Challenge Arena</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
                line-height: 1.6;
                color: #333;
                background-color: #f5f5f5;
                margin: 0;
                padding: 0;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }
            .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 40px 20px;
                text-align: center;
            }
            .content {
                padding: 40px 30px;
            }
            .footer {
                background-color: #f5f5f5;
                padding: 30px;
                text-align: center;
                border-top: 1px solid #eee;
                font-size: 12px;
                color: #999;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Welcome to Quiz Challenge Arena</h1>
            </div>

            <div class="content">
                <p>Hi ${name},</p>
                <p>Your email has been verified successfully. You can now start quizzes, join battles, and climb the leaderboard.</p>
                <p>Let the challenge begin.</p>
            </div>

            <div class="footer">
                <p>© ${currentYear} Quiz Challenge Arena. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
  `;
}

/**
 * Admin notification email template for new user registration
 */
export function getAdminNewUserRegistrationTemplate(
  name: string,
  email: string,
  userId: string
): string {
  const currentYear = new Date().getFullYear();
  const registeredAt = new Date().toISOString();

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New User Registration - Quiz Challenge Arena</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
                line-height: 1.6;
                color: #333;
                background-color: #f5f5f5;
                margin: 0;
                padding: 0;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }
            .header {
                background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
                color: white;
                padding: 24px 20px;
                text-align: center;
            }
            .content {
                padding: 30px;
            }
            .details {
                background-color: #f9fafb;
                border: 1px solid #e5e7eb;
                border-radius: 6px;
                padding: 16px;
                margin-top: 16px;
            }
            .details p {
                margin: 8px 0;
                font-size: 14px;
            }
            .label {
                color: #6b7280;
                font-weight: 600;
                margin-right: 6px;
            }
            .footer {
                background-color: #f5f5f5;
                padding: 20px 30px;
                text-align: center;
                border-top: 1px solid #eee;
                font-size: 12px;
                color: #999;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2>New User Registered</h2>
            </div>

            <div class="content">
                <p>A new user has registered on Quiz Challenge Arena.</p>

                <div class="details">
                    <p><span class="label">Name:</span> ${name}</p>
                    <p><span class="label">Email:</span> ${email}</p>
                    <p><span class="label">User ID:</span> ${userId}</p>
                    <p><span class="label">Registered At:</span> ${registeredAt}</p>
                </div>
            </div>

            <div class="footer">
                <p>© ${currentYear} Quiz Challenge Arena. Admin Notification.</p>
            </div>
        </div>
    </body>
    </html>
  `;
}
