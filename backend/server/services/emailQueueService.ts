import {
  getEmailQueue,
  VerificationEmailJobData,
  PasswordResetEmailJobData,
  WelcomeEmailJobData,
  AdminNewUserEmailJobData,
} from "../queues/emailQueue";

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
