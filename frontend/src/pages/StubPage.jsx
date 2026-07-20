import { Layout } from "../components/Layout.jsx";

/** Placeholder for pages owned by Jagruti / joint Case Detail work, so nav links don't 404 during local dev. */
export default function StubPage({ title }) {
  return (
    <Layout>
      <div className="flex flex-col items-center justify-center h-64 text-on-surface-variant gap-2">
        <span className="material-symbols-outlined text-4xl">construction</span>
        <p>{title} — not part of this build.</p>
      </div>
    </Layout>
  );
}
