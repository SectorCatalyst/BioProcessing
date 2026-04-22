import type { EditableModel, ScenarioId } from "@/lib/model";

export type ValueChainRelevance = "Core" | "Adjacent" | "Context";
export type ShortfallSeverity = "Watch" | "Material" | "High";

interface ValueChainFocus {
  processTypes: string[];
  processStages: string[];
  modalities: string[];
}

export interface BioprocessValueChainStage {
  id: string;
  title: string;
  lifecycle: string;
  description: string;
  unitOperations: string[];
  commonShortfalls: string[];
  operationalSignals: string[];
  dataToReview: string[];
  diagnosticQuestions: string[];
  digitalInterventions: string[];
  applicability: string;
  focus: ValueChainFocus;
}

export interface ValueChainStageView extends BioprocessValueChainStage {
  relevance: ValueChainRelevance;
  relevanceScore: number;
}

export interface ShortfallFinding {
  id: string;
  title: string;
  severity: ShortfallSeverity;
  stageIds: string[];
  whyItAppears: string;
  evidence: string[];
  likelyImpact: string[];
  nextQuestions: string[];
  score: number;
}

const ALL = "All";

const resolveSeverity = (score: number): ShortfallSeverity => {
  if (score >= 7) {
    return "High";
  }

  if (score >= 4) {
    return "Material";
  }

  return "Watch";
};

const includesValue = (candidates: string[], value: string) =>
  candidates.includes(ALL) || candidates.includes(value);

