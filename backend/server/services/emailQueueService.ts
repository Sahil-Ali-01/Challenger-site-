import {
  getEmailQueue,
  VerificationEmailJobData,
  PasswordResetEmailJobData,
  WelcomeEmailJobData,
  AdminNewUserEmailJobData,
} from "../queues/emailQueue";
import {
  sendAdminNewUserRegistrationEmail,
  sendPasswordResetEmail,
  sendVerificationEmail,
  sendWelcomeEmail,
} from "./emailService";

async function addEmailJob<T>(name: string, data: T) {
  try {
    const emailQueue = getEmailQueue();
    await emailQueue.add(name as any, data as any);
    return true;
  } catch (error) {
    console.error(`❌ Failed to enqueue ${name}:`, error);
    return false;
  }
}

export async function enqueueVerificationEmailJob(data: VerificationEmailJobData) {
  return addEmailJob("verification-email", data);
}

export async function enqueuePasswordResetEmailJob(data: PasswordResetEmailJobData) {
  return addEmailJob("password-reset-email", data);
}

export async function enqueueWelcomeEmailJob(data: WelcomeEmailJobData) {
  return addEmailJob("welcome-email", data);
}

export async function enqueueAdminNewUserEmailJob(data: AdminNewUserEmailJobData) {
  return addEmailJob("admin-new-user-email", data);
}

export async function deliverVerificationEmail(data: VerificationEmailJobData) {
  const sentDirectly = await sendVerificationEmail(
    data.email,
    data.userName,
    data.verificationToken
  );

  if (sentDirectly) {
    return true;
  }

  console.warn(`⚠️ Direct verification email failed, falling back to queue for ${data.email}`);
  return enqueueVerificationEmailJob(data);
}

export async function deliverPasswordResetEmail(data: PasswordResetEmailJobData) {
  const sentDirectly = await sendPasswordResetEmail(
    data.email,
    data.userName,
    data.resetToken,
    data.expirationTime || "1 hour"
  );

  if (sentDirectly) {
    return true;
  }

  console.warn(`⚠️ Direct password reset email failed, falling back to queue for ${data.email}`);
  return enqueuePasswordResetEmailJob(data);
}

export async function deliverWelcomeEmail(data: WelcomeEmailJobData) {
  const queued = await enqueueWelcomeEmailJob(data);

  if (queued) {
    return true;
  }

  console.warn(`⚠️ Falling back to direct welcome email send for ${data.email}`);
  return sendWelcomeEmail(data.email, data.userName);
}

export async function deliverAdminNewUserEmail(data: AdminNewUserEmailJobData) {
  const queued = await enqueueAdminNewUserEmailJob(data);

  if (queued) {
    return true;
  }

  console.warn(`⚠️ Falling back to direct admin registration email send for ${data.email}`);
  return sendAdminNewUserRegistrationEmail(data.userName, data.email, data.userId);
}
