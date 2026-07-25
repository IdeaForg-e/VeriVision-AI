// Aura Modern Common Components — Badge, Button, EmptyState, Loader, Modal, Pagination, SearchBar, Table
import { Loader2, Search, X, ChevronLeft, ChevronRight, CheckCircle2, AlertTriangle, AlertCircle, ShieldAlert } from "lucide-react";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

/* ── Badge ──────────────────────────────────────────────────────────────── */
export function Badge({ status, size = "md" }) {
  const normalized = (status || "").toString().toUpperCase();

  const configs = {
    "AUTO-APPROVED": {
      label: "AUTO-APPROVED",
      style: { background: "var(--success-surface)", color: "var(--success)", borderColor: "var(--success-border)" },
      icon: CheckCircle2,
    },
    CLEAN: {
      label: "CLEAN",
      style: { background: "var(--success-surface)", color: "var(--success)", borderColor: "var(--success-border)" },
      icon: CheckCircle2,
    },
    PASSED: {
      label: "PASSED",
      style: { background: "var(--success-surface)", color: "var(--success)", borderColor: "var(--success-border)" },
      icon: CheckCircle2,
    },
    "PENDING QA": {
      label: "PENDING QA",
      style: { background: "var(--warning-surface)", color: "var(--warning)", borderColor: "var(--warning-border)" },
      icon: AlertTriangle,
    },
    WARNING: {
      label: "WARNING",
      style: { background: "var(--warning-surface)", color: "var(--warning)", borderColor: "var(--warning-border)" },
      icon: AlertTriangle,
    },
    LOW: {
      label: "LOW RISK",
      style: { background: "var(--primary-glow-sm)", color: "var(--primary)", borderColor: "rgba(0,125,184,0.20)" },
      icon: CheckCircle2,
    },
    "RETAKE REQUESTED": {
      label: "RETAKE REQUESTED",
      style: { background: "rgba(249,115,22,0.10)", color: "#f97316", borderColor: "rgba(249,115,22,0.25)" },
      icon: AlertCircle,
    },
    MISMATCH: {
      label: "MISMATCH",
      style: { background: "rgba(249,115,22,0.10)", color: "#f97316", borderColor: "rgba(249,115,22,0.25)" },
      icon: AlertCircle,
    },
    MISSING: {
      label: "MISSING",
      style: { background: "rgba(249,115,22,0.10)", color: "#f97316", borderColor: "rgba(249,115,22,0.25)" },
      icon: AlertCircle,
    },
    MEDIUM: {
      label: "MEDIUM RISK",
      style: { background: "var(--warning-surface)", color: "var(--warning)", borderColor: "var(--warning-border)" },
      icon: AlertTriangle,
    },
    QUARANTINE: {
      label: "QUARANTINE",
      style: { background: "var(--urgent-surface)", color: "var(--urgent)", borderColor: "var(--urgent-border)" },
      icon: ShieldAlert,
    },
    CRITICAL: {
      label: "CRITICAL",
      style: { background: "var(--urgent-surface)", color: "var(--urgent)", borderColor: "var(--urgent-border)" },
      icon: ShieldAlert,
    },
    HIGH: {
      label: "HIGH RISK",
      style: { background: "var(--urgent-surface)", color: "var(--urgent)", borderColor: "var(--urgent-border)" },
      icon: ShieldAlert,
    },
    TAMPERED: {
      label: "TAMPERED",
      style: { background: "var(--urgent-surface)", color: "var(--urgent)", borderColor: "var(--urgent-border)" },
      icon: ShieldAlert,
    },
    REUSED: {
      label: "REUSED",
      style: { background: "var(--warning-surface)", color: "var(--warning)", borderColor: "var(--warning-border)" },
      icon: AlertTriangle,
    },
  };

  const current = configs[normalized] || {
    label: status || "UNKNOWN",
    style: { background: "var(--glass-bg)", color: "var(--on-surface-variant)", borderColor: "var(--border-default)" },
    icon: null,
  };

  const Icon = current.icon;
  const isSm = size === "sm";

  return (
    <span
      className={`inline-flex items-center gap-1 ${isSm ? "px-2 py-0.5 text-[9px]" : "px-2.5 py-1 text-[10px]"}
                  font-bold rounded-full border uppercase tracking-wider`}
      style={{ ...current.style, fontFamily: "var(--font-body)" }}
    >
      {Icon && <Icon size={isSm ? 10 : 11} className="shrink-0" />}
      {current.label}
    </span>
  );
}

