"use client";

import { useState, useTransition } from "react";
import { updateKpoEntry, type KpoEditableField } from "@/lib/kpo-actions";
import { cn } from "@/lib/utils";

export function EditableCell({
  companyId,
  entryId,
  field,
  initialValue,
  type = "text",
  align = "left",
  listId,
}: {
  companyId: string;
  entryId: string;
  field: KpoEditableField;
  initialValue: string;
  type?: "text" | "number" | "date";
  align?: "left" | "right";
  listId?: string;
}) {
  const [value, setValue] = useState(initialValue);
  const [saved, setSaved] = useState(initialValue);
  const [isPending, startTransition] = useTransition();

  function commit() {
    if (value === saved) return;
    const next = value;
    startTransition(async () => {
      const result = await updateKpoEntry(companyId, entryId, field, next);
      if (result.error) {
        setValue(saved);
        window.alert(result.error);
        return;
      }
      setSaved(next);
    });
  }

  return (
    <input
      type={type}
      value={value}
      list={listId}
      autoComplete="off"
      step={type === "number" ? "0.01" : undefined}
      min={type === "number" ? "0" : undefined}
      onChange={(e) => setValue(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
      }}
      disabled={isPending}
      className={cn(
        "w-full min-w-0 rounded border border-transparent bg-transparent px-1 py-0.5 outline-none",
        "hover:border-input focus:border-ring focus:bg-background",
        "disabled:opacity-50",
        align === "right" && "text-right tabular-nums"
      )}
    />
  );
}
