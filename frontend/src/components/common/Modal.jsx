// Modal.jsx — Accessible dialog overlay with header, body, and footer slots
import { useEffect, useRef } from "react";

export default function Modal({
  open = false,
  onClose,
  title,
  children,
  footer,
  size = "md",
}) {
  const overlayRef = useRef(null);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  const sizes = {
    sm: "max-w-sm",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose?.();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className={`${sizes[size] ?? sizes.md} w-full bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-slide-up`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant flex-shrink-0">
          <h2
            id="modal-title"
            className="font-headline-sm text-headline-sm text-on-surface"
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-surface-container transition-colors"
            aria-label="Close modal"
          >
            <span className="material-symbols-outlined text-on-surface-variant">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="flex-shrink-0 px-6 py-4 border-t border-outline-variant flex justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}