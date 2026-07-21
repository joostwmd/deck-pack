"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@deck-pack/ui/components/system/table";
import { cn } from "@deck-pack/ui/lib/utils";

export type SeatUsageTableRow = {
  seatId: string;
  userId: string | null;
  email: string;
  name: string | null;
  status: string;
  totalUsed: number;
};

export type SeatUsageTableProps = {
  rows: SeatUsageTableRow[];
  onSelectSeat?: (row: SeatUsageTableRow) => void;
  className?: string;
};

export function SeatUsageTable({ rows, onSelectSeat, className }: SeatUsageTableProps) {
  return (
    <div className={cn("rounded-lg border border-border/80", className)}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Seat</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Insertions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="text-muted-foreground text-center">
                No seats assigned yet.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow
                key={row.seatId}
                className={onSelectSeat ? "cursor-pointer hover:bg-muted/40" : undefined}
                onClick={() => onSelectSeat?.(row)}
              >
                <TableCell>
                  <div className="font-medium">{row.name?.trim() || row.email}</div>
                  {row.name ? (
                    <div className="text-muted-foreground text-xs">{row.email}</div>
                  ) : null}
                </TableCell>
                <TableCell className="capitalize">{row.status}</TableCell>
                <TableCell className="text-right tabular-nums">{row.totalUsed}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
