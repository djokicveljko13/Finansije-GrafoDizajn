import { cn } from "@/lib/utils";
import { formatRsd } from "@/lib/money";

export function LimitProgress({
  ostvareno,
  limit,
  preostalo,
  procenat,
}: {
  ostvareno: number;
  limit: number;
  preostalo: number;
  procenat: number;
}) {
  const boja =
    procenat >= 90
      ? "bg-destructive"
      : procenat >= 75
        ? "bg-amber-500"
        : "bg-primary";

  return (
    <div className="space-y-3">
      <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-all", boja)}
          style={{ width: `${procenat}%` }}
        />
      </div>
      <div className="flex items-baseline justify-between text-sm">
        <span className="tabular-nums font-medium">{procenat.toFixed(1)}% od limita</span>
        <span className="text-muted-foreground">Limit: {formatRsd(limit)}</span>
      </div>
      <p className="text-sm">
        Preostalo do limita: <span className="font-medium tabular-nums">{formatRsd(preostalo)}</span>
      </p>
      {ostvareno >= limit ? (
        <p className="text-sm font-medium text-destructive">
          Paušalni limit je dostignut ili premašen.
        </p>
      ) : null}
    </div>
  );
}
