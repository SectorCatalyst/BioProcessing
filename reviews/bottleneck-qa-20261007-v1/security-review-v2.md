# Static app security review

Scope: new quick site, pure model, shared Button/Input/Tabs and styles, build/deploy configuration. The full calculator's existing backend was outside this new deployment and review.

DeepSec 2.3.10 local pattern scan: 42 files discovered; 90 of 198 matchers active; nine candidate matches in seven files. Run 20261007135429-8112203ccd9f9203. These are candidates, not confirmed findings. No AI processing/revalidation was performed.

Manual triage of all candidates:
- Five insecure-crypto matches are generic text/class-name false positives (including reduction, input, disabled/destructive and metadata text); no cryptographic operation exists in the scoped code.
- Two missing-auth matches are the intentionally public static page/layout exports. No protected data or action is present.
- One XSS match is React JSX attribute template literals composed from constant lane IDs and field keys. User values are numeric-validated and React-escaped, with no raw HTML insertion.
- One k8s-secret-reference match is a literal Referrer-Policy header in Render YAML; it is neither a Kubernetes manifest nor a secret.

Manual checks: no entered values enter URLs, storage, fetch, HTML insertion, shell commands or external submissions. Fixed full-tool HTTPS link uses noopener noreferrer. No credentials or root service environment variables are needed. Static export contains only index, 404 and not-found HTML; no API/admin routes or source maps. Source logo is byte-identical. Finite bounded numerical input and ordered scenarios are enforced and covered by model tests.

Deployment headers will be checked after publication. CSP deliberately permits inline Next hydration/style while disallowing external scripts, outbound connections, form submission and framing. Dependency versions and lockfile are unchanged from the patched baseline.

Limit: local pattern scan plus manual review is not an AI DeepSec report, penetration test or full accessibility certification.


## Reconciled public release and dependency audit
This snapshot supersedes security-review-v1.md; the original is preserved. Public HTTP 200 and all configured headers (including host HSTS) verified in live-http-check-v1.json. All three public estimates and the external handoff worked without console errors or warnings. No form on the full tool was filled or submitted.

The full locked parent audit reports 34 dependency advisories locally (2 critical, 24 high, 8 moderate); Render's platform-specific install reported 33. The audit is not clean. No dependency version or lockfile was changed in this build. DeepSec was installed only in the temporary verification folder and is not an app dependency.

Exposure triage for the new app:
- Next's critical [Windows server advisory](https://github.com/vercel/next.js/security/advisories/GHSA-p293-qw3h-jr36) applies to a Windows-hosted Next server. The quick deployment serves static files with no Next server.
- The critical [AVIF image optimization advisory](https://github.com/vercel/next.js/security/advisories/GHSA-2xp9-vwfh-vxw4) requires the image optimization surface. No image API is deployed; the only image is a fixed trusted PNG, with images unoptimized.
- The critical [ImageResponse advisory](https://github.com/vercel/next.js/security/advisories/GHSA-vcvr-r3jv-pc5j) concerns attacker-controlled values during Node image generation. No ImageResponse or image-generation route exists in the quick source/output.
- proxy-addr is not a deployed runtime or trusted-proxy decision surface in this static app. MCP/Hono/dev-tooling and YAML/glob/style parser warnings concern parts of the parent tooling tree that are not driven by anonymous inputs in this deployment.
- DOMPurify/ZIP parser paths belong to the parent PDF/tooling dependency tree and are not imported by the quick app. No rich HTML or uploaded archive is accepted.

This is a deployment-scope assessment, not remediation of the parent packages or a security sign-off for the original full calculator. Broader upgrades remain coordinated maintenance work. Avoid force-fix commands that downgrade/change the established stack without a separate tested revision. Static output/source inspection and browser/header evidence support the current quick preview; AI analysis/revalidation and penetration testing remain unperformed.