export const BIOPROCESS_VALUE_CHAIN_STAGES: BioprocessValueChainStage[] = [
  {
    id: "portfolio-and-product-strategy",
    title: "Portfolio, Product, and CMC Strategy",
    lifecycle: "Strategy and development framing",
    description:
      "Translate molecule intent, target product profile, stage plan, and program constraints into an executable CMC path. This is where teams decide what must be proven now versus later and how development work will be sequenced.",
    unitOperations: [
      "Target product profile alignment",
      "CMC stage planning",
      "Experiment prioritization",
      "Cross-functional operating model",
      "Program governance",
    ],
    commonShortfalls: [
      "Unclear success criteria between development, quality, and manufacturing",
      "Experiments prioritized by urgency instead of decision value",
      "Weak linkage between program milestones and process evidence",
      "Portfolio decisions made without a shared evidence package",
    ],
    operationalSignals: [
      "Frequent reprioritization",
      "Late scope changes",
      "Repeated requests for the same data package",
      "Decision meetings that end without a clear action owner",
    ],
    dataToReview: [
      "Program milestone definitions",
      "Stage-gate decision packets",
      "Experiment backlogs",
      "Decision-cycle timing",
    ],
    diagnosticQuestions: [
      "Which process decisions are currently slow, repeated, or disputed?",
      "What evidence must exist before the next scale-up or transfer step?",
      "Where do teams still rely on narrative updates instead of structured evidence?",
    ],
    digitalInterventions: [
      "Program-level dashboards",
      "Decision templates tied to process evidence",
      "Central experiment context and traceability",
      "Standard review packets",
    ],
    applicability:
      "Relevant across all biologics, cell and gene therapy, vaccines, microbial fermentation, and hybrid modality programs.",
    focus: {
      processTypes: [ALL],
      processStages: [ALL],
      modalities: [ALL],
    },
  },
  {
    id: "construct-and-cell-line-development",
    title: "Construct, Cell Line, or Strain Development",
    lifecycle: "Early development",
    description:
      "Establish the biological starting point for development. Depending on modality, this can include clone screening, vector design, producer cell line work, donor-material workflows, or strain engineering.",
    unitOperations: [
      "Clone or strain selection",
      "Vector or construct definition",
      "Cell bank strategy",
      "Screening campaigns",
      "Stability and productivity assessment",
    ],
    commonShortfalls: [
      "Poor traceability between construct decisions and later process performance",
      "Screening data scattered across instruments and notebooks",
      "Banking and lineage information difficult to reconcile",
      "High variability accepted too early because data review is slow",
    ],
    operationalSignals: [
      "Repeated clone comparisons",
      "Manual lineage tracking",
      "Inconsistent naming conventions",
      "Delayed handoff into process development",
    ],
    dataToReview: [
      "Clone or strain genealogy",
      "Screening outputs",
      "Bank qualification records",
      "Productivity and stability trends",
    ],
    diagnosticQuestions: [
      "Can the team explain why the current construct or line was selected?",
      "How easily can early screening evidence be reused downstream?",
      "Where does lineage or source history become ambiguous?",
    ],
    digitalInterventions: [
      "Sample and lineage tracking",
      "Standardized experiment metadata",
      "Digital clone review packages",
      "Structured handoff into process development",
    ],
    applicability:
      "Especially important for monoclonal antibodies, recombinant proteins, microbial fermentation, viral vectors, vaccines, and engineered cell therapies.",
    focus: {
      processTypes: ["Upstream", "Integrated"],
      processStages: [
        "Discovery",
        "Cell Line or Strain Development",
        "Process Development",
      ],
      modalities: [ALL],
    },
  },
  {
    id: "process-development-and-characterization",
    title: "Process Development and Characterization",
    lifecycle: "Development and scale-down",
    description:
      "Build the process understanding required to move from promising biology to a repeatable operating window. This includes DoE work, parameter definition, comparability planning, and scale-down models that represent future manufacturing behavior.",
    unitOperations: [
      "Design of experiments",
      "CPP and CQA studies",
      "Scale-down model design",
      "Characterization campaigns",
      "Comparability package preparation",
    ],
    commonShortfalls: [
      "Experiments run without enough context to compare outcomes later",
      "Parameter definitions vary by team or site",
      "Scale-down models are weak proxies for manufacturing reality",
      "Knowledge stays in presentations instead of reusable data structures",
    ],
    operationalSignals: [
      "Frequent debate over experiment interpretation",
      "High rerun rates in development studies",
      "Slow root-cause analysis",
      "Difficulty defending parameter ranges",
    ],
    dataToReview: [
      "Experiment metadata completeness",
      "Parameter trend libraries",
      "Comparability evidence packages",
      "Development report cycle time",
    ],
    diagnosticQuestions: [
      "Which process parameters still lack a defendable operating range?",
      "Where are development teams redoing work because prior evidence is hard to reuse?",
      "How quickly can the team trace a bad outcome to its experimental context?",
    ],
    digitalInterventions: [
      "Structured experiment templates",
      "Parameter and trend libraries",
      "Cross-run analytics",
      "Standard development reporting",
    ],
    applicability:
      "A core stage for nearly every bioprocessing program because later manufacturing robustness depends on the quality of this evidence base.",
    focus: {
      processTypes: [ALL],
      processStages: [
        "Process Development",
        "Scale-Up",
        "Lifecycle Optimization",
      ],
      modalities: [ALL],
    },
  },
  {
    id: "materials-media-and-prep",
    title: "Materials, Media, Buffers, and Single-Use Readiness",
    lifecycle: "Preparation and enabling operations",
    description:
      "Ensure the process has the right media, buffers, consumables, assemblies, and incoming materials at the right time and in the right condition. This stage often becomes a hidden bottleneck because its failures present as downstream schedule slips or deviations.",
    unitOperations: [
      "Raw-material qualification",
      "Media and buffer preparation",
      "Single-use assembly readiness",
      "Incoming material release",
      "Inventory and lot traceability",
    ],
    commonShortfalls: [
      "Material readiness tracked in spreadsheets disconnected from execution",
      "Buffer and media preparation steps hard to reconcile later",
      "Lot changes not linked cleanly to process outcomes",
      "Single-use setup errors discovered late",
    ],
    operationalSignals: [
      "Last-minute material substitutions",
      "Frequent prep-related deviations",
      "Campaign delays due to readiness checks",
      "Weak traceability for lots and assemblies",
    ],
    dataToReview: [
      "Material availability timing",
      "Prep and release records",
      "Lot genealogy",
      "Deviation trends tied to incoming materials",
    ],
    diagnosticQuestions: [
      "Where do raw-material or consumable issues show up too late?",
      "Can the team tie process events back to lots, buffers, and assemblies quickly?",
      "What prep steps still depend on manual reconciliation?",
    ],
    digitalInterventions: [
      "Lot-linked materials tracking",
      "Prep workflow digitization",
      "Readiness dashboards",
      "Deviation analytics by material family",
    ],
    applicability:
      "Relevant everywhere, but especially painful in single-use-heavy biologics, viral vector, vaccine, and cell therapy operations.",
    focus: {
      processTypes: [ALL],
      processStages: [ALL],
      modalities: [ALL],
    },
  },
  {
    id: "seed-train-and-expansion",
    title: "Seed Train, Inoculum, and Expansion",
    lifecycle: "Upstream preparation",
    description:
      "Grow cells or organisms into the condition and quantity needed for production. In autologous or patient-specific workflows, this also covers chain-of-identity-sensitive expansion and conditioning steps.",
    unitOperations: [
      "Seed train planning",
      "Cell expansion",
      "Inoculum preparation",
      "Culture monitoring",
      "Readiness transfer into production",
    ],
    commonShortfalls: [
      "Expansion steps vary by operator or site",
      "Culture-history context is lost between vessels or handoffs",
      "Manual observations are not incorporated into later troubleshooting",
      "Scheduling conflicts create avoidable growth timing risk",
    ],
    operationalSignals: [
      "Frequent timing adjustments",
      "Variable growth performance",
      "Unclear causes for expansion drift",
      "Handwritten or fragmented observations",
    ],
    dataToReview: [
      "Growth and viability trends",
      "Seed-train timing history",
      "Culture observation logs",
      "Operator-to-operator variation",
    ],
    diagnosticQuestions: [
      "Where does the team lose continuity across expansion steps?",
      "How often are readiness calls based on tribal knowledge instead of consistent criteria?",
      "Which upstream observations matter but are not captured structurally?",
    ],
    digitalInterventions: [
      "Structured expansion workflows",
      "Cross-vessel genealogy tracking",
      "Context-rich observation capture",
      "Exception alerts on growth drift",
    ],
    applicability:
      "Most relevant for upstream biologics, microbial fermentation, viral vector production, and cell therapy expansion workflows.",
    focus: {
      processTypes: ["Upstream", "Integrated"],
      processStages: [
        "Process Development",
        "Scale-Up",
        "Clinical Manufacturing",
        "Commercial Manufacturing",
      ],
      modalities: [ALL],
    },
  },
  {
    id: "production-bioprocess",
    title: "Production Bioprocess Execution",
    lifecycle: "Core manufacturing or development runs",
    description:
      "Run the core culture, fermentation, transfection, infection, or processing step that creates the product-bearing material. This stage is where manual execution burden, weak process visibility, and poor contextualization often drive reruns or failed runs.",
    unitOperations: [
      "Bioreactor execution",
      "Fermentation control",
      "Perfusion or fed-batch management",
      "Transfection or infection steps",
      "In-process monitoring and intervention",
    ],
    commonShortfalls: [
      "Operators manually stitching together multiple systems to understand the run",
      "Late recognition of drift or out-of-trend behavior",
      "Troubleshooting depends on downloading and reconciling data after the fact",
      "Execution consistency changes by operator or equipment train",
    ],
    operationalSignals: [
      "High data aggregation hours per run",
      "Troubleshooting after the run instead of during it",
      "Manual work instructions outside the digital record",
      "Repeat deviations in core execution steps",
    ],
    dataToReview: [
      "Batch or run histories",
      "Time-aligned process parameters",
      "Intervention logs",
      "Run-to-run performance trends",
    ],
    diagnosticQuestions: [
      "How quickly can the team detect and explain run drift?",
      "Which actions still live outside the main execution record?",
      "What has to be downloaded and reassembled manually after every run?",
    ],
    digitalInterventions: [
      "Unified run review",
      "Time-aligned contextual data",
      "Deviation-ready event capture",
      "Cross-run pattern analysis",
    ],
    applicability:
      "A core stage for upstream and integrated programs across antibodies, recombinant proteins, vaccines, microbial fermentation, and many CGT production workflows.",
    focus: {
      processTypes: ["Upstream", "Integrated"],
      processStages: [ALL],
      modalities: [ALL],
    },
  },
  {
    id: "harvest-and-clarification",
    title: "Harvest, Collection, and Clarification",
    lifecycle: "Transition from production to purification or downstream handling",
    description:
      "Move the process from product generation into clarified feed, pooled harvest, or intermediate material suitable for downstream processing. Timing, hold conditions, filtration behavior, and contextual data continuity matter here.",
    unitOperations: [
      "Harvest timing",
      "Cell removal or solids separation",
      "Clarification",
      "Intermediate hold management",
      "Material transfer into downstream",
    ],
    commonShortfalls: [
      "Hold-time and condition data not tied cleanly to material quality",
      "Clarification events reviewed too late to inform future runs",
      "Filter performance and fouling history poorly reused",
      "Handoff between upstream and downstream teams lacks structured context",
    ],
    operationalSignals: [
      "Unexpected clarification variability",
      "Material waits before downstream release",
      "Repeated questions about harvest timing",
      "Incomplete transfer context between teams",
    ],
    dataToReview: [
      "Harvest and hold-time records",
      "Filtration behavior",
      "Transfer timing",
      "Yield and impurity trends",
    ],
    diagnosticQuestions: [
      "Can the team relate harvest timing and hold conditions to downstream performance?",
      "Where does context disappear between upstream and downstream review?",
      "Which clarification behaviors recur without a reusable explanation?",
    ],
    digitalInterventions: [
      "Structured handoff records",
      "Yield-linked event histories",
      "Filtration and hold-condition trend review",
      "Cross-stage contextual analytics",
    ],
    applicability:
      "Most relevant in integrated biologics, vaccines, viral vectors, and microbial processes, but the handoff logic also matters in cell and gene therapy intermediate handling.",
    focus: {
      processTypes: ["Harvest or Clarification", "Downstream", "Integrated"],
      processStages: [ALL],
      modalities: [ALL],
    },
  },
  {
    id: "downstream-purification",
    title: "Downstream Purification and Recovery",
    lifecycle: "Purification and impurity control",
    description:
      "Recover the target product and remove process-related or product-related impurities through capture, intermediate purification, polishing, filtration, and related operations. This is the main control point for yield, purity, and viral safety readiness in many biologics workflows.",
    unitOperations: [
      "Capture chromatography",
      "Intermediate purification",
      "Polishing steps",
      "Filtration",
      "Pool management and yield review",
    ],
    commonShortfalls: [
      "Column, membrane, and pool data difficult to compare across campaigns",
      "Impurity control evidence scattered across systems",
      "Step yields understood locally but not across the full train",
      "Troubleshooting focuses on isolated unit operations instead of the linked sequence",
    ],
    operationalSignals: [
      "Repeated yield erosion",
      "Late impurity surprises",
      "Manual spreadsheet reconciliation across steps",
      "Weak visibility into cumulative recovery loss",
    ],
    dataToReview: [
      "Step-yield history",
      "Pool genealogy",
      "Impurity and clearance results",
      "Column and filter lifecycle data",
    ],
    diagnosticQuestions: [
      "Can the team explain cumulative loss across the full purification train quickly?",
      "Where are impurity signals detected too late to change behavior?",
      "How easy is it to compare a problematic campaign to a good one?",
    ],
    digitalInterventions: [
      "End-to-end downstream context",
      "Step-to-step yield tracing",
      "Impurity trend dashboards",
      "Campaign comparison views",
    ],
    applicability:
      "Critical for monoclonal antibodies, recombinant proteins, vaccines, plasma products, enzymes, exosomes, and many viral vector workflows.",
    focus: {
      processTypes: ["Downstream", "Integrated"],
      processStages: [ALL],
      modalities: [ALL],
    },
  },
  {
    id: "viral-safety-and-clearance",
    title: "Viral Safety, Clearance, and Biological Risk Controls",
    lifecycle: "Safety assurance and specialized controls",
    description:
      "Demonstrate that the process removes or inactivates the right biological risks for the modality. In traditional biologics this often means viral clearance steps and evidence packages; in advanced therapies it can also mean adventitious-agent, contamination, or biosafety controls.",
    unitOperations: [
      "Viral inactivation",
      "Virus filtration or removal",
      "Adventitious-agent controls",
      "Risk-specific sampling and testing",
      "Supporting evidence packaging",
    ],
    commonShortfalls: [
      "Specialized safety evidence separated from routine process context",
      "Risk-control steps tracked manually outside broader review workflows",
      "Late discovery of missing evidence before submission or transfer",
      "Control strategy not explained consistently across teams",
    ],
    operationalSignals: [
      "Repeated document rework",
      "Unclear links between safety studies and process changes",
      "Manual evidence compilation",
      "Regulatory questions on comparability or risk controls",
    ],
    dataToReview: [
      "Clearance study records",
      "Risk assessment outputs",
      "Control strategy documents",
      "Change-impact assessments",
    ],
    diagnosticQuestions: [
      "How quickly can the team assemble a defensible safety-control story after a process change?",
      "Which risk-control steps still sit outside the normal data flow?",
      "Where does comparability review become manual and error-prone?",
    ],
    digitalInterventions: [
      "Risk-linked evidence libraries",
      "Change-impact workflows",
      "Comparability and clearance traceability",
      "Structured review packets",
    ],
    applicability:
      "Especially relevant for biologics and viral-vector workflows, but the same pattern applies wherever contamination risk and change impact must be defended rigorously.",
    focus: {
      processTypes: ["Downstream", "Integrated", "Analytical/QC", "Manufacturing Data & Quality"],
      processStages: ["Scale-Up", "Tech Transfer", "Clinical Manufacturing", "Commercial Manufacturing", "Lifecycle Optimization"],
      modalities: [ALL],
    },
  },
  {
    id: "formulation-and-final-processing",
    title: "UF/DF, Formulation, Final Conditioning, and Bulk Hold",
    lifecycle: "Drug substance preparation for final product or storage",
    description:
      "Prepare bulk material for final filtration, storage, or fill-finish through concentration, diafiltration, formulation, and final condition-setting steps. This stage often links process performance to final product quality and hold-time discipline.",
    unitOperations: [
      "UF/DF",
      "Concentration",
      "Buffer exchange",
      "Formulation",
      "Bulk hold and release readiness",
    ],
    commonShortfalls: [
      "Final-condition decisions not tied back to process history cleanly",
      "Hold and release timing managed manually",
      "Formulation changes hard to compare historically",
      "Late-stage rework because context is fragmented",
    ],
    operationalSignals: [
      "Repeated questions about formulation history",
      "Manual lot-release compilation",
      "Hold-time exceptions",
      "Difficulty relating final quality to prior process events",
    ],
    dataToReview: [
      "Concentration and exchange trends",
      "Formulation records",
      "Hold conditions",
      "Final quality and stability signals",
    ],
    diagnosticQuestions: [
      "Can final quality outcomes be traced back through the conditioning history quickly?",
      "Where do formulation decisions still depend on disconnected records?",
      "Which late-stage handoffs create preventable delay?",
    ],
    digitalInterventions: [
      "Condition-history tracking",
      "Lot-centric release preparation",
      "Formulation comparison tools",
      "Final-stage handoff summaries",
    ],
    applicability:
      "Common in biologics, vaccines, plasma products, exosomes, and other workflows that condition bulk material before final product operations.",
    focus: {
      processTypes: ["Downstream", "Fill-Finish", "Integrated"],
      processStages: ["Scale-Up", "Tech Transfer", "Clinical Manufacturing", "Commercial Manufacturing", "Lifecycle Optimization"],
      modalities: [ALL],
    },
  },
  {
    id: "fill-finish-and-drug-product",
    title: "Fill-Finish, Drug Product, and Final Release Preparation",
    lifecycle: "Drug product and patient-ready operations",
    description:
      "Convert the prepared material into the final drug product through sterile filtration, filling, packaging, and supporting release activities. In patient-specific workflows, this may include final formulation, cryopreservation, packaging, and chain-of-identity-sensitive release readiness.",
    unitOperations: [
      "Sterile filtration",
      "Filling and closing",
      "Packaging and labeling",
      "Final release support",
      "Patient or lot disposition readiness",
    ],
    commonShortfalls: [
      "Final records assembled manually from many upstream systems",
      "Release timing delayed by documentation reconciliation",
      "Weak visibility from drug product outcomes back to bulk history",
      "Packaging or labeling steps not linked tightly to process context",
    ],
    operationalSignals: [
      "Release delays",
      "Final-stage documentation churn",
      "Repeated data requests from QA",
      "Late exception discovery during product disposition",
    ],
    dataToReview: [
      "Fill records",
      "Packaging and label traceability",
      "Release checklists",
      "Lot or patient disposition history",
    ],
    diagnosticQuestions: [
      "How much manual assembly is still required before final release?",
      "Which information requests from QA or supply are most repetitive?",
      "Can final product issues be traced back to prior process context quickly?",
    ],
    digitalInterventions: [
      "Release-ready summary packets",
      "Cross-stage lot genealogy",
      "Exception-first review workflows",
      "Final-stage electronic records",
    ],
    applicability:
      "Required for any workflow that reaches final product, including sterile biologics, advanced therapies, vaccines, and packaged intermediates.",
    focus: {
      processTypes: ["Fill-Finish", "Integrated", "Manufacturing Data & Quality"],
      processStages: ["Clinical Manufacturing", "Commercial Manufacturing", "Tech Transfer", "Lifecycle Optimization"],
      modalities: [ALL],
    },
  },
  {
    id: "analytics-qc-and-pat",
    title: "Analytics, QC, PAT, and Evidence Generation",
    lifecycle: "Cross-functional measurement and release support",
    description:
      "Generate the in-process, development, QC, and release evidence that explains what happened and whether the material is acceptable. When data remains fragmented here, decision latency rises across the entire value chain.",
    unitOperations: [
      "Analytical method execution",
      "QC testing",
      "PAT or online monitoring",
      "Trend review",
      "Release and comparability evidence generation",
    ],
    commonShortfalls: [
      "Analytical data lives separately from process context",
      "Long lag between test completion and decision readiness",
      "Methods and metadata not normalized across sites or teams",
      "Trend review requires manual extraction and cleanup",
    ],
    operationalSignals: [
      "High decision-lag hours",
      "Repeated requests for custom reports",
      "Analytical exceptions revisited manually",
      "Slow release or comparability review",
    ],
    dataToReview: [
      "Method turnaround time",
      "Analytical metadata completeness",
      "Trend and exception reports",
      "Decision-lag history",
    ],
    diagnosticQuestions: [
      "How long does it take to move from available data to a usable decision packet?",
      "Where are analytical and process records still disconnected?",
      "Which tests repeatedly trigger manual data cleanup before review?",
    ],
    digitalInterventions: [
      "Context-linked analytical review",
      "Automated report generation",
      "Decision-ready dashboards",
      "Trend and exception libraries",
    ],
    applicability:
      "A universal stage because every bioprocess depends on timely and interpretable evidence, even when the exact assays differ by modality.",
    focus: {
      processTypes: ["Analytical/QC", "Manufacturing Data & Quality", "Integrated"],
      processStages: [ALL],
      modalities: [ALL],
    },
  },
  {
    id: "tech-transfer-scale-up-and-msat",
    title: "Scale-Up, Tech Transfer, and MSAT Handoffs",
    lifecycle: "Cross-site and cross-scale execution",
    description:
      "Translate development knowledge into new scales, equipment trains, partners, or sites. This is where hidden inconsistency becomes expensive because the receiving team needs a process that is not only documented, but also interpretable and executable.",
    unitOperations: [
      "Transfer package preparation",
      "Comparability planning",
      "Scale translation",
      "MSAT review",
      "Partner or site handoff",
    ],
    commonShortfalls: [
      "Transfer packages assembled manually and differently each time",
      "Receiving teams cannot see the development story behind key ranges",
      "Comparability evidence is spread across reports and spreadsheets",
      "Multi-site scale-up introduces naming, parameter, and equipment ambiguity",
    ],
    operationalSignals: [
      "High transfer preparation hours",
      "Repeated clarification questions from receiving teams",
      "Transfer delays across sites or partners",
      "Slow closeout of post-transfer issues",
    ],
    dataToReview: [
      "Transfer package cycle time",
      "Post-transfer issue logs",
      "Scale translation assumptions",
      "Comparability evidence reuse",
    ],
    diagnosticQuestions: [
      "What information does the receiving team repeatedly ask for after handoff?",
      "How much transfer content is recreated rather than assembled from structured history?",
      "Where do process definitions drift between sites or scales?",
    ],
    digitalInterventions: [
      "Reusable transfer packets",
      "Cross-site parameter libraries",
      "Comparability-linked evidence traceability",
      "Post-transfer issue dashboards",
    ],
    applicability:
      "Especially important in multi-site biologics, CDMO, vaccine, and advanced therapy networks where each handoff multiplies ambiguity and delay.",
    focus: {
      processTypes: [ALL],
      processStages: [
        "Scale-Up",
        "Tech Transfer",
        "Clinical Manufacturing",
        "Commercial Manufacturing",
      ],
      modalities: [ALL],
    },
  },
  {
    id: "manufacturing-data-and-automation",
    title: "Execution Systems, Automation, Historian, and Data Foundation",
    lifecycle: "Digital thread and operational data layer",
    description:
      "Connect instruments, software, execution systems, historians, and operational records so the team can understand process behavior without stitching evidence together manually. This is the enabling layer behind faster review and lower investigation burden.",
    unitOperations: [
      "Instrument integration",
      "Data contextualization",
      "Historian or data-lake preparation",
      "Workflow digitization",
      "Automated reporting",
    ],
    commonShortfalls: [
      "Data lives in too many vendor systems to review efficiently",
      "Reports are rebuilt manually for every run or campaign",
      "Time alignment and context linking are inconsistent",
      "Digitalization work stops at data collection instead of decision support",
    ],
    operationalSignals: [
      "High reporting hours",
      "High aggregation hours",
      "Many instruments per workflow",
      "Many vendors per workflow",
    ],
    dataToReview: [
      "System landscape",
      "Reporting cycle time",
      "Manual reconciliation steps",
      "Data handoffs between applications",
    ],
    diagnosticQuestions: [
      "How many systems must be touched to explain one run confidently?",
      "Which reports are still being rebuilt by hand?",
      "Where does missing context force analysts to become data janitors?",
    ],
    digitalInterventions: [
      "Unified operational data model",
      "Automated contextualization",
      "Reporting templates",
      "Cross-system traceability",
    ],
    applicability:
      "A cross-cutting stage for every bioprocess organization because fragmented data systems amplify problems everywhere else in the chain.",
    focus: {
      processTypes: ["Manufacturing Data & Quality", "Integrated", "Analytical/QC", ALL],
      processStages: [ALL],
      modalities: [ALL],
    },
  },
  {
    id: "quality-release-and-lifecycle-governance",
    title: "Quality Systems, Release, and Lifecycle Governance",
    lifecycle: "Controlled operation and continuous improvement",
    description:
      "Manage deviations, investigations, CAPA, change control, review, and release across the process lifecycle. Weak structure here slows the organization even when the underlying process is technically sound.",
    unitOperations: [
      "Deviation management",
      "Investigation workflows",
      "CAPA and change control",
      "Release decision support",
      "Lifecycle performance review",
    ],
    commonShortfalls: [
      "Investigations start with manual evidence gathering instead of root cause",
      "Deviation stories are inconsistent because data context is missing",
      "Change impact reviews are slow and repetitive",
      "Release readiness depends on heroic manual coordination",
    ],
    operationalSignals: [
      "High deviations per year",
      "Long investigation hours per deviation",
      "Repeated QA requests for supporting context",
      "Slow closure of quality events",
    ],
    dataToReview: [
      "Deviation trends",
      "Investigation cycle time",
      "CAPA closure performance",
      "Release readiness bottlenecks",
    ],
    diagnosticQuestions: [
      "How much investigation time is spent collecting context rather than analyzing it?",
      "Which quality events recur without a stable corrective mechanism?",
      "Where does change control review become a data hunt?",
    ],
    digitalInterventions: [
      "Deviation-ready event histories",
      "Exception-linked review packages",
      "Change-impact evidence libraries",
      "Lifecycle trend dashboards",
    ],
    applicability:
      "Relevant across all regulated or quality-managed bioprocess settings, including development environments that must support future transfer and submission.",
    focus: {
      processTypes: ["Manufacturing Data & Quality", "Analytical/QC", "Integrated", ALL],
      processStages: [ALL],
      modalities: [ALL],
    },
  },
  {
    id: "network-planning-and-workforce-readiness",
    title: "Network Planning, Scheduling, and Workforce Readiness",
    lifecycle: "Operational scaling and sustainment",
    description:
      "Keep the process executable through staffing, onboarding, scheduling, site coordination, and operating rhythm. Even technically strong processes underperform when teams cannot ramp people or coordinate work across the network.",
    unitOperations: [
      "Scheduling and campaign planning",
      "Cross-site coordination",
      "Onboarding and training",
      "Role-based readiness",
      "Capacity and workload balancing",
    ],
    commonShortfalls: [
      "Onboarding takes too long because process knowledge is implicit",
      "Site-to-site coordination depends on informal communication",
      "Schedule risk is not visible until work is already late",
      "Roles and responsibilities drift during fast scaling",
    ],
    operationalSignals: [
      "High onboarding hours per user",
      "Frequent schedule changes",
      "Many transfer events across sites",
      "Slow productivity ramp for new team members",
    ],
    dataToReview: [
      "Onboarding duration",
      "Role qualification timing",
      "Schedule adherence",
      "Cross-site issue logs",
    ],
    diagnosticQuestions: [
      "Which knowledge is hardest for new staff to absorb quickly?",
      "How easily can a second site or new partner become productive?",
      "Where does the operating model depend on a few experienced individuals?",
    ],
    digitalInterventions: [
      "Role-based playbooks",
      "Context-linked onboarding",
      "Cross-site operating dashboards",
      "Readiness and schedule risk views",
    ],
    applicability:
      "Most visible in multi-site, fast-growing, partner-heavy, or turnover-prone organizations, but it matters in any process that must scale beyond its original core team.",
    focus: {
      processTypes: [ALL],
      processStages: [ALL],
      modalities: [ALL],
    },
  },
];

