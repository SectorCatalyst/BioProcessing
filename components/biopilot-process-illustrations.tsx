import { useId, type ReactNode } from "react";

import type { ProcessProfileId } from "@/lib/biopilot-fit-assessment";
import { cn } from "@/lib/utils";

type IllustrationVariant = "tile" | "panel" | "report";

const PROCESS_VISUAL_META: Record<
  ProcessProfileId,
  {
    accent: string;
    secondary: string;
    badge: string;
  }
> = {
  "mab-cho": { accent: "#1CA7C8", secondary: "#0B4F9B", badge: "USP" },
  "biosimilar-antibody": { accent: "#32B1D7", secondary: "#0B4F9B", badge: "CMP" },
  "recombinant-protein": { accent: "#27B9C0", secondary: "#0B4F9B", badge: "PRT" },
  "microbial-fermentation": { accent: "#00A04C", secondary: "#0B4F9B", badge: "FERM" },
  vaccines: { accent: "#1CA7C8", secondary: "#0B4F9B", badge: "VAC" },
  "viral-vector": { accent: "#2BB3CF", secondary: "#00316C", badge: "AAV" },
  "plasmid-dna": { accent: "#12B4C7", secondary: "#00316C", badge: "DNA" },
  "mrna-rna": { accent: "#2FC6C7", secondary: "#0B4F9B", badge: "RNA" },
};

function Frame({
  children,
  accent,
  secondary,
  badge,
  variant,
}: {
  children: ReactNode;
  accent: string;
  secondary: string;
  badge: string;
  variant: IllustrationVariant;
}) {
  const id = useId().replace(/:/g, "");
  const compact = variant === "tile";
  const viewBox = compact ? "0 0 240 164" : "0 0 360 236";
  const width = compact ? 240 : 360;
  const height = compact ? 164 : 236;
  const scale = compact ? 1 : 1.46;

  return (
    <svg
      aria-hidden="true"
      className={cn(
        "w-full",
        compact ? "aspect-[1.46/1]" : variant === "panel" ? "aspect-[1.52/1]" : "aspect-[1.48/1]",
      )}
      viewBox={viewBox}
    >
      <defs>
        <linearGradient id={`panel-${id}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#f2f7fb" />
        </linearGradient>
        <linearGradient id={`wash-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={`${accent}18`} />
          <stop offset="100%" stopColor={`${secondary}08`} />
        </linearGradient>
      </defs>
      <rect x="8" y="8" width={width - 16} height={height - 16} rx="26" fill={`url(#panel-${id})`} />
      <rect
        x="8"
        y="8"
        width={width - 16}
        height={height - 16}
        rx="26"
        fill={`url(#wash-${id})`}
      />
      <rect x="8.5" y="8.5" width={width - 17} height={height - 17} rx="25.5" fill="none" stroke="#d7e3ef" />
      <path d={`M20 34 H${width - 20}`} stroke="#e2ebf4" strokeWidth="1" />
      <path d={`M24 ${height - 28} H${width - 24}`} stroke={secondary} strokeWidth="3" strokeLinecap="round" opacity="0.35" />
      {[0.28, 0.5, 0.72].map((ratio) => (
        <path
          key={ratio}
          d={`M${Math.round(width * ratio)} 42 V${height - 40}`}
          stroke="#edf3f8"
          strokeWidth="1"
        />
      ))}
      <rect x="24" y="19" width={compact ? 60 : 76} height="14" rx="7" fill="#eef4f8" />
      <text
        x={compact ? 54 : 62}
        y="29"
        fontSize={compact ? "8.5" : "9.5"}
        fontWeight="700"
        letterSpacing="0.18em"
        textAnchor="middle"
        fill={secondary}
      >
        {badge}
      </text>
      <g transform={`translate(${compact ? 0 : 18} ${compact ? 0 : 12}) scale(${scale})`}>{children}</g>
    </svg>
  );
}

function Reactor({
  x,
  y,
  accent,
  secondary,
  fillLevel = 0.34,
  width = 54,
  height = 86,
}: {
  x: number;
  y: number;
  accent: string;
  secondary: string;
  fillLevel?: number;
  width?: number;
  height?: number;
}) {
  const vesselBottom = y + height;
  const vesselWidth = width;
  const liquidTop = vesselBottom - height * fillLevel;

  return (
    <g>
      <path d={`M${x + 8} ${y} H${x + vesselWidth - 8}`} stroke={secondary} strokeWidth="4" strokeLinecap="round" />
      <path d={`M${x + 10} ${y + 8} H${x + vesselWidth - 10}`} stroke={secondary} strokeWidth="4" strokeLinecap="round" opacity="0.85" />
      <path d={`M${x + 16} ${y - 20} V${y}`} stroke="#c8d7e7" strokeWidth="5" strokeLinecap="round" />
      <path d={`M${x + vesselWidth / 2} ${y - 24} V${y}`} stroke="#c8d7e7" strokeWidth="5" strokeLinecap="round" />
      <path d={`M${x + vesselWidth - 16} ${y - 20} V${y}`} stroke="#c8d7e7" strokeWidth="5" strokeLinecap="round" />
      <path
        d={`M${x + 8} ${y + 10} V${vesselBottom - 16} Q${x + vesselWidth / 2} ${vesselBottom + 6} ${x + vesselWidth - 8} ${vesselBottom - 16} V${y + 10}`}
        fill="none"
        stroke={secondary}
        strokeWidth="3.5"
      />
      <path
        d={`M${x + 10} ${liquidTop} Q${x + vesselWidth / 2} ${liquidTop - 6} ${x + vesselWidth - 10} ${liquidTop} V${vesselBottom - 18} Q${x + vesselWidth / 2} ${vesselBottom - 2} ${x + 10} ${vesselBottom - 18} Z`}
        fill={`${accent}18`}
        stroke={accent}
        strokeWidth="1.4"
        strokeDasharray="3 2"
      />
      <path d={`M${x + vesselWidth / 2} ${y + 22} V${vesselBottom - 12}`} stroke={secondary} strokeWidth="2.5" />
      <path d={`M${x + vesselWidth / 2 - 10} ${vesselBottom - 18} L${x + vesselWidth / 2 + 10} ${vesselBottom - 12}`} stroke={accent} strokeWidth="2.5" strokeLinecap="round" />
      <path d={`M${x + vesselWidth / 2 + 10} ${vesselBottom - 18} L${x + vesselWidth / 2 - 10} ${vesselBottom - 12}`} stroke={accent} strokeWidth="2.5" strokeLinecap="round" />
    </g>
  );
}

function Chip({
  x,
  y,
  width,
  label,
  value,
  accent,
}: {
  x: number;
  y: number;
  width: number;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <g>
      <rect x={x} y={y} width={width} height="26" rx="8" fill="#ffffff" stroke="#d7e3ef" />
      <text x={x + 8} y={y + 10} fontSize="6.5" fontWeight="700" letterSpacing="0.12em" fill="#6d8198">
        {label}
      </text>
      <text x={x + 8} y={y + 20} fontSize="8.5" fontWeight="700" fill={accent}>
        {value}
      </text>
    </g>
  );
}

function Antibody({ x, y, accent, secondary, scale = 1 }: { x: number; y: number; accent: string; secondary: string; scale?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <path d="M0 0 L12 18 L24 0" stroke={secondary} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M12 18 V40" stroke={accent} strokeWidth="4" strokeLinecap="round" />
      <path d="M3 6 H13" stroke={accent} strokeWidth="3" strokeLinecap="round" />
      <path d="M11 6 H21" stroke={accent} strokeWidth="3" strokeLinecap="round" />
    </g>
  );
}

function DNA({ x, y, accent, secondary, height = 58 }: { x: number; y: number; accent: string; secondary: string; height?: number }) {
  const step = height / 6;
  return (
    <g>
      <path d={`M${x} ${y} C${x + 22} ${y + 8} ${x + 22} ${y + step * 2 - 8} ${x} ${y + step * 2} C${x - 22} ${y + step * 2 + 8} ${x - 22} ${y + step * 4 - 8} ${x} ${y + step * 4} C${x + 22} ${y + step * 4 + 8} ${x + 22} ${y + height - 8} ${x} ${y + height}`} stroke={accent} strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d={`M${x + 20} ${y} C${x - 2} ${y + 8} ${x - 2} ${y + step * 2 - 8} ${x + 20} ${y + step * 2} C${x + 42} ${y + step * 2 + 8} ${x + 42} ${y + step * 4 - 8} ${x + 20} ${y + step * 4} C${x - 2} ${y + step * 4 + 8} ${x - 2} ${y + height - 8} ${x + 20} ${y + height}`} stroke={secondary} strokeWidth="3" fill="none" strokeLinecap="round" />
      {[0, 1, 2, 3, 4, 5].map((index) => (
        <path
          key={index}
          d={`M${x + (index % 2 === 0 ? 4 : 16)} ${y + step * index + 6} H${x + (index % 2 === 0 ? 16 : 4)}`}
          stroke="#8fb4d8"
          strokeWidth="2"
          strokeLinecap="round"
        />
      ))}
    </g>
  );
}

function RNA({ x, y, accent, secondary, compact = false }: { x: number; y: number; accent: string; secondary: string; compact?: boolean }) {
  return (
    <g>
      <path d={`M${x} ${y + 12} C${x + 16} ${y - 6} ${x + 28} ${y + 28} ${x + 42} ${y + 8} C${x + 56} ${y - 10} ${x + 74} ${y + 34} ${x + 88} ${y + 16}`} stroke={accent} strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d={`M${x + 4} ${y + 18} H${x + 16}`} stroke={secondary} strokeWidth="2.5" strokeLinecap="round" />
      <path d={`M${x + 28} ${y + 12} H${x + 40}`} stroke={secondary} strokeWidth="2.5" strokeLinecap="round" />
      <path d={`M${x + 52} ${y + 22} H${x + 64}`} stroke={secondary} strokeWidth="2.5" strokeLinecap="round" />
      {!compact ? <circle cx={x + 92} cy={y + 16} r="10" fill="#ffffff" stroke={secondary} strokeWidth="2.5" /> : null}
      {!compact ? <path d={`M${x + 86} ${y + 16} H${x + 98}`} stroke={accent} strokeWidth="2" strokeLinecap="round" /> : null}
    </g>
  );
}

function Plasmid({ x, y, accent, secondary }: { x: number; y: number; accent: string; secondary: string }) {
  return (
    <g>
      <circle cx={x} cy={y} r="24" fill="none" stroke={secondary} strokeWidth="3.2" strokeDasharray="6 5" />
      <circle cx={x + 26} cy={y - 18} r="16" fill="none" stroke={accent} strokeWidth="3.2" strokeDasharray="4 4" />
      <path d={`M${x - 10} ${y - 6} H${x + 10}`} stroke={accent} strokeWidth="2.4" strokeLinecap="round" />
      <path d={`M${x + 22} ${y - 18} H${x + 30}`} stroke={secondary} strokeWidth="2.4" strokeLinecap="round" />
      <path d={`M${x - 6} ${y + 10} H${x + 14}`} stroke="#8cb4d8" strokeWidth="2.4" strokeLinecap="round" />
    </g>
  );
}

function VaccineVial({ x, y, accent, secondary }: { x: number; y: number; accent: string; secondary: string }) {
  return (
    <g>
      <rect x={x} y={y + 12} width="32" height="46" rx="10" fill="none" stroke={secondary} strokeWidth="3" />
      <path d={`M${x + 8} ${y + 6} H${x + 24}`} stroke="#c7d8e8" strokeWidth="6" strokeLinecap="round" />
      <path d={`M${x + 7} ${y + 34} H${x + 25}`} stroke={accent} strokeWidth="2.8" strokeLinecap="round" />
      <path d={`M${x + 16} ${y + 26} V${y + 42}`} stroke={accent} strokeWidth="2.8" strokeLinecap="round" />
      <path d={`M${x + 48} ${y + 34} l8 8 18-24`} stroke={accent} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d={`M${x + 42} ${y + 32} q8-18 24-18 q16 0 24 18 q-6 24 -24 28 q-18-4 -24-28z`} fill="none" stroke={secondary} strokeWidth="2.4" />
    </g>
  );
}

function TrendScreen({ x, y, accent, secondary }: { x: number; y: number; accent: string; secondary: string }) {
  return (
    <g>
      <rect x={x} y={y} width="74" height="48" rx="10" fill="#ffffff" stroke="#d7e3ef" />
      <path d={`M${x + 10} ${y + 30} C${x + 18} ${y + 18} ${x + 24} ${y + 34} ${x + 34} ${y + 18} C${x + 44} ${y + 2} ${x + 52} ${y + 26} ${x + 64} ${y + 10}`} stroke={accent} strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d={`M${x + 18} ${y + 56} H${x + 54}`} stroke={secondary} strokeWidth="4" strokeLinecap="round" />
      <path d={`M${x + 36} ${y + 48} V${y + 56}`} stroke={secondary} strokeWidth="3" strokeLinecap="round" />
    </g>
  );
}

function renderGraphic(profileId: ProcessProfileId, accent: string, secondary: string, variant: IllustrationVariant) {
  const compact = variant === "tile";

  switch (profileId) {
    case "mab-cho":
      return (
        <>
          <Reactor x={74} y={42} accent={accent} secondary={secondary} fillLevel={0.32} />
          <Antibody x={48} y={48} accent={accent} secondary={secondary} scale={0.9} />
          <Antibody x={130} y={48} accent={accent} secondary={secondary} scale={0.9} />
          {!compact ? <Chip x={22} y={124} width={64} label="RUN" value="FED-BATCH" accent={secondary} /> : null}
          {!compact ? <Chip x={154} y={124} width={62} label="QC" value="PAT LIVE" accent={accent} /> : null}
        </>
      );
    case "biosimilar-antibody":
      return (
        <>
          <Antibody x={70} y={52} accent={accent} secondary={secondary} />
          <Antibody x={120} y={52} accent={accent} secondary={secondary} />
          <path d="M102 56 H114" stroke="#b9cbe0" strokeWidth="3" strokeLinecap="round" />
          <path d="M94 42 V104" stroke="#d5e2ef" strokeWidth="2" strokeDasharray="4 4" />
          <path d="M122 42 V104" stroke="#d5e2ef" strokeWidth="2" strokeDasharray="4 4" />
          {!compact ? <Chip x={32} y={124} width={78} label="CONTROL" value="COMPARE" accent={secondary} /> : null}
          {!compact ? <Chip x={126} y={124} width={86} label="REVIEW" value="MATCH LOTS" accent={accent} /> : null}
        </>
      );
    case "recombinant-protein":
      return (
        <>
          <Reactor x={68} y={40} accent={accent} secondary={secondary} fillLevel={0.28} />
          <DNA x={134} y={54} accent={accent} secondary={secondary} height={44} />
          {!compact ? <Chip x={28} y={124} width={80} label="UPSTREAM" value="YIELD READY" accent={secondary} /> : null}
          {!compact ? <Chip x={128} y={124} width={88} label="DSP" value="PURE PATH" accent={accent} /> : null}
        </>
      );
    case "microbial-fermentation":
      return (
        <>
          <Reactor x={86} y={38} accent={accent} secondary={secondary} fillLevel={0.4} />
          {[
            [64, 38, "AIR"],
            [64, 58, "O2"],
            [64, 78, "N2"],
          ].map(([x, y, label]) => (
            <g key={label}>
              <path d={`M${x} ${y} H${Number(x) + 28}`} stroke="#cfdcea" strokeWidth="3" strokeLinecap="round" />
              <text x={Number(x) - 4} y={Number(y) + 3} fontSize="7.5" fontWeight="700" fill={secondary} textAnchor="end">
                {label}
              </text>
            </g>
          ))}
          {[
            [118, 74],
            [126, 62],
            [134, 82],
          ].map(([cx, cy], index) => (
            <circle key={index} cx={cx} cy={cy} r="3.5" fill={`${accent}20`} stroke={accent} strokeWidth="1.5" />
          ))}
          {!compact ? <Chip x={148} y={124} width={70} label="GAS" value="MIXED" accent={accent} /> : null}
        </>
      );
    case "vaccines":
      return (
        <>
          <VaccineVial x={88} y={44} accent={accent} secondary={secondary} />
          {!compact ? <Chip x={32} y={126} width={78} label="RELEASE" value="READY" accent={secondary} /> : null}
          {!compact ? <Chip x={126} y={126} width={86} label="CONTEXT" value="LINK QC" accent={accent} /> : null}
        </>
      );
    case "viral-vector":
      return (
        <>
          <Reactor x={64} y={44} accent={accent} secondary={secondary} fillLevel={0.3} />
          <circle cx="154" cy="74" r="24" fill="none" stroke={secondary} strokeWidth="3" />
          {[0, 1, 2, 3, 4, 5].map((index) => {
            const angle = (Math.PI * 2 * index) / 6;
            return (
              <circle
                key={index}
                cx={154 + Math.cos(angle) * 17}
                cy={74 + Math.sin(angle) * 17}
                r="4.2"
                fill={`${accent}20`}
                stroke={accent}
                strokeWidth="1.6"
              />
            );
          })}
          <circle cx="154" cy="74" r="8" fill={`${secondary}14`} stroke={secondary} strokeWidth="1.8" />
          {!compact ? <Chip x={134} y={124} width={84} label="VECTOR" value="CLEAN VIEW" accent={accent} /> : null}
        </>
      );
    case "plasmid-dna":
      return (
        <>
          <Plasmid x={112} y={72} accent={accent} secondary={secondary} />
          <Chip x={34} y={52} width={64} label="QC" value="SEQ MAP" accent={secondary} />
          {!compact ? <Chip x={142} y={120} width={74} label="FLOW" value="TRACKED" accent={accent} /> : null}
        </>
      );
    case "mrna-rna":
      return (
        <>
          <RNA x={68} y={58} accent={accent} secondary={secondary} />
          <TrendScreen x={124} y={46} accent={accent} secondary={secondary} />
          {!compact ? <Chip x={42} y={126} width={76} label="CHAIN" value="RNA LIVE" accent={secondary} /> : null}
        </>
      );
  }
}

export function ProcessFamilyIllustration({
  profileId,
  className,
  variant = "tile",
}: {
  profileId: ProcessProfileId;
  className?: string;
  variant?: IllustrationVariant;
}) {
  const meta = PROCESS_VISUAL_META[profileId];

  return (
    <div className={cn("overflow-hidden rounded-[22px]", className)}>
      <Frame accent={meta.accent} secondary={meta.secondary} badge={meta.badge} variant={variant}>
        {renderGraphic(profileId, meta.accent, meta.secondary, variant)}
      </Frame>
    </div>
  );
}
