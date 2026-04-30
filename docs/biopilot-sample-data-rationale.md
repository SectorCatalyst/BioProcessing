# BioPilot Demo Sample Data Rationale

This app uses directional demo samples, not formal bioprocessing benchmarks. The values are intended to feel credible in a sales walkthrough while keeping the report clearly estimate-based until a client replaces the assumptions with their own operating data.

## Source Anchors

- FDA PAT guidance supports the core premise that better process understanding comes from measuring and controlling critical process and quality attributes during development and manufacturing: https://www.fda.gov/regulatory-information/search-fda-guidance-documents/pat-framework-innovative-pharmaceutical-development-manufacturing-and-quality-assurance
- FDA process validation guidance covers the lifecycle framing used by the app: development, qualification, commercial operation, and continued process verification: https://www.fda.gov/regulatory-information/search-fda-guidance-documents/process-validation-general-principles-and-practices
- ICH Q10 frames technology transfer as transfer of product and process knowledge, and commercial manufacturing as maintaining state of control and continual improvement: https://database.ich.org/sites/default/files/Q10%20Guideline.pdf
- High-throughput process development can involve 24 or 48 parallel microbioreactors, supporting higher annual run counts in process development than in full-scale manufacturing: https://www.sartorius.com/en/products/fermentation-bioreactors/ambr-multi-parallel-bioreactors/ambr-15-cell-culture
- CHO fed-batch process examples commonly run around 10-14 days, and high-throughput Ambr workflows can run 24-way studies with daily samples, supporting the app's separation of process-development run volume from clinical or commercial batch volume: https://www.waters.com/nextgen/pl/en/library/application-notes/2022/in-process-media-monitoring-using-the-bioaccord-lc-ms-for-the-automated-high-throughput-multi-parallel-ambr-15-microbioreactor-system.html
- Electronic batch record and review-by-exception material supports the app's focus on batch review effort, exception handling, and manual review drag as value levers: https://www.ey.com/en_us/insights/life-sciences/electronic-batch-records-improve-pharma-manufacturing

## Demo Archetypes

### Process Development Lab

- `runsPerYear` is set high because small-scale process development can run many parallel or repeated studies.
- Lower connectivity and higher manual transcription are intentional because development labs often stitch together bioreactor, analyzer, and spreadsheet context before a standardized manufacturing system exists.
- Failed-run cost and value-per-day assumptions are intentionally lower than clinical or commercial settings to avoid overstating early-stage economics.

### Clinical Tech Transfer

- More sites and transfer events reflect the move from development into clinical manufacturing and partner/site handoff.
- Review effort, analyzer delay, and transfer package hours are elevated because clinical-stage operations carry documentation, comparability, and handoff burden.
- Cost and acceleration values sit between process development and commercial scale.

### Commercial Multi-Site Network

- Higher annual runs are modeled as a network-level value, not a single-reactor assumption.
- Instrumentation maturity is higher than process development, while manual review, exception handling, and cross-site collaboration remain value levers.
- Failed-run and acceleration values are higher than earlier stages but still conservative for a directional sales tool.

## Guardrails Applied In Code

- Demo randomization keeps program counts, run counts, sites, transfer events, and vendor platforms as whole numbers.
- Financial fields are rounded to clean thousand-dollar values.
- Hourly rates are rounded to five-dollar increments.
- Sample-data usage is tracked separately from user-entered evidence and lowers evidence confidence unless users replace the assumptions.
