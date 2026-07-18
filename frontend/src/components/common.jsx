// Common components: Badge, Button, EmptyState, Loader, Modal, Pagination, SearchBar, Table
import { Loader2, Search, X, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef } from "react";

export function Badge({ status }) {
  const styles = {
    QUARANTINE: "bg-red-500/10 text-red-400 border-red-500/25",
    "PENDING QA": "bg-amber-500/10 text-amber-400 border-amber-500/25",
    "AUTO-APPROVED": "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
    "RETAKE REQUESTED": "bg-cyan-500/10 text-cyan-400 border-cyan-500/25",
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border font-tech-code tracking-wide ${styles[status] || "bg-slate-800 text-slate-300 border-slate-700"}`}>
      {status}
    </span>
  );
}

export function Button({ children, onClick, type = "button", variant = "primary", size = "md", disabled = false, loading = false, icon, className = "" }) {
  const variants = {
    primary: "bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-none hover:opacity-90 shadow-[0_0_12px_rgba(6,182,212,0.15)] hover:shadow-[0_0_18px_rgba(6,182,212,0.3)]",
    secondary: "bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800 hover:text-white",
    danger: "bg-red-950/40 text-red-400 border border-red-500/30 hover:bg-red-900/40 hover:text-red-300",
    success: "bg-emerald-950/40 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-900/40 hover:text-emerald-300",
    ghost: "bg-transparent text-slate-400 hover:bg-slate-900 hover:text-slate-200",
  };

  const sizes = { sm: "px-3 py-2 text-sm", md: "px-4 py-2 text-sm", lg: "px-6 py-3 text-base" };

  return (
    <button type={type} onClick={onClick} disabled={disabled || loading} className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}>
      {loading ? <Loader2 size={16} className="animate-spin" /> : icon}
      {children}
    </button>
  );
}

export function EmptyState({ icon = "inbox", title = "Nothing here yet", description = "There are no items to display.", action = null }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
      <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center">
        <span className="material-symbols-outlined text-4xl text-slate-400">{icon}</span>
      </div>
      <div>
        <p className="font-headline-sm text-headline-sm text-slate-200">{title}</p>
        <p className="text-body-md text-slate-450 mt-1 max-w-sm mx-auto">{description}</p>
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function Loader({ fullPage = false, size = "md", label = "Loading…" }) {
  const sizes = { sm: "w-5 h-5 border-2", md: "w-9 h-9 border-[3px]", lg: "w-14 h-14 border-4" };

  const spinner = (
    <div className="flex flex-col items-center gap-3">
      <div className={`${sizes[size] ?? sizes.md} rounded-full border-cyan-500/20 border-t-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.1)] animate-spin`} />
      {label && <span className="text-body-sm text-cyan-400 font-medium animate-pulse">{label}</span>}
    </div>
  );

  if (fullPage) {
    return <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#070a13]/85 backdrop-blur-sm">{spinner}</div>;
  }

  return <div className="flex items-center justify-center py-12">{spinner}</div>;
}

export function Modal({ open = false, onClose, title, children, footer, size = "md" }) {
  const overlayRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => { if (e.key === "Escape") onClose?.(); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  const sizes = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl" };

  return (
    <div ref={overlayRef} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in" onClick={(e) => { if (e.target === overlayRef.current) onClose?.(); }} role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className={`${sizes[size] ?? sizes.md} w-full cyber-card bg-[#0f172a]/95 border-slate-800 flex flex-col max-h-[90vh] animate-slide-up`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 flex-shrink-0">
          <h2 id="modal-title" className="font-headline-sm text-headline-sm text-slate-100">{title}</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors" aria-label="Close modal">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 text-slate-300">{children}</div>
        {footer && <div className="flex-shrink-0 px-6 py-4 border-t border-slate-800 flex justify-end gap-3">{footer}</div>}
      </div>
    </div>
  );
}

export function Pagination({ currentPage, totalPages, totalItems, pageSize, onPageChange }) {
  const start = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex flex-col md:flex-row justify-between items-center gap-4 px-6 py-4 border-t border-slate-800 bg-[#0a0f1d]/50 rounded-b-xl">
      <p className="text-sm text-slate-400">
        Showing <span className="font-tech-code text-cyan-400 mx-1">{start}-{end}</span> of <span className="font-tech-code text-cyan-400 mx-1">{totalItems}</span> cases
      </p>
      <div className="flex items-center gap-2">
        <button disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)} className="flex items-center justify-center w-9 h-9 rounded-lg border border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed">
          <ChevronLeft size={18} />
        </button>
        {Array.from({ length: totalPages }, (_, index) => (
          <button key={index} onClick={() => onPageChange(index + 1)} className={`w-9 h-9 rounded-lg text-sm font-medium transition ${currentPage === index + 1 ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.1)]" : "border border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white"}`}>
            {index + 1}
          </button>
        ))}
        <button disabled={currentPage === totalPages} onClick={() => onPageChange(currentPage + 1)} className="flex items-center justify-center w-9 h-9 rounded-lg border border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed">
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}

export function SearchBar({ value, onChange, placeholder = "Search..." }) {
  return (
    <div className="relative w-full">
      <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full py-3 pl-11 pr-10 text-sm rounded-xl placeholder:text-slate-500 cyber-input" />
      {value && (
        <button onClick={() => onChange("")} className="absolute right-3 top-1/2 -translate-y-1/2">
          <X size={16} className="text-slate-500 hover:text-white" />
        </button>
      )}
    </div>
  );
}

export function Table({ columns = [], rows = [], onRowClick, emptyState = null, stickyHeader = true }) {
  if (!rows.length && emptyState) return emptyState;

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-850 shadow-lg bg-[#0e1424]/40 backdrop-blur-md">
      <table className="w-full text-body-sm text-slate-350 border-collapse">
        <thead>
          <tr className={`${stickyHeader ? "sticky top-0 z-10" : ""} bg-[#0a0f1d]`}>
            {columns.map((col) => (
              <th key={col.key} className="px-4 py-3 text-left font-label-caps text-slate-400 uppercase tracking-wider whitespace-nowrap border-b border-slate-800" style={{ width: col.width }}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={row.id ?? ri} onClick={() => onRowClick?.(row)} className={`border-b border-slate-850 last:border-0 transition-colors ${onRowClick ? "cursor-pointer hover:bg-cyan-500/5" : ""}`}>
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 whitespace-nowrap">
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