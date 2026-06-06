"use client";

import { useState, useEffect, useRef } from "react";
import { ArrowUp, ArrowDown } from "lucide-react";

// React doesn't support `indeterminate` as a prop — must be set via ref
function IndeterminateCheckbox({
  checked,
  indeterminate,
  onChange,
  className,
}: {
  checked: boolean;
  indeterminate: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className={className}
    />
  );
}

export type Column<T> = {
  key: keyof T;
  label: string;
  render?: (value: any, row: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
};

export type DataTableProps<T extends { id: string }> = {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  onRowClick?: (row: T) => void;
  onSelectChange?: (selected: string[]) => void;
  // Controlled selection (used by pages that manage selection state externally)
  selectable?: boolean;
  selectedRows?: string[];
  onSelectedRowsChange?: (rows: string[]) => void;
  actions?: {
    label: string;
    onClick: (row: T) => void;
    variant?: "primary" | "secondary" | "danger" | "success";
  }[];
  pagination?: {
    page: number;
    total: number;
    perPage: number;
    onPageChange: (page: number) => void;
    onPerPageChange: (perPage: number) => void;
  };
  emptyState?: string;
};

export function DataTable<T extends { id: string }>({
  columns,
  data,
  loading = false,
  onRowClick,
  onSelectChange,
  selectable,
  selectedRows: controlledSelected,
  onSelectedRowsChange,
  actions = [],
  pagination,
  emptyState = "No data found",
}: DataTableProps<T>) {
  const [internalSelected, setInternalSelected] = useState<Set<string>>(new Set());
  const [sortKey, setSortKey] = useState<keyof T | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // Use controlled selection if provided, otherwise internal state
  const selectedRows = controlledSelected
    ? new Set<string>(controlledSelected)
    : internalSelected;

  const setSelectedRows = (newSet: Set<string>) => {
    if (!controlledSelected) setInternalSelected(newSet);
    const arr = Array.from(newSet);
    onSelectChange?.(arr);
    onSelectedRowsChange?.(arr);
  };

  const handleSelectAll = (checked: boolean) => {
    const newSelected = checked ? new Set<string>(data.map((row) => row.id)) : new Set<string>();
    setSelectedRows(newSelected);
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedRows);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedRows(newSelected);
  };

  const handleSort = (key: keyof T) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const allSelected = data.length > 0 && selectedRows.size === data.length;
  const someSelected = selectedRows.size > 0 && selectedRows.size < data.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-accent border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-text-secondary text-lg">{emptyState}</p>
      </div>
    );
  }

  return (
    <div className="rounded-[var(--radius-lg)] border border-neutral-200 bg-white overflow-hidden">
      {/* Selected rows info */}
      {selectedRows.size > 0 && (
        <div className="bg-primary/5 px-6 py-3 border-b border-neutral-200">
          <p className="text-sm font-semibold text-primary">
            {selectedRows.size} row{selectedRows.size !== 1 ? "s" : ""} selected
          </p>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 border-b border-neutral-200">
            <tr>
              {onSelectChange && (
                <th className="px-4 py-3 text-left w-12">
                  <IndeterminateCheckbox
                    checked={allSelected}
                    indeterminate={someSelected}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="w-4 h-4 cursor-pointer"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className={`px-4 py-3 text-left font-semibold text-text-primary ${col.width || ""} ${
                    col.sortable ? "cursor-pointer hover:bg-neutral-100 transition-fast" : ""
                  }`}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <div className="flex items-center gap-2">
                    <span>{col.label}</span>
                    {col.sortable && sortKey === col.key && (
                      <span className="text-xs">
                        {sortDir === "asc" ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                      </span>
                    )}
                  </div>
                </th>
              ))}
              {actions.length > 0 && <th className="px-4 py-3 text-left font-semibold text-text-primary">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {data.map((row) => (
              <tr key={row.id} className="hover:bg-neutral-50 transition-fast">
                {onSelectChange && (
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedRows.has(row.id)}
                      onChange={(e) => handleSelectRow(row.id, e.target.checked)}
                      className="w-4 h-4 cursor-pointer"
                    />
                  </td>
                )}
                {columns.map((col) => (
                  <td
                    key={String(col.key)}
                    className="px-4 py-3 text-text-primary cursor-pointer"
                    onClick={() => onRowClick?.(row)}
                  >
                    {col.render ? col.render(row[col.key], row) : String(row[col.key] ?? "—")}
                  </td>
                ))}
                {actions.length > 0 && (
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {actions.map((action, i) => (
                        <button
                          key={i}
                          onClick={() => action.onClick(row)}
                          className={`px-2 py-1 rounded-[var(--radius-md)] text-xs font-semibold transition-fast ${
                            action.variant === "danger"
                              ? "bg-error/10 text-error hover:bg-error/20"
                              : action.variant === "primary"
                              ? "bg-success/10 text-success hover:bg-success/20"
                              : action.variant === "success"
                              ? "bg-green-50 text-green-700 hover:bg-green-100"
                              : "bg-neutral-100 text-text-secondary hover:bg-neutral-200"
                          }`}
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="border-t border-neutral-200 px-6 py-4 flex items-center justify-between">
          <div className="text-sm text-text-secondary">
            Showing {(pagination.page - 1) * pagination.perPage + 1} to{" "}
            {Math.min(pagination.page * pagination.perPage, pagination.total)} of {pagination.total}
          </div>
          <div className="flex items-center gap-4">
            <select
              value={pagination.perPage}
              onChange={(e) => pagination.onPerPageChange(Number(e.target.value))}
              className="px-3 py-1 border border-neutral-300 rounded-[var(--radius-md)] text-sm transition-fast"
            >
              <option value="25">25 per page</option>
              <option value="50">50 per page</option>
              <option value="100">100 per page</option>
            </select>
            <div className="flex gap-2">
              <button
                onClick={() => pagination.onPageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-3 py-1 border border-neutral-300 rounded-[var(--radius-md)] text-sm disabled:opacity-50 transition-fast hover:bg-neutral-50"
              >
                Previous
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.ceil(pagination.total / pagination.perPage) }, (_, i) => i + 1)
                  .slice(Math.max(0, pagination.page - 2), Math.min(pagination.page + 1, Math.ceil(pagination.total / pagination.perPage)))
                  .map((p) => (
                    <button
                      key={p}
                      onClick={() => pagination.onPageChange(p)}
                      className={`px-2 py-1 rounded-[var(--radius-md)] text-sm transition-fast ${
                        p === pagination.page ? "bg-accent text-primary font-semibold" : "border border-neutral-300 hover:bg-neutral-50"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
              </div>
              <button
                onClick={() => pagination.onPageChange(pagination.page + 1)}
                disabled={pagination.page >= Math.ceil(pagination.total / pagination.perPage)}
                className="px-3 py-1 border border-neutral-300 rounded-[var(--radius-md)] text-sm disabled:opacity-50 transition-fast hover:bg-neutral-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
