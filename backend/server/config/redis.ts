import { ConnectionOptions } from "bullmq";

let sharedConnectionOptions: ConnectionOptions | null = null;

export function getRedisConnection() {
  if (sharedConnectionOptions) {
    return sharedConnectionOptions;
  }

  const redisUrl = process.env.REDIS_URL;
  const redisToken = process.env.REDIS_TOKEN;

  if (!redisUrl) {
    throw new Error("REDIS_URL is required for BullMQ email queue");
  }

  let parsed: URL;
  try {
    parsed = new URL(redisUrl);
  } catch {
    throw new Error("REDIS_URL is invalid. Expected a valid redis/rediss URL.");
  }

  const password = parsed.password || redisToken;
  const port = parsed.port ? Number(parsed.port) : 6379;

  sharedConnectionOptions = {
    host: parsed.hostname,
    port,
    username: parsed.username || undefined,
    password: password || undefined,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    tls: parsed.protocol === "rediss:" ? {} : undefined,
  } as ConnectionOptions;

  return sharedConnectionOptions;
}
