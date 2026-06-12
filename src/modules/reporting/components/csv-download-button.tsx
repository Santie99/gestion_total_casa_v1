"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CsvRow, ReportPrimitive } from "../types";

function csvCell(value: ReportPrimitive) {
  if (value === null || value === undefined) return "";
  const text = String(value).replace(/"/g, '""');
  return `"${text}"`;
}

function rowsToCsv(rows: CsvRow[]) {
  if (!rows.length) return "Sin datos\n";
  const headers = Object.keys(rows[0]);
  const lines = [headers.map(csvCell).join(",")];

  for (const row of rows) {
    lines.push(headers.map((header) => csvCell(row[header])).join(","));
  }

  return lines.join("\n");
}

export function CsvDownloadButton({ filename, rows, label = "Exportar CSV" }: { filename: string; rows: CsvRow[]; label?: string }) {
  function handleDownload() {
    const csv = rowsToCsv(rows);
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={handleDownload} disabled={!rows.length}>
      <Download className="mr-2 h-4 w-4" />
      {label}
    </Button>
  );
}
