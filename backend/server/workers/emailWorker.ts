import "dotenv/config";
import { Worker, QueueEvents } from "bullmq";
import { getRedisConnection } from "../config/redis";
import {
  EMAIL_QUEUE_NAME,
  EmailJobData,
  EmailJobName,
  VerificationEmailJobData,
  PasswordResetEmailJobData,
  WelcomeEmailJobData,
  AdminNewUserEmailJobData,
} from "../queues/emailQueue";
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendAdminNewUserRegistrationEmail,
} from "../services/emailService";

const connection = getRedisConnection();

const emailWorker = new Worker<EmailJobData, void, EmailJobName>(
  EMAIL_QUEUE_NAME,
  async (job) => {
    switch (job.name) {
      case "verification-email": {
        const data = job.data as VerificationEmailJobData;
        const sent = await sendVerificationEmail(data.email, data.userName, data.verificationToken);
        if (!sent) {
          throw new Error("Failed to send verification email");
        }
        break;
      }

      case "password-reset-email": {
        const data = job.data as PasswordResetEmailJobData;
        const sent = await sendPasswordResetEmail(
          data.email,
          data.userName,
          data.resetToken,
          data.expirationTime || "1 hour"
        );
        if (!sent) {
          throw new Error("Failed to send password reset email");
        }
        break;
      }

      case "welcome-email": {
        const data = job.data as WelcomeEmailJobData;
        const sent = await sendWelcomeEmail(data.email, data.userName);
        if (!sent) {
          throw new Error("Failed to send welcome email");
        }
        break;
      }

      case "admin-new-user-email": {
        const data = job.data as AdminNewUserEmailJobData;
        const sent = await sendAdminNewUserRegistrationEmail(data.userName, data.email, data.userId);
        if (!sent) {
          throw new Error("Failed to send admin new user email");
        }
        break;
      }

      default:
        throw new Error(`Unknown job name: ${job.name}`);
    }
  },
  {
    connection,
    concurrency: 5,
  }
);

const queueEvents = new QueueEvents(EMAIL_QUEUE_NAME, { connection });

emailWorker.on("completed", (job) => {
  console.log(`✅ Email job completed: ${job.id}`);
});

emailWorker.on("failed", (job, error) => {
  console.error(`❌ Email job failed: ${job?.id}`, {
    jobName: job?.name,
    attemptsMade: job?.attemptsMade,
    error: error.message,
  });
});

queueEvents.on("failed", ({ jobId, failedReason }) => {
  console.error(`❌ Queue event failed for job ${jobId}: ${failedReason}`);
});

console.log("🚀 Email worker started and listening for jobs...");

process.on("SIGTERM", async () => {
  await emailWorker.close();
  await queueEvents.close();
  console.log("🛑 Email worker stopped gracefully (SIGTERM)");
  process.exit(0);
});

process.on("SIGINT", async () => {
  await emailWorker.close();
  await queueEvents.close();
  console.log("🛑 Email worker stopped gracefully (SIGINT)");
  process.exit(0);
});
