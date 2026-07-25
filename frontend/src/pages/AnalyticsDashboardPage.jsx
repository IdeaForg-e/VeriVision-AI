import { useState, useEffect } from "react";
import { Layout } from "../components/Layout.jsx";
import { getTriageStats, getTriageQueue } from "../services/triageService.js";
import { getCases } from "../services/caseService.js";
import {
  getVendorAnalytics,
  getVendorDetail,
  getSiteAnalytics,
  getRepeatOffenders,
  getMonthlyTrend,
} from "../services/analyticsService.js";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  AlertTriangle,
  Activity,
  Database,
  Layers,
  Eye,
  Download,
  RefreshCw,
  ShieldAlert,
  X,
} from "lucide-react";
import { Button, Loader, Badge } from "../components/Common.jsx";

const cardStyle = {
  background: "var(--glass-bg)",
  backdropFilter: "var(--glass-blur)",
  WebkitBackdropFilter: "var(--glass-blur)",
  border: "1px solid var(--border-hairline)",
  borderTopColor: "var(--border-light-top)",
  borderRadius: "var(--radius-lg)",
  boxShadow: "var(--glass-shadow-sm), var(--glass-inset)",
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div
        className="p-3.5 space-y-1.5"
        style={{
          background: "var(--surface-high)",
          border: "1px solid var(--border-strong)",
          borderRadius: "var(--radius-md)",
          boxShadow: "var(--glass-shadow-sm)",
          fontFamily: "var(--font-mono)",
          fontSize: "11px",
        }}
      >
        <p className="font-bold uppercase" style={{ color: "var(--on-surface)" }}>{label}</p>
        {payload.map((p, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
            <span style={{ color: "var(--on-surface-muted)" }}>{p.name}:</span>
            <span className="font-bold" style={{ color: "var(--on-surface)" }}>{p.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

function StatCard({ label, value, icon: Icon, color = "sky", sublabel }) {
  const themeColors = {
    sky: {
      text: "var(--primary)",
      bg: "var(--primary-glow-sm)",
    },
    rose: {
      text: "var(--urgent)",
      bg: "var(--urgent-surface)",
    },
    amber: {
      text: "var(--warning)",
      bg: "var(--warning-surface)",
    },
    emerald: {
      text: "var(--success)",
      bg: "var(--success-surface)",
    },
  }[color] || { text: "var(--primary)", bg: "var(--primary-glow-sm)" };

  return (
    <div className="p-4.5 flex flex-col justify-between" style={cardStyle}>
      <div className="flex items-start justify-between">
        <div>
          <p
            className="text-[9px] font-bold uppercase tracking-widest"
            style={{ fontFamily: "var(--font-body)", color: "var(--on-surface-muted)" }}
          >
            {label}
          </p>
          <h3
            className="text-2xl font-light mt-1.5"
            style={{
              fontFamily: "var(--font-headline)",
              color: themeColors.text,
              letterSpacing: "-0.02em",
            }}
          >
            {value}
          </h3>
        </div>
        <div
          className="p-2.5 rounded-xl flex items-center justify-center"
          style={{ background: themeColors.bg }}
        >
          <Icon size={16} style={{ color: themeColors.text }} />
        </div>
      </div>
      {sublabel && (
        <p
          className="text-[9px] font-mono mt-3.5 pt-2 border-t"
          style={{
            borderColor: "var(--border-hairline)",
            color: "var(--on-surface-muted)",
          }}
        >
          {sublabel}
        </p>
      )}
    </div>
  );
}

function ChartCard({ title, icon: Icon, children, badge }) {
  return (
    <div className="p-5 space-y-4" style={cardStyle}>
      <div
        className="flex items-center justify-between pb-3"
        style={{ borderBottom: "1px solid var(--border-hairline)" }}
      >
        <div className="flex items-center gap-2.5">
          <Icon size={14} style={{ color: "var(--primary)" }} />
          <h2
            className="text-[11px] font-bold uppercase tracking-wider"
            style={{ fontFamily: "var(--font-headline)", color: "var(--on-surface)" }}
          >
            {title}
          </h2>
        </div>
        {badge && (
          <span
            className="font-mono text-[9px] font-bold px-2 py-0.5 rounded"
            style={{
              background: "var(--primary-glow-sm)",
              border: "1px solid rgba(0,125,184,0.20)",
              color: "var(--primary)",
            }}
          >
            {badge}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

export default function AnalyticsDashboardPage() {
  const [queueItems, setQueueItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const [vendors, setVendors] = useState([]);
  const [sites, setSites] = useState([]);
  const [repeatOffenders, setRepeatOffenders] = useState([]);
  const [monthlyTrend, setMonthlyTrend] = useState([]);

  const [selectedVendor, setSelectedVendor] = useState(null);
  const [vendorDetailLoading, setVendorDetailLoading] = useState(false);
  const [vendorDetails, setVendorDetails] = useState(null);

  const [selectedSite, setSelectedSite] = useState(null);
  const [siteDetails, setSiteDetails] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [
        queueResult,
        statsData,
        casesData,
        vendorData,
        siteData,
        offendersData,
        trendData,
      ] = await Promise.all([
        getTriageQueue({ page: 1, pageSize: 1000, filters: {} }),
        getTriageStats(),
        getCases(),
        getVendorAnalytics(),
        getSiteAnalytics(),
        getRepeatOffenders(),
        getMonthlyTrend(),
      ]);
      setQueueItems(Array.isArray(queueResult?.items) ? queueResult.items : []);
      setStats(statsData);
      setVendors(vendorData || []);
      setSites(siteData || []);
      setRepeatOffenders(offendersData || []);
      setMonthlyTrend(trendData || []);
    } catch (err) {
      console.error("Failed to load analytics data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleVendorClick = async (vendorName) => {
    if (selectedVendor === vendorName) {
      setSelectedVendor(null);
      setVendorDetails(null);
      return;
    }
    setSelectedVendor(vendorName);
    setVendorDetailLoading(true);
    try {
      const detail = await getVendorDetail(vendorName);
      setVendorDetails(detail);
    } catch (err) {
      console.error("Failed to load vendor detail:", err);
    } finally {
      setVendorDetailLoading(false);
    }
  };

  const handleSiteClick = (siteName, fraudCases) => {
    if (selectedSite === siteName) {
      setSelectedSite(null);
      setSiteDetails(null);
      return;
    }
    setSelectedSite(siteName);
    setSiteDetails({ site: siteName, fraud_cases: fraudCases });
  };

  const exportToCSV = () => {
    if (!queueItems.length) {
      alert("No data available to export.");
      return;
    }

    const headers = [
      "Case ID",
      "Part Number",
      "Commodity",
      "Capture Site",
      "Risk Score",
      "Status",
      "Reason",
      "Confidence",
      "Recommended Action",
      "Timestamp",
    ];

    const rows = queueItems.map((item) => [
      item.caseId || "",
      item.partNumber || "",
      item.commodity || "",
      item.captureSite || "",
      item.riskScore || 0,
      item.status || "",
      item.reason || "",
      item.confidence || 0,
      item.recommendedAction || "",
      item.createdAt || "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `verivision_analytics_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const fraudDist = { clean: 0, tampered: 0, missing: 0, mismatched: 0, reused: 0, pending: 0 };
  queueItems.forEach((item) => {
    const reason = item.reason?.toLowerCase() || "";
    if (reason.includes("clean") || reason.includes("passed")) fraudDist.clean++;
    else if (reason.includes("tamper")) fraudDist.tampered++;
    else if (reason.includes("miss")) fraudDist.missing++;
    else if (reason.includes("mismatch")) fraudDist.mismatched++;
    else if (reason.includes("reuse")) fraudDist.reused++;
    else fraudDist.pending++;
  });

  const totalCases = queueItems.length;
  const fraudCases = fraudDist.tampered + fraudDist.missing + fraudDist.mismatched + fraudDist.reused;
  const fraudRate = totalCases > 0 ? ((fraudCases / totalCases) * 100).toFixed(1) : "0.0";

  if (loading) {
    return (
      <Layout title="Fraud Analytics Dashboard" subtitle="Real-time audit intelligence from inspection records">
        <Loader label="Computing vendor & site risk metrics…" />
      </Layout>
    );
  }

  return (
    <Layout
      title="Fraud Analytics Dashboard"
      subtitle="Real-time audit intelligence across all inspection cases & vendor supply chains"
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchData} icon={<RefreshCw size={13} />}>
            Refresh
          </Button>
          <Button variant="primary" size="sm" onClick={exportToCSV} icon={<Download size={13} />}>
            Export CSV
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Cases Inspected" value={totalCases} icon={Layers} color="sky" sublabel={`${stats?.autoApproved || 0} auto-approved`} />
          <StatCard label="Fraud Incidents" value={fraudCases} icon={AlertTriangle} color="rose" sublabel="Requires investigation" />
          <StatCard label="Fraud Detection Rate" value={`${fraudRate}%`} icon={TrendingUp} color="amber" sublabel="Of total inspections" />
          <StatCard label="Pending QA Review" value={stats?.pendingReview || 0} icon={Activity} color="emerald" sublabel="Awaiting human sign-off" />
        </div>

        {/* 2 Column Canvas */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (col-span-8) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Vendor Table */}
            <div className="overflow-hidden" style={cardStyle}>
              <div
                className="px-5 py-3.5 flex items-center justify-between"
                style={{ borderBottom: "1px solid var(--border-hairline)", background: "rgba(0,0,0,0.15)" }}
              >
                <div className="flex items-center gap-2">
                  <Database size={14} style={{ color: "var(--primary)" }} />
                  <h2
                    className="text-[11px] font-bold uppercase tracking-wider"
                    style={{ fontFamily: "var(--font-headline)", color: "var(--on-surface)" }}
                  >
                    Vendor Performance & Risk Overview
                  </h2>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr
                      className="border-b text-[9px] font-bold uppercase tracking-wider"
                      style={{
                        background: "rgba(0,0,0,0.20)",
                        borderColor: "var(--border-hairline)",
                        color: "var(--on-surface-muted)",
                      }}
                    >
                      <th className="px-4 py-3 font-semibold">Vendor</th>
                      <th className="px-4 py-3 text-center font-semibold">Supplied Units</th>
                      <th className="px-4 py-3 text-center font-semibold">Fraud Cases</th>
                      <th className="px-4 py-3 text-right font-semibold">Fraud Rate</th>
                      <th className="px-4 py-3 text-center font-semibold">Trust Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-mono text-[11px]"
                         style={{ color: "var(--on-surface-variant)" }}>
                    {vendors.map((vendor, i) => (
                      <tr
                        key={i}
                        onClick={() => handleVendorClick(vendor.vendor)}
                        className="hover:bg-slate-100/50 dark:hover:bg-slate-800/40 transition cursor-pointer"
                        style={{ borderBottom: "1px solid var(--border-hairline)" }}
                      >
                        <td className="px-4 py-3 font-semibold" style={{ color: "var(--on-surface)" }}>
                          {vendor.vendor}
                        </td>
                        <td className="px-4 py-3 text-center">{vendor.components_supplied}</td>
                        <td className="px-4 py-3 text-center font-bold" style={{ color: "var(--urgent)" }}>{vendor.fraud_cases}</td>
                        <td className="px-4 py-3 text-right font-bold">
                          <span style={{ color: parseFloat(vendor.fraud_rate) > 10 ? "var(--urgent)" : "var(--success)" }}>
                            {vendor.fraud_rate}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">{vendor.trust_score}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Site Table */}
            <div className="overflow-hidden" style={cardStyle}>
              <div
                className="px-5 py-3.5 flex items-center justify-between"
                style={{ borderBottom: "1px solid var(--border-hairline)", background: "rgba(0,0,0,0.15)" }}
              >
                <div className="flex items-center gap-2">
                  <Activity size={14} style={{ color: "var(--primary)" }} />
                  <h2
                    className="text-[11px] font-bold uppercase tracking-wider"
                    style={{ fontFamily: "var(--font-headline)", color: "var(--on-surface)" }}
                  >
                    Capture Site Anomaly Breakdown
                  </h2>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr
                      className="border-b text-[9px] font-bold uppercase tracking-wider"
                      style={{
                        background: "rgba(0,0,0,0.20)",
                        borderColor: "var(--border-hairline)",
                        color: "var(--on-surface-muted)",
                      }}
                    >
                      <th className="px-4 py-3 font-semibold">Site Location</th>
                      <th className="px-4 py-3 text-center font-semibold">Inspections</th>
                      <th className="px-4 py-3 text-center font-semibold">Fraud Cases</th>
                      <th className="px-4 py-3 text-right font-semibold">Fraud Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-mono text-[11px]"
                         style={{ color: "var(--on-surface-variant)" }}>
                    {sites.map((site, i) => (
                      <tr
                        key={i}
                        onClick={() => handleSiteClick(site.site, site.fraud_cases)}
                        className="hover:bg-slate-100/50 dark:hover:bg-slate-800/40 transition cursor-pointer"
                        style={{ borderBottom: "1px solid var(--border-hairline)" }}
                      >
                        <td className="px-4 py-3 font-semibold" style={{ color: "var(--on-surface)" }}>
                          {site.site}
                        </td>
                        <td className="px-4 py-3 text-center">{site.inspections}</td>
                        <td className="px-4 py-3 text-center font-bold" style={{ color: "var(--urgent)" }}>{site.fraud_cases}</td>
                        <td className="px-4 py-3 text-right font-bold">
                          <span style={{ color: parseFloat(site.fraud_rate) > 5 ? "var(--urgent)" : "var(--success)" }}>
                            {site.fraud_rate}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recharts Chart */}
            <ChartCard title="Month-on-Month Compliance & Fraud Trend" icon={TrendingUp} badge="Audit Timeline">
              {monthlyTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={monthlyTrend} barGap={4} barCategoryGap="30%">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.08)" />
                    <XAxis dataKey="month" stroke="var(--on-surface-muted)" fontSize={10} />
                    <YAxis stroke="var(--on-surface-muted)" fontSize={10} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: "10px", fontFamily: "var(--font-body)" }} />
                    <Bar dataKey="total_inspections" fill="var(--primary-container)" name="Total Ingested" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="fraud_cases" fill="var(--urgent)" name="Fraud Cases" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="py-12 text-center text-xs" style={{ color: "var(--on-surface-muted)" }}>
                  No monthly timeline data recorded.
                </div>
              )}
            </ChartCard>
          </div>

          {/* Right Column (col-span-4) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Risk Alerts */}
            {repeatOffenders.length > 0 && (
              <div className="space-y-2">
                <p
                  className="text-[9px] font-bold uppercase tracking-widest pl-1"
                  style={{ fontFamily: "var(--font-body)", color: "var(--on-surface-muted)" }}
                >
                  High Risk Watchlist Flags
                </p>
                {repeatOffenders.map((offender) => (
                  <div
                    key={offender.vendor}
                    className="p-3.5 space-y-1 transition-all duration-150"
                    style={{
                      ...cardStyle,
                      borderLeft: "3px solid var(--urgent)",
                    }}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold" style={{ color: "var(--urgent)" }}>
                      <ShieldAlert size={14} />
                      <span className="uppercase tracking-wider">{offender.status}</span>
                    </div>
                    <p className="text-[11px] leading-normal"
                       style={{ fontFamily: "var(--font-body)", color: "var(--on-surface-variant)" }}>
                      Vendor <strong style={{ color: "var(--on-surface)" }}>{offender.vendor}</strong> logged{" "}
                      <strong style={{ color: "var(--urgent)" }}>{offender.fraud_cases} fraud cases</strong> in {offender.days_window} days.
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Recent Outcomes List */}
            <div className="overflow-hidden" style={cardStyle}>
              <div
                className="px-4 py-3 flex items-center justify-between"
                style={{ borderBottom: "1px solid var(--border-hairline)", background: "rgba(0,0,0,0.15)" }}
              >
                <h2
                  className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-2"
                  style={{ fontFamily: "var(--font-headline)", color: "var(--on-surface)" }}
                >
                  <Eye size={13} style={{ color: "var(--primary)" }} /> Recent Case Verdicts
                </h2>
                <span className="font-mono text-[9px]" style={{ color: "var(--on-surface-muted)" }}>
                  {queueItems.length} CASES
                </span>
              </div>
              <div className="divide-y divide-slate-200 dark:divide-slate-800/60 max-h-[500px] overflow-y-auto pr-1">
                {queueItems.slice(0, 10).map((item, i) => (
                  <div key={item.id || i} className="p-3.5 text-xs space-y-1.5"
                       style={{ borderBottom: "1px solid var(--border-hairline)" }}>
                    <div className="flex justify-between items-center font-mono">
                      <span className="font-bold" style={{ color: "var(--on-surface)" }}>
                        {item.caseId?.slice(0, 12)}
                      </span>
                      <Badge status={item.status} size="sm" />
                    </div>
                    <div className="flex justify-between text-[10px] font-mono"
                         style={{ color: "var(--on-surface-muted)" }}>
                      <span>{item.partNumber}</span>
                      <span className="font-bold" style={{ color: "var(--urgent)" }}>
                        Risk: {item.riskScore}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Vendor Detail Modal */}
      {selectedVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="p-5 max-w-md w-full space-y-4 animate-slide-up" style={cardStyle}>
            <div
              className="flex justify-between items-center pb-2.5"
              style={{ borderBottom: "1px solid var(--border-hairline)" }}
            >
              <h3
                className="text-[11px] font-bold font-mono uppercase"
                style={{ color: "var(--on-surface)" }}
              >
                Vendor Audit: {selectedVendor}
              </h3>
              <button
                onClick={() => setSelectedVendor(null)}
                style={{ color: "var(--on-surface-muted)" }}
                className="hover:text-slate-600 dark:hover:text-slate-400 transition"
              >
                <X size={15} />
              </button>
            </div>
            {vendorDetailLoading ? (
              <Loader label="Fetching vendor logs…" />
            ) : vendorDetails ? (
              <div className="space-y-3.5 text-[11px] font-mono">
                <div
                  className="p-3.5 rounded-xl space-y-2"
                  style={{
                    background: "rgba(0,0,0,0.15)",
                    border: "1px solid var(--border-default)",
                  }}
                >
                  <p className="font-bold uppercase" style={{ color: "var(--on-surface)" }}>
                    Supplied Parts Summary
                  </p>
                  <ul className="list-disc pl-4 space-y-1" style={{ color: "var(--on-surface-muted)" }}>
                    {vendorDetails.fraud_components.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                    {vendorDetails.fraud_components.length === 0 && <li>No fraud components recorded.</li>}
                  </ul>
                </div>
              </div>
            ) : (
              <p className="text-xs italic text-center py-4" style={{ color: "var(--on-surface-muted)" }}>
                Failed to load vendor details.
              </p>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}