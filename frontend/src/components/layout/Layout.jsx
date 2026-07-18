/**
 * App shell Layout.
 * Accepts an optional `title` and `subtitle` for pages that want the
 * TopNavigation bar to display their heading (instead of the auto-breadcrumb).
 * The `children` slot is rendered inside a centred, padded <main>.
 */
import Header from "./Header.jsx";

export default function Layout({ children, title, subtitle }) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      {/* Optional page-level heading below the header */}
      {(title || subtitle) && (
        <div className="max-w-[1440px] mx-auto px-6 pt-6">
          {title && (
            <h1 className="font-headline-lg text-headline-lg text-on-surface">{title}</h1>
          )}
          {subtitle && (
            <p className="text-on-surface-variant text-body-md mt-1">{subtitle}</p>
          )}
        </div>
      )}
      <main className="max-w-[1440px] mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
