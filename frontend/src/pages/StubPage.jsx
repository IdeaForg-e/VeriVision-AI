import { Layout } from "../components/Layout.jsx";
import { Construction } from "lucide-react";

export default function StubPage({ title }) {
  return (
    <Layout title={title} subtitle="Module status">
      <div className="flex flex-col items-center justify-center py-20 text-center gap-2 text-slate-500">
        <Construction size={32} />
        <p className="text-xs font-bold font-mono">{title} — Under Development</p>
      </div>
    </Layout>
  );
}
