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