export const getOrderedValueChainStages = (model: EditableModel): ValueChainStageView[] => {
  const profile = model.organizationProfile;

  return BIOPROCESS_VALUE_CHAIN_STAGES.map((stage) => {
    const processMatch = includesValue(stage.focus.processTypes, profile.processType);
    const stageMatch = includesValue(stage.focus.processStages, profile.processStage);
    const modalityMatch = includesValue(stage.focus.modalities, profile.modality);

    const relevanceScore =
      (processMatch ? 2 : 0) + (stageMatch ? 1 : 0) + (modalityMatch ? 1 : 0);

    const relevance: ValueChainRelevance =
      relevanceScore >= 3 ? "Core" : relevanceScore >= 1 ? "Adjacent" : "Context";

    return {
      ...stage,
      relevance,
      relevanceScore,
    };
  }).sort((left, right) => right.relevanceScore - left.relevanceScore);
};

export const getLikelyShortfalls = (
  model: EditableModel,
  scenarioId: ScenarioId,
): ShortfallFinding[] => {
  const profile = model.organizationProfile;
  const state = model.scenarios[scenarioId].currentState;

  const findings: ShortfallFinding[] = [];

  const aggregationBurden =
    state.scientistDataAggregationHoursPerRun +
    state.engineerDataAggregationHoursPerRun +
    state.technicianDataAggregationHoursPerRun +
    state.reportingHoursPerRun;
  const manualBurden =
    state.manualWorkflowExecutionHoursPerRun + state.troubleshootingHoursPerRun;

  if (
    aggregationBurden >= 8 ||
    state.timeToDecisionLagHours >= 12 ||
    profile.instrumentsPerWorkflow >= 10 ||
    profile.vendorsPerWorkflow >= 4
  ) {
    const score =
      (aggregationBurden >= 12 ? 3 : aggregationBurden >= 8 ? 2 : 0) +
      (state.timeToDecisionLagHours >= 24 ? 3 : state.timeToDecisionLagHours >= 12 ? 2 : 0) +
      (profile.instrumentsPerWorkflow >= 15 ? 1 : 0) +
      (profile.vendorsPerWorkflow >= 5 ? 1 : 0);

    findings.push({
      id: "data-foundation-fragmentation",
      title: "Data contextualization and review are likely fragmented",
      severity: resolveSeverity(score),
      stageIds: ["manufacturing-data-and-automation", "analytics-qc-and-pat"],
      whyItAppears:
        "The current inputs suggest that too much analyst time is spent assembling data and packaging reports before decisions can be made.",
      evidence: [
        `${aggregationBurden.toFixed(1)} combined data aggregation and reporting hours are spent per run.`,
        `${state.timeToDecisionLagHours} hours of decision lag are currently assumed.`,
        `${profile.instrumentsPerWorkflow} instruments and ${profile.vendorsPerWorkflow} vendors are involved in the workflow.`,
      ],
      likelyImpact: [
        "Slow run review and delayed intervention",
        "Repeated manual reporting burden",
        "Higher chance of inconsistent interpretation across teams",
      ],
      nextQuestions: [
        "Which systems must be touched to explain one run end to end?",
        "Which reports are still rebuilt by hand after every run or campaign?",
        "Where is context lost between process data and analytical evidence?",
      ],
      score,
    });
  }

  if (
    state.averageRerunRate >= 8 ||
    state.averageFailedRunRate >= 3 ||
    manualBurden >= 5
  ) {
    const score =
      (state.averageRerunRate >= 15 ? 3 : state.averageRerunRate >= 8 ? 2 : 0) +
      (state.averageFailedRunRate >= 6 ? 3 : state.averageFailedRunRate >= 3 ? 2 : 0) +
      (manualBurden >= 7 ? 1 : 0);

    findings.push({
      id: "process-robustness-gap",
      title: "Run execution and process understanding show a robustness gap",
      severity: resolveSeverity(score),
      stageIds: [
        "process-development-and-characterization",
        "production-bioprocess",
        "harvest-and-clarification",
      ],
      whyItAppears:
        "The process appears to lose value through reruns, failed runs, and manual troubleshooting effort, which usually points to weak comparability between runs or incomplete operating context.",
      evidence: [
        `${state.averageRerunRate}% rerun rate is currently modeled.`,
        `${state.averageFailedRunRate}% failed run rate is currently modeled.`,
        `${manualBurden.toFixed(1)} hours per run are spent on manual execution and troubleshooting.`,
      ],
      likelyImpact: [
        "Lost development capacity",
        "Higher material and labor burden",
        "Slower learning cycles because each bad run is expensive to explain",
      ],
      nextQuestions: [
        "What are the top repeat causes of reruns or failed runs?",
        "Can the team compare a poor run to a strong run without rebuilding the analysis manually?",
        "Which execution steps still vary by operator, site, or equipment train?",
      ],
      score,
    });
  }

  if (state.deviationsPerYear >= 12 || state.investigationHoursPerDeviation >= 8) {
    const score =
      (state.deviationsPerYear >= 40 ? 3 : state.deviationsPerYear >= 20 ? 2 : 1) +
      (state.investigationHoursPerDeviation >= 16
        ? 3
        : state.investigationHoursPerDeviation >= 8
          ? 2
          : 1);

    findings.push({
      id: "quality-investigation-burden",
      title: "Quality review and investigations are consuming too much recovery time",
      severity: resolveSeverity(score),
      stageIds: ["quality-release-and-lifecycle-governance", "analytics-qc-and-pat"],
      whyItAppears:
        "The deviation and investigation profile suggests the team is spending material time collecting evidence and reconciling events instead of moving directly into root-cause analysis.",
      evidence: [
        `${state.deviationsPerYear} deviations are assumed per year.`,
        `${state.investigationHoursPerDeviation} investigation hours are spent per deviation.`,
      ],
      likelyImpact: [
        "Longer closure cycles",
        "Higher QA and technical operations burden",
        "More friction during release or transfer review",
      ],
      nextQuestions: [
        "How much investigation time goes to evidence gathering before analysis begins?",
        "Which deviations recur because the same context is missing each time?",
        "Are quality events linked to run history, analytical results, and interventions in one place?",
      ],
      score,
    });
  }

  if (
    profile.transferEventsPerYear >= 4 ||
    state.transferPackagePreparationHours >= 60 ||
    profile.sites >= 2
  ) {
    const score =
      (profile.transferEventsPerYear >= 10 ? 3 : profile.transferEventsPerYear >= 4 ? 2 : 0) +
      (state.transferPackagePreparationHours >= 120
        ? 3
        : state.transferPackagePreparationHours >= 60
          ? 2
          : 0) +
      (profile.sites >= 4 ? 2 : profile.sites >= 2 ? 1 : 0);

    findings.push({
      id: "transfer-and-network-friction",
      title: "Tech transfer and cross-site handoff friction are likely material",
      severity: resolveSeverity(score),
      stageIds: ["tech-transfer-scale-up-and-msat", "network-planning-and-workforce-readiness"],
      whyItAppears:
        "The transfer profile indicates a meaningful coordination burden across sites, partners, or receiving teams.",
      evidence: [
        `${profile.transferEventsPerYear} transfer events are planned per year.`,
        `${state.transferPackagePreparationHours} hours are spent preparing each transfer package.`,
        `${profile.sites} sites are involved in the operating model.`,
      ],
      likelyImpact: [
        "Slow handoffs into new scales or sites",
        "Repeated clarification requests after transfer",
        "More delay risk when development knowledge is not reusable",
      ],
      nextQuestions: [
        "What questions does the receiving team always ask after handoff?",
        "How much transfer content is created from scratch versus assembled from reusable structured history?",
        "Where do parameter definitions drift between sites or scales?",
      ],
      score,
    });
  }

  if (
    state.campaignDurationWeeks >= 16 ||
    state.timeToDecisionLagHours >= 18 ||
    profile.activeProgramsPerYear >= 8
  ) {
    const score =
      (state.campaignDurationWeeks >= 24 ? 3 : state.campaignDurationWeeks >= 16 ? 2 : 0) +
      (state.timeToDecisionLagHours >= 24 ? 2 : state.timeToDecisionLagHours >= 18 ? 1 : 0) +
      (profile.activeProgramsPerYear >= 12 ? 2 : profile.activeProgramsPerYear >= 8 ? 1 : 0);

    findings.push({
      id: "cycle-time-and-decision-drag",
      title: "Cycle time and decision cadence are likely slowing portfolio throughput",
      severity: resolveSeverity(score),
      stageIds: [
        "portfolio-and-product-strategy",
        "process-development-and-characterization",
        "analytics-qc-and-pat",
      ],
      whyItAppears:
        "The current assumptions point to a long learning loop between run completion, review, and the next decision point.",
      evidence: [
        `${state.campaignDurationWeeks} weeks are assumed for campaign duration.`,
        `${state.timeToDecisionLagHours} hours of decision lag are currently assumed.`,
        `${profile.activeProgramsPerYear} active programs are being supported each year.`,
      ],
      likelyImpact: [
        "Lower throughput across the development portfolio",
        "More waiting time between experiments, reviews, and approvals",
        "Reduced ability to respond quickly to unexpected outcomes",
      ],
      nextQuestions: [
        "What is the longest wait between data availability and a usable team decision?",
        "Which recurring review steps add time without adding new evidence?",
        "Where do program teams wait for a report instead of seeing the data in context?",
      ],
      score,
    });
  }

  if (state.onboardingHoursPerUser >= 16 || profile.newUsersPerYear >= 10) {
    const score =
      (state.onboardingHoursPerUser >= 30 ? 3 : state.onboardingHoursPerUser >= 16 ? 2 : 0) +
      (profile.newUsersPerYear >= 30 ? 2 : profile.newUsersPerYear >= 10 ? 1 : 0);

    findings.push({
      id: "workforce-ramp-friction",
      title: "Knowledge transfer and onboarding are likely slower than they should be",
      severity: resolveSeverity(score),
      stageIds: ["network-planning-and-workforce-readiness", "manufacturing-data-and-automation"],
      whyItAppears:
        "The operating model appears to rely on a large amount of implicit knowledge or manual coaching to get people productive.",
      evidence: [
        `${state.onboardingHoursPerUser} onboarding hours are assumed per new user.`,
        `${profile.newUsersPerYear} new users are expected per year.`,
      ],
      likelyImpact: [
        "Longer ramp time for new staff",
        "Greater dependence on experienced individuals",
        "Slower scale-out to new teams or sites",
      ],
      nextQuestions: [
        "Which process tasks take the longest for new team members to learn confidently?",
        "What knowledge only exists in experienced operators' heads?",
        "Can training content point directly to the process context and evidence a new user needs?",
      ],
      score,
    });
  }

  if (findings.length === 0) {
    findings.push({
      id: "no-major-patterns",
      title: "No major shortfall pattern is strongly signaled by the current directional inputs",
      severity: "Watch",
      stageIds: ["portfolio-and-product-strategy"],
      whyItAppears:
        "The current assumptions do not indicate a single dominant bottleneck. That usually means the next step is to validate data quality and stage-specific evidence rather than assume the process is fully optimized.",
      evidence: [
        "The current directional inputs stay below the major trigger thresholds in the built-in diagnostic rules.",
      ],
      likelyImpact: [
        "The organization may have several smaller issues instead of one dominant constraint.",
      ],
      nextQuestions: [
        "Which stage still feels slow or painful even if the modeled metrics look acceptable?",
        "What process evidence is still hard to retrieve quickly?",
        "Where do teams rely on manual workarounds that are not visible in the current numbers?",
      ],
      score: 1,
    });
  }

  return findings.sort((left, right) => right.score - left.score);
};
