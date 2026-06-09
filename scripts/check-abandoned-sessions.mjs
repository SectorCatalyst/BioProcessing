const baseUrl =
  process.env.BIOPILOT_PUBLIC_BASE_URL?.trim().replace(/\/+$/, "") ||
  process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "") ||
  "https://bioprocessing-roi.onrender.com";

const cronKey =
  process.env.BIOPILOT_NOTIFICATION_CRON_KEY?.trim() ||
  process.env.LEAD_CAPTURE_ADMIN_KEY?.trim();

if (!cronKey) {
  throw new Error("Set BIOPILOT_NOTIFICATION_CRON_KEY or LEAD_CAPTURE_ADMIN_KEY.");
}

const response = await fetch(`${baseUrl}/api/admin/notifications/abandoned-sessions`, {
  method: "POST",
  headers: {
    "x-cron-key": cronKey,
  },
});

const payload = await response.json().catch(() => null);

if (!response.ok) {
  console.error(JSON.stringify(payload ?? { status: response.status }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify(payload, null, 2));
