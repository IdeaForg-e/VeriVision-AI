// Common components: Badge, Button, EmptyState, Loader, Modal, Pagination, SearchBar, Table
import { Loader2, Search, X, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef } from "react";

export function Badge({ status }) {
  const styles = {
    QUARANTINE: "bg-red-100 text-red-700 border-red-200",
    "PENDING QA": "bg-yellow-100 text-yellow-700 border-yellow-200",
    "AUTO-APPROVED": "bg-green-100 text-green-700 border-green-200",
    "RETAKE REQUESTED": "bg-blue-100 text-blue-700 border-blue-200",
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${styles[status] || "bg-gray-100 text-gray-700 border-gray-200"}`}>
      {status}
    </span>
  );
}

export function Button({ children, onClick, type = "button", variant = "primary", size = "md", disabled = false, loading = false, icon, className = "" }) {
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 border border-blue-600",
    secondary: "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100",
    danger: "bg-red-600 text-white hover:bg-red-700 border border-red-600",
    success: "bg-green-600 text-white hover:bg-green-700 border border-green-600",
    ghost: "bg-transparent text-gray-700 hover:bg-gray-100",
  };

  const sizes = { sm: "px-3 py-2 text-sm", md: "px-4 py-2 text-sm", lg: "px-6 py-3 text-base" };

  return (
    <button type={type} onClick={onClick} disabled={disabled || loading} className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}>
      {loading ? <Loader2 size={16} className="animate-spin" /> : icon}
      {children}
    </button>
  );
}

export function EmptyState({ icon = "inbox", title = "Nothing here yet", description = "There are no items to display.", action = null }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
      <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center">
        <span className="material-symbols-outlined text-4xl text-on-surface-variant">{icon}</span>
      </div>
      <div>
        <p className="font-headline-sm text-headline-sm text-on-surface">{title}</p>
        <p className="text-body-md text-on-surface-variant mt-1 max-w-sm mx-auto">{description}</p>
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function Loader({ fullPage = false, size = "md", label = "Loading…" }) {
  const sizes = { sm: "w-5 h-5 border-2", md: "w-9 h-9 border-[3px]", lg: "w-14 h-14 border-4" };

  const spinner = (
    <div className="flex flex-col items-center gap-3">
      <div className={`${sizes[size] ?? sizes.md} rounded-full border-primary/20 border-t-primary animate-spin`} />
      {label && <span className="text-body-sm text-on-surface-variant animate-pulse">{label}</span>}
    </div>
  );

  if (fullPage) {
    return <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">{spinner}</div>;
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
    <div ref={overlayRef} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={(e) => { if (e.target === overlayRef.current) onClose?.(); }} role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className={`${sizes[size] ?? sizes.md} w-full bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-slide-up`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant flex-shrink-0">
          <h2 id="modal-title" className="font-headline-sm text-headline-sm text-on-surface">{title}</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-surface-container transition-colors" aria-label="Close modal">
            <span className="material-symbols-outlined text-on-surface-variant">close</span>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="flex-shrink-0 px-6 py-4 border-t border-outline-variant flex justify-end gap-3">{footer}</div>}
      </div>
    </div>
  );
}

export function Pagination({ currentPage, totalPages, totalItems, pageSize, onPageChange }) {
  const start = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex flex-col md:flex-row justify-between items-center gap-4 px-6 py-4 border-t bg-white">
      <p className="text-sm text-gray-500">
        Showing <span className="font-semibold text-gray-700 mx-1">{start}-{end}</span> of <span className="font-semibold text-gray-700 mx-1">{totalItems}</span> cases
      </p>
      <div className="flex items-center gap-2">
        <button disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)} className="flex items-center justify-center w-9 h-9 rounded-lg border hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed">
          <ChevronLeft size={18} />
        </button>
        {Array.from({ length: totalPages }, (_, index) => (
          <button key={index} onClick={() => onPageChange(index + 1)} className={`w-9 h-9 rounded-lg text-sm font-medium transition ${currentPage === index + 1 ? "bg-blue-600 text-white" : "border hover:bg-gray-100"}`}>
            {index + 1}
          </button>
        ))}
        <button disabled={currentPage === totalPages} onClick={() => onPageChange(currentPage + 1)} className="flex items-center justify-center w-9 h-9 rounded-lg border hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed">
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}

export function SearchBar({ value, onChange, placeholder = "Search..." }) {
  return (
    <div className="relative w-full">
      <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-11 pr-10 text-sm text-gray-700 placeholder:text-gray-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
      {value && (
        <button onClick={() => onChange("")} className="absolute right-3 top-1/2 -translate-y-1/2">
          <X size={16} className="text-gray-400 hover:text-gray-700" />
        </button>
      )}
    </div>
  );
}

export function Table({ columns = [], rows = [], onRowClick, emptyState = null, stickyHeader = true }) {
  if (!rows.length && emptyState) return emptyState;

  return (
    <div className="overflow-x-auto rounded-xl border border-outline-variant shadow-sm bg-white">
      <table className="w-full text-body-sm text-on-surface border-collapse">
        <thead>
          <tr className={`${stickyHeader ? "sticky top-0 z-10" : ""} bg-surface-container-low`}>
            {columns.map((col) => (
              <th key={col.key} className="px-4 py-3 text-left font-label-caps text-on-surface-variant uppercase tracking-wider whitespace-nowrap border-b border-outline-variant" style={{ width: col.width }}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={row.id ?? ri} onClick={() => onRowClick?.(row)} className={`border-b border-outline-variant last:border-0 transition-colors ${onRowClick ? "cursor-pointer hover:bg-primary/5" : ""}`}>
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