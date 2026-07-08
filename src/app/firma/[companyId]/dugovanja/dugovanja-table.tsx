import { Check } from "lucide-react";
import type { Debt } from "@prisma/client";
import { formatAmount } from "@/lib/money";
import { deleteDebt } from "@/lib/dugovanja-actions";
import { Button } from "@/components/ui/button";
import { PayPartialDialog } from "./pay-partial-dialog";

export function DugovanjaTable({
  companyId,
  debts,
  ukupno,
}: {
  companyId: string;
  debts: Debt[];
  ukupno: number;
}) {
  if (debts.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
        Nema evidentiranih dugovanja.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b bg-muted/50 text-left text-muted-foreground">
            <th className="p-2 font-medium">Klijent</th>
            <th className="p-2 text-right font-medium">Iznos</th>
            <th className="p-2" />
          </tr>
        </thead>
        <tbody>
          {debts.map((debt) => (
            <tr key={debt.id} className="border-b last:border-0 hover:bg-muted/30">
              <td className="p-2">{debt.klijent}</td>
              <td className="p-2 text-right tabular-nums">{formatAmount(debt.iznos)}</td>
              <td className="p-2 text-right">
                <div className="flex justify-end gap-2">
                  <PayPartialDialog
                    companyId={companyId}
                    debtId={debt.id}
                    klijent={debt.klijent}
                  />
                  <form action={deleteDebt.bind(null, companyId, debt.id)}>
                    <Button type="submit" variant="outline" size="sm">
                      <Check className="size-4" />
                      Isplaćeno
                    </Button>
                  </form>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-muted/50 font-medium">
            <td className="p-2">Ukupno</td>
            <td className="p-2 text-right tabular-nums">{formatAmount(ukupno)}</td>
            <td className="p-2" />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