/* ── Button ──────────────────────────────────────────────────────────────── */
export function Button({
  children,
  onClick,
  type = "button",
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  icon,
  className = "",
}) {
  const variants = {
    primary: {
      style: {
        background: "var(--primary-container)",
        color: "#ffffff",
        border: "1px solid rgba(0,125,184,0.30)",
        boxShadow: "0 0 8px var(--primary-glow-sm)",
        fontFamily: "var(--font-body)",
      },
      hover: "hover:shadow-[0_0_20px_var(--primary-glow)] hover:-translate-y-[1px]",
    },
    secondary: {
      style: {
        background: "var(--glass-bg)",
        color: "var(--on-surface)",
        border: "1px solid var(--border-default)",
        fontFamily: "var(--font-body)",
      },
      hover: "hover:bg-[var(--glass-bg-strong)] hover:border-[var(--border-strong)]",
    },
    outline: {
      style: {
        background: "transparent",
        color: "var(--on-surface-variant)",
        border: "1px solid var(--border-default)",
        fontFamily: "var(--font-body)",
      },
      hover: "hover:bg-[var(--glass-bg)] hover:text-[var(--on-surface)] hover:border-[var(--border-strong)]",
    },
    danger: {
      style: {
        background: "rgba(233,69,96,0.15)",
        color: "var(--urgent)",
        border: "1px solid var(--urgent-border)",
        fontFamily: "var(--font-body)",
      },
      hover: "hover:bg-[var(--urgent-surface)]",
    },
    success: {
      style: {
        background: "rgba(16,185,129,0.15)",
        color: "var(--success)",
        border: "1px solid var(--success-border)",
        fontFamily: "var(--font-body)",
      },
      hover: "hover:bg-[var(--success-surface)]",
    },
    ghost: {
      style: {
        background: "transparent",
        color: "var(--on-surface-variant)",
        border: "1px solid transparent",
        fontFamily: "var(--font-body)",
      },
      hover: "hover:bg-[var(--glass-bg)] hover:text-[var(--on-surface)]",
    },
  };

  const sizes = {
    sm: "px-3 py-1.5 text-[11px] font-semibold",
    md: "px-4 py-2 text-[12px] font-semibold",
    lg: "px-5 py-2.5 text-[13px] font-semibold",
  };

  const v = variants[variant] || variants.primary;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      style={v.style}
      className={`inline-flex items-center justify-center gap-2 rounded-lg transition-all duration-200
                  active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed
                  ${v.hover} ${sizes[size]} ${className}`}
    >
      {loading ? <Loader2 size={14} className="animate-spin shrink-0" /> : icon}
      {children}
    </button>
  );
}

