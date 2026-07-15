"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteFaktura } from "@/lib/faktura-actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function DeleteFakturaDialog({
  companyId,
  fakturaId,
  brojPrikaz,
}: {
  companyId: string;
  fakturaId: string;
  brojPrikaz: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function onDelete() {
    startTransition(async () => {
      await deleteFaktura(companyId, fakturaId);
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button variant="ghost" size="sm" className="text-destructive" />}
      >
        <Trash2 className="size-4" />
        <span className="sr-only">Obriši fakturu {brojPrikaz}</span>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Brisanje fakture {brojPrikaz}</DialogTitle>
          <DialogDescription>
            Brisanje fakture briše i njen upis u KPO knjizi. Ova radnja je nepovratna.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter showCloseButton>
          <Button variant="destructive" disabled={pending} onClick={onDelete}>
            {pending ? "Brisanje…" : "Obriši fakturu"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
