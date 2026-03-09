import { Queue } from "bullmq";
import { getRedisConnection } from "../config/redis";

export const EMAIL_QUEUE_NAME = "emailQueue";

export type EmailJobName =
  | "verification-email"
  | "password-reset-email"
  | "welcome-email"
  | "admin-new-user-email";

export interface VerificationEmailJobData {
  email: string;
  userName: string;
  verificationToken: string;
}

export interface PasswordResetEmailJobData {
  email: string;
  userName: string;
  resetToken: string;
  expirationTime?: string;
}

export interface WelcomeEmailJobData {
  email: string;
  userName: string;
}

export interface AdminNewUserEmailJobData {
  email: string;
  userName: string;
  userId: string;
}

export type EmailJobData =
  | VerificationEmailJobData
  | PasswordResetEmailJobData
  | WelcomeEmailJobData
  | AdminNewUserEmailJobData;

let queueInstance: Queue<EmailJobData, void, EmailJobName> | null = null;

export function getEmailQueue() {
  if (queueInstance) {
    return queueInstance;
  }

  queueInstance = new Queue(EMAIL_QUEUE_NAME, {
    connection: getRedisConnection(),
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 2000,
      },
      removeOnComplete: 100,
      removeOnFail: 1000,
    },
  });

  return queueInstance;
}
