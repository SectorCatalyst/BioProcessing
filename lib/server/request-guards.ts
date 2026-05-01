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
const HONEYPOT_KEYS = ["website", "companyWebsite", "url", "fax"];
const SPAM_TEXT_PATTERNS = [
  /https?:\/\//i,
  /\b(?:casino|crypto|forex|viagra|porn|payday|loan|backlinks?)\b/i,
  /\b(?:seo services?|telegram|whatsapp|free money|work from home)\b/i,
  /<a\s+href=/i,
  /\[url=/i,
];

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

const getOriginFromUrl = (value: string | null | undefined) => {
  if (!value) {
    return null;
  }

  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
};

const getTrustedOrigins = (request: Request) => {
  const origins = new Set<string>();
  const requestOrigin = getOriginFromUrl(request.url);
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || "https";
  const publicSiteOrigin = getOriginFromUrl(process.env.NEXT_PUBLIC_SITE_URL);
  const configuredOrigins = (process.env.BIOPILOT_ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((origin) => getOriginFromUrl(origin.trim()))
    .filter((origin): origin is string => Boolean(origin));

  if (requestOrigin) {
    origins.add(requestOrigin);
  }

  if (forwardedHost) {
    origins.add(`${forwardedProto}://${forwardedHost}`);
  }

  if (publicSiteOrigin) {
    origins.add(publicSiteOrigin);
  }

  for (const origin of configuredOrigins) {
    origins.add(origin);
  }

  return origins;
};

const isTrustedBrowserOrigin = (request: Request) => {
  const trustedOrigins = getTrustedOrigins(request);
  const origin = getOriginFromUrl(request.headers.get("origin"));
  const referer = getOriginFromUrl(request.headers.get("referer"));

  if (origin) {
    return trustedOrigins.has(origin);
  }

  if (referer) {
    return trustedOrigins.has(referer);
  }

  return process.env.NODE_ENV !== "production";
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
  const contentType = request.headers.get("content-type") ?? "";

  if (!/\bapplication\/(?:[\w.+-]+\+)?json\b/i.test(contentType)) {
    return NextResponse.json(
      {
        message: "Submit this request as JSON.",
      },
      { status: 415 },
    );
  }

  if (!isTrustedBrowserOrigin(request)) {
    return NextResponse.json(
      {
        message: "This submission source is not allowed.",
      },
      { status: 403 },
    );
  }

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

export const readLimitedJsonPayload = async (
  request: Request,
  options: { maxContentLength?: number } = {},
): Promise<{ payload: unknown; response: null } | { payload: null; response: NextResponse }> => {
  const maxContentLength = options.maxContentLength ?? DEFAULT_MAX_CONTENT_LENGTH;
  const reader = request.body?.getReader();

  if (!reader) {
    return {
      payload: null,
      response: NextResponse.json(
        {
          message: "A JSON request body is required.",
        },
        { status: 400 },
      ),
    };
  }

  const chunks: Uint8Array[] = [];
  let receivedBytes = 0;

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    receivedBytes += value.byteLength;

    if (receivedBytes > maxContentLength) {
      await reader.cancel();

      return {
        payload: null,
        response: NextResponse.json(
          {
            message: "The submitted information is too large. Please reduce the entry and try again.",
          },
          { status: 413 },
        ),
      };
    }

    chunks.push(value);
  }

  const body = new TextDecoder().decode(
    chunks.length === 1 ? chunks[0] : new Uint8Array(chunks.flatMap((chunk) => Array.from(chunk))),
  );

  try {
    return {
      payload: JSON.parse(body),
      response: null,
    };
  } catch {
    return {
      payload: null,
      response: NextResponse.json(
        {
          message: "The request body must be valid JSON.",
        },
        { status: 400 },
      ),
    };
  }
};

const containsSpamText = (value: unknown): boolean => {
  if (typeof value === "string") {
    return SPAM_TEXT_PATTERNS.some((pattern) => pattern.test(value));
  }

  if (Array.isArray(value)) {
    return value.some((item) => containsSpamText(item));
  }

  if (value && typeof value === "object") {
    return Object.entries(value).some(([key, nestedValue]) => {
      if (key === "workEmail") {
        return false;
      }

      return containsSpamText(nestedValue);
    });
  }

  return false;
};

export const rejectHoneypotPayload = (payload: unknown) => {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const record = payload as Record<string, unknown>;
  const hasBotSignal = HONEYPOT_KEYS.some((key) => {
    const value = record[key];
    return typeof value === "string" && value.trim().length > 0;
  });

  if (!hasBotSignal && !containsSpamText(payload)) {
    return null;
  }

  return NextResponse.json(
    {
      message: "The submission could not be accepted.",
    },
    { status: 400 },
  );
};
