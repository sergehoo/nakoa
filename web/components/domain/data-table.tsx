"use client";

import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface Column<T> {
  header: ReactNode;
  cell: (row: T) => ReactNode;
  className?: string;
  width?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  empty?: ReactNode;
  onRowClick?: (row: T) => void;
}

export function DataTable<T>({ data, columns, rowKey, empty, onRowClick }: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="p-12 text-center text-sm text-muted-foreground">
        {empty ?? "Aucune donnée à afficher."}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b bg-secondary/40">
          <tr>
            {columns.map((c, i) => (
              <th
                key={i}
                className={cn(
                  "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground",
                  c.className,
                )}
                style={c.width ? { width: c.width } : undefined}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {data.map((row) => (
            <tr
              key={rowKey(row)}
              onClick={() => onRowClick?.(row)}
              className={cn(
                "transition-colors hover:bg-secondary/40",
                onRowClick && "cursor-pointer",
              )}
            >
              {columns.map((c, i) => (
                <td key={i} className={cn("px-4 py-3", c.className)}>
                  {c.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