/* ── Empty State ─────────────────────────────────────────────────────────── */
export function EmptyState({
  icon: Icon = AlertCircle,
  title = "No data available",
  description = "There are no inspection records matching your criteria.",
  action = null,
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-all duration-300"
        style={{
          background: "var(--glass-bg)",
          border: "1px solid var(--border-default)",
          color: "var(--on-surface-muted)",
        }}
      >
        {typeof Icon === "string" ? (
          <span className="material-symbols-outlined text-2xl">{Icon}</span>
        ) : (
          <Icon size={24} />
        )}
      </div>
      <h3 className="text-sm font-medium" style={{ fontFamily: "var(--font-headline)", color: "var(--on-surface)" }}>
        {title}
      </h3>
      <p className="text-[11px] mt-1.5 max-w-sm mx-auto leading-relaxed"
         style={{ fontFamily: "var(--font-body)", color: "var(--on-surface-muted)" }}>
        {description}
      </p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/* ── Loader ──────────────────────────────────────────────────────────────── */
export function Loader({ fullPage = false, size = "md", label = "Loading audit data…" }) {
  const sizes = {
    sm: "w-5 h-5 border-[1.5px]",
    md: "w-9 h-9 border-2",
    lg: "w-14 h-14 border-2",
  };

  const spinner = (
    <div className="flex flex-col items-center gap-3">
      <div
        className={`${sizes[size] ?? sizes.md} rounded-full animate-spin`}
        style={{
          borderColor: "var(--border-default)",
          borderTopColor: "var(--primary-container)",
          boxShadow: "0 0 16px var(--primary-glow-sm)",
        }}
      />
      {label && (
        <span
          className="text-[11px] font-medium"
          style={{ fontFamily: "var(--font-body)", color: "var(--on-surface-muted)" }}
        >
          {label}
        </span>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{
          background: "rgba(17,19,24,0.75)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      >
        {spinner}
      </div>
    );
  }

  return <div className="flex items-center justify-center py-12">{spinner}</div>;
}

/* ── Modal ───────────────────────────────────────────────────────────────── */
export function Modal({ open = false, onClose, title, children, footer, size = "md" }) {
  const overlayRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => { if (e.key === "Escape") onClose?.(); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  const sizes = { sm: "max-w-md", md: "max-w-xl", lg: "max-w-3xl", xl: "max-w-5xl" };

  return createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      style={{
        background: "rgba(0,0,0,0.60)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      }}
      onClick={(e) => { if (e.target === overlayRef.current) onClose?.(); }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className={`${sizes[size] ?? sizes.md} w-full flex flex-col max-h-[90vh] overflow-hidden animate-slide-up`}
        style={{
          background: "var(--glass-bg-strong)",
          backdropFilter: "var(--glass-blur-heavy)",
          WebkitBackdropFilter: "var(--glass-blur-heavy)",
          border: "1px solid var(--border-default)",
          borderTopColor: "var(--border-light-top)",
          borderRadius: "var(--radius-xl)",
          boxShadow: "var(--glass-shadow), var(--glass-inset)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: "1px solid var(--border-hairline)" }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-5 w-0.5 rounded-full" style={{ background: "var(--primary-container)" }} />
            {typeof title === "string" ? (
              <h2
                id="modal-title"
                className="text-sm font-medium tracking-tight truncate"
                style={{ fontFamily: "var(--font-headline)", color: "var(--on-surface)" }}
              >
                {title}
              </h2>
            ) : (
              <div id="modal-title" className="min-w-0">{title}</div>
            )}
          </div>
          <button
            onClick={onClose}
            className="h-7 w-7 rounded-lg flex items-center justify-center transition-all duration-150
                       hover:bg-[var(--glass-bg)]"
            style={{ color: "var(--on-surface-muted)" }}
            aria-label="Close modal"
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div
          className="flex-1 overflow-y-auto px-6 py-5"
          style={{ color: "var(--on-surface-variant)", fontFamily: "var(--font-body)" }}
        >
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div
            className="px-6 py-4 flex items-center justify-end gap-2.5"
            style={{ borderTop: "1px solid var(--border-hairline)", background: "var(--glass-bg)" }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

/* ── Pagination ──────────────────────────────────────────────────────────── */
export function Pagination({ currentPage, totalPages, totalItems, pageSize, onPageChange }) {
  const start = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);

  return (
    <div
      className="flex flex-col sm:flex-row justify-between items-center gap-3 px-5 py-3"
      style={{ borderTop: "1px solid var(--border-hairline)" }}
    >
      <p className="text-[11px]" style={{ color: "var(--on-surface-muted)", fontFamily: "var(--font-body)" }}>
        Showing{" "}
        <span className="font-semibold" style={{ color: "var(--on-surface)", fontFamily: "var(--font-mono)" }}>
          {start}–{end}
        </span>{" "}
        of{" "}
        <span className="font-semibold" style={{ color: "var(--on-surface)", fontFamily: "var(--font-mono)" }}>
          {totalItems}
        </span>{" "}
        records
      </p>
      <div className="flex items-center gap-1">
        <button
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="flex items-center justify-center h-7 px-2 rounded-lg border transition-all duration-150
                     hover:bg-[var(--glass-bg)] disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ borderColor: "var(--border-default)", color: "var(--on-surface-variant)" }}
        >
          <ChevronLeft size={14} />
        </button>
        {Array.from({ length: totalPages }, (_, index) => (
          <button
            key={index}
            onClick={() => onPageChange(index + 1)}
            className="h-7 w-7 rounded-lg text-[11px] font-semibold transition-all duration-150"
            style={{
              fontFamily: "var(--font-mono)",
              background: currentPage === index + 1 ? "var(--primary-container)" : "transparent",
              color: currentPage === index + 1 ? "#fff" : "var(--on-surface-variant)",
              border: `1px solid ${currentPage === index + 1 ? "transparent" : "var(--border-default)"}`,
              boxShadow: currentPage === index + 1 ? "0 0 10px var(--primary-glow-sm)" : "none",
            }}
          >
            {index + 1}
          </button>
        ))}
        <button
          disabled={currentPage === totalPages || totalPages === 0}
          onClick={() => onPageChange(currentPage + 1)}
          className="flex items-center justify-center h-7 px-2 rounded-lg border transition-all duration-150
                     hover:bg-[var(--glass-bg)] disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ borderColor: "var(--border-default)", color: "var(--on-surface-variant)" }}
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

/* ── Search Bar ──────────────────────────────────────────────────────────── */
export function SearchBar({ value, onChange, placeholder = "Search inspections by serial or ID..." }) {
  return (
    <div className="relative w-full">
      <Search
        size={14}
        className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{ color: "var(--on-surface-muted)" }}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full py-2 pl-9 pr-9 text-[12px] rounded-lg outline-none transition-all duration-200"
        style={{
          background: "rgba(0,0,0,0.15)",
          border: "1px solid var(--border-default)",
          color: "var(--on-surface)",
          fontFamily: "var(--font-body)",
        }}
        onFocus={(e) => {
          e.target.style.borderColor = "var(--primary-container)";
          e.target.style.boxShadow = "0 0 0 3px var(--primary-glow-sm)";
        }}
        onBlur={(e) => {
          e.target.style.borderColor = "var(--border-default)";
          e.target.style.boxShadow = "none";
        }}
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors duration-150
                     hover:text-[var(--on-surface)]"
          style={{ color: "var(--on-surface-muted)" }}
        >
          <X size={13} />
        </button>
      )}
    </div>
  );
}

/* ── Table ───────────────────────────────────────────────────────────────── */
export function Table({ columns = [], rows = [], onRowClick, emptyState = null, stickyHeader = true }) {
  if (!rows.length && emptyState) return emptyState;

  return (
    <div className="overflow-x-auto overflow-hidden rounded-xl" style={{ border: "1px solid var(--border-hairline)" }}>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr
            className={stickyHeader ? "sticky top-0 z-10" : ""}
            style={{ background: "var(--surface-high)", borderBottom: "1px solid var(--border-hairline)" }}
          >
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-4 py-3 whitespace-nowrap text-[10px] font-bold uppercase tracking-widest"
                style={{ color: "var(--on-surface-muted)", fontFamily: "var(--font-body)", width: col.width }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr
              key={row.id ?? ri}
              onClick={() => onRowClick?.(row)}
              className={`transition-all duration-150 ${onRowClick ? "cursor-pointer" : ""} row-hover`}
              style={{ borderBottom: "0.5px solid var(--border-hairline)" }}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className="px-4 py-3 whitespace-nowrap text-[12px]"
                  style={{ color: "var(--on-surface)", fontFamily: "var(--font-body)" }}
                >
                  {col.render ? col.render(row[col.key], row) : row[col.key] ?? "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}