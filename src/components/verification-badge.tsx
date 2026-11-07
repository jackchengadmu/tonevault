import type { VerificationStatus } from "@/src/types";
import { verificationLabel } from "@/src/lib/format";

export function VerificationBadge({
  status,
}: {
  status: VerificationStatus;
}) {
  const isFull = status === "Fully Verified";
  const isRemote = status === "Remote Verified";

  if (status === "Unverified") {
    return (
      <span className="inline-flex items-center rounded-full border border-line bg-background/70 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-muted">
        Unverified
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] ${
        isFull
          ? "bg-gold text-background"
          : isRemote
            ? "border border-gold/50 bg-gold/10 text-gold-soft"
            : "border border-line text-muted"
      }`}
    >
      {verificationLabel(status)}
    </span>
  );
}

export function ScoreBadge({ score }: { score: number | null }) {
  if (score == null) {
    return (
      <span className="font-mono text-xs tracking-wide text-muted">Score pending</span>
    );
  }

  return (
    <span className="inline-flex items-baseline gap-1 font-mono text-sm text-gold-soft">
      <span className="text-base font-semibold">{score}</span>
      <span className="text-[10px] uppercase tracking-[0.18em] text-muted">/ 100</span>
    </span>
  );
}
