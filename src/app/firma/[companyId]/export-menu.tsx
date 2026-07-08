"use client";

import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ExportMenu({
  companyId,
  godina,
}: {
  companyId: string;
  godina: number;
}) {
  const base = `/api/firma/${companyId}/kpo-export?godina=${godina}`;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size="sm">
            <Download className="size-4" />
            Izvoz
          </Button>
        }
      />
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          render={
            <a href={`${base}&format=xlsx`}>
              <FileSpreadsheet className="size-4" />
              Excel (.xlsx)
            </a>
          }
        />
        <DropdownMenuItem
          render={
            <a href={`${base}&format=pdf`}>
              <FileText className="size-4" />
              PDF
            </a>
          }
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
