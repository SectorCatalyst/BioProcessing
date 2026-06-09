import { expect, test } from "@playwright/test";

const leadPayload = {
  firstName: "Avery",
  lastName: "Stone",
  workEmail: "avery.stone@bioprocess.example",
  company: "Northstar Biologics",
  jobTitle: "Process Development Lead",
  countryRegion: "United States",
  consentToContact: true,
};

test.describe("public API abuse controls", () => {
  test("rejects cross-origin public submissions", async ({ request }) => {
    const response = await request.post("/api/lead-capture", {
      headers: {
        "Content-Type": "application/json",
        Origin: "https://spam.example",
      },
      data: leadPayload,
    });

    expect(response.status()).toBe(403);
    expect(await response.json()).toEqual({
      message: "This submission source is not allowed.",
    });
  });

  test("rejects oversized public submissions", async ({ request, baseURL }) => {
    const origin = new URL(baseURL ?? "http://127.0.0.1:3100").origin;
    const response = await request.post("/api/lead-capture", {
      headers: {
        "Content-Type": "application/json",
        Origin: origin,
      },
      data: {
        ...leadPayload,
        company: "A".repeat(20_000),
      },
    });

    expect(response.status()).toBe(413);
  });

  test("rejects honeypot and spam payloads", async ({ request, baseURL }) => {
    const origin = new URL(baseURL ?? "http://127.0.0.1:3100").origin;
    const honeypotResponse = await request.post("/api/lead-capture", {
      headers: {
        "Content-Type": "application/json",
        Origin: origin,
      },
      data: {
        ...leadPayload,
        website: "https://spam.example",
      },
    });
    expect(honeypotResponse.status()).toBe(400);

    const spamResponse = await request.post("/api/feedback", {
      headers: {
        "Content-Type": "application/json",
        Origin: origin,
      },
      data: {
        workEmail: leadPayload.workEmail,
        company: leadPayload.company,
        rating: 1,
        usefulness: 1,
        clarity: 1,
        comment: "Visit https://spam.example for crypto backlinks",
        page: "report",
      },
    });
    expect(spamResponse.status()).toBe(400);
  });

  test("requires server-side authorization for abandoned-session notification checks", async ({
    request,
  }) => {
    const response = await request.post("/api/admin/notifications/abandoned-sessions");

    expect(response.status()).toBe(401);
    expect(await response.json()).toEqual({
      message: "Notification authorization is required.",
    });
  });

  test("requires server-side authorization for the internal email webhook", async ({
    request,
  }) => {
    const response = await request.post("/api/internal/email-webhook", {
      headers: {
        "Content-Type": "application/json",
      },
      data: {
        event: "lead_captured",
      },
    });

    expect(response.status()).toBe(401);
    expect(await response.json()).toEqual({
      message: "Email webhook authorization is required.",
    });
  });
});
