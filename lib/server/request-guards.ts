import { NextResponse } from "next/server";

declare global {
  var __biopilotRateLimitBuckets:
    | Map<string, { count: number; resetAt: number }>
    | undefined;
}

interface PublicPostGuardPolicy {
  key: string;
  limit: number;
  windowMs: number;
  maxContentLength?: number;
}

const DEFAULT_MAX_CONTENT_LENGTH = 256 * 1024;
const MAX_BUCKETS = 5000;

const getBuckets = () => {
  if (!global.__biopilotRateLimitBuckets) {
    global.__biopilotRateLimitBuckets = new Map();
  }

  return global.__biopilotRateLimitBuckets;
};

const getClientIp = (request: Request) => {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwardedFor || request.headers.get("x-real-ip")?.trim() || "unknown";
};

const pruneExpiredBuckets = (now: number) => {
  const buckets = getBuckets();

  if (buckets.size < MAX_BUCKETS) {
    return;
  }

  for (const [key, bucket] of buckets.entries()) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
};

export const enforcePublicPostGuard = (
  request: Request,
  policy: PublicPostGuardPolicy,
) => {
  const contentLengthHeader = request.headers.get("content-length");
  const maxContentLength = policy.maxContentLength ?? DEFAULT_MAX_CONTENT_LENGTH;

  if (contentLengthHeader) {
    const contentLength = Number(contentLengthHeader);

    if (Number.isFinite(contentLength) && contentLength > maxContentLength) {
      return NextResponse.json(
        {
          message: "The submitted information is too large. Please reduce the entry and try again.",
        },
        { status: 413 },
      );
    }
  }

  const now = Date.now();
  pruneExpiredBuckets(now);

  const buckets = getBuckets();
  const bucketKey = `${policy.key}:${getClientIp(request)}`;
  const existing = buckets.get(bucketKey);

  if (!existing || existing.resetAt <= now) {
    buckets.set(bucketKey, { count: 1, resetAt: now + policy.windowMs });
    return null;
  }

  existing.count += 1;

  if (existing.count <= policy.limit) {
    return null;
  }

  return NextResponse.json(
    {
      message: "Too many submissions from this network. Please wait a few minutes and try again.",
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(Math.max(1, Math.ceil((existing.resetAt - now) / 1000))),
      },
    },
  );
};

export const rejectHoneypotPayload = (payload: unknown) => {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const record = payload as Record<string, unknown>;
  const hasBotSignal = ["website", "companyWebsite", "url", "fax"].some((key) => {
    const value = record[key];
    return typeof value === "string" && value.trim().length > 0;
  });

  if (!hasBotSignal) {
    return null;
  }

  return NextResponse.json(
    {
      message: "The submission could not be accepted.",
    },
    { status: 400 },
  );
};
