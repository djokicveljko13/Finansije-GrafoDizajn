import { Trash2 } from "lucide-react";
import type { KpoRow, KpoTotals } from "@/lib/kpo";
import { formatAmount, paraToRsd } from "@/lib/money";
import { deleteKpoEntry } from "@/lib/kpo-actions";
import { Button } from "@/components/ui/button";
import { EditableCell } from "./editable-cell";

function toIsoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function KpoTable({
  companyId,
  rows,
  totals,
  clientNames,
}: {
  companyId: string;
  rows: KpoRow[];
  totals: KpoTotals;
  clientNames: string[];
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
        Nema upisa za izabranu godinu.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <datalist id="kpo-client-suggestions">
        {clientNames.map((naziv) => (
          <option key={naziv} value={naziv} />
        ))}
      </datalist>
      <table className="w-full min-w-[900px] border-collapse text-sm">
        <thead>
          <tr className="border-b bg-muted/50 text-left text-muted-foreground">
            <th className="p-2 font-medium">Redni broj</th>
            <th className="p-2 font-medium">Datum naplate</th>
            <th className="p-2 font-medium">Broj isprave</th>
            <th className="p-2 font-medium">Opis</th>
            <th className="p-2 font-medium">Klijent</th>
            <th className="p-2 text-right font-medium">Proizvodi</th>
            <th className="p-2 text-right font-medium">Usluge</th>
            <th className="p-2 text-right font-medium">Svega</th>
            <th className="p-2 text-right font-medium">Kumulativ</th>
            <th className="p-2" />
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b last:border-0 hover:bg-muted/30">
              <td className="p-2 text-center">{row.redniBroj}</td>
              <td className="p-2">
                <EditableCell
                  companyId={companyId}
                  entryId={row.id}
                  field="datumNaplate"
                  type="date"
                  initialValue={toIsoDate(row.datumNaplate)}
                />
              </td>
              <td className="p-2">
                <EditableCell
                  companyId={companyId}
                  entryId={row.id}
                  field="brojIsprave"
                  initialValue={row.brojIsprave ?? ""}
                />
              </td>
              <td className="p-2 min-w-[180px]">
                <EditableCell
                  companyId={companyId}
                  entryId={row.id}
                  field="opis"
                  initialValue={row.opis ?? ""}
                />
              </td>
              <td className="p-2">
                <EditableCell
                  companyId={companyId}
                  entryId={row.id}
                  field="clientNaziv"
                  initialValue={row.clientNaziv ?? ""}
                  listId="kpo-client-suggestions"
                />
              </td>
              <td className="p-2 text-right tabular-nums">
                <EditableCell
                  companyId={companyId}
                  entryId={row.id}
                  field="prihodProizvodi"
                  type="number"
                  align="right"
                  initialValue={
                    row.prihodProizvodi ? String(paraToRsd(row.prihodProizvodi)) : ""
                  }
                />
              </td>
              <td className="p-2 text-right tabular-nums">
                <EditableCell
                  companyId={companyId}
                  entryId={row.id}
                  field="prihodUsluge"
                  type="number"
                  align="right"
                  initialValue={row.prihodUsluge ? String(paraToRsd(row.prihodUsluge)) : ""}
                />
              </td>
              <td className="p-2 text-right font-medium tabular-nums">
                {formatAmount(row.svega)}
              </td>
              <td className="p-2 text-right tabular-nums text-muted-foreground">
                {formatAmount(row.kumulativ)}
              </td>
              <td className="p-2 text-right">
                <form action={deleteKpoEntry.bind(null, companyId, row.id)}>
                  <Button
                    type="submit"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Obriši upis"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-muted/50 font-medium">
            <td className="p-2" colSpan={5}>
              Ukupno
            </td>
            <td className="p-2 text-right tabular-nums">{formatAmount(totals.proizvodi)}</td>
            <td className="p-2 text-right tabular-nums">{formatAmount(totals.usluge)}</td>
            <td className="p-2 text-right tabular-nums">{formatAmount(totals.svega)}</td>
            <td className="p-2" colSpan={2} />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
