// AnalyticsDashboardPage.jsx — Pure backend data, zero mock/simulation data
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
    getMonthlyBreakdown
} from "../services/analyticsService.js";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, AreaChart, Area
} from "recharts";
import {
    TrendingUp, AlertTriangle, CheckCircle, Activity, BarChart3,
    PieChart as PieChartIcon, Database, Layers, Eye, Download, RefreshCw,
    Truck, Cpu, FileText, Sliders, ChevronDown, ChevronUp, Calendar, ShieldAlert
} from "lucide-react";

const COLORS = ["#10b981", "#ef4444", "#f59e0b", "#8b5cf6", "#3b82f6", "#64748b"];

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 shadow-2xl backdrop-blur-md">
                <p className="text-xs font-bold text-slate-300 mb-2">{label}</p>
                {payload.map((p, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                        <span className="text-slate-400">{p.name}:</span>
                        <span className="font-bold text-slate-200">{p.value}</span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

const getCategoryIcon = (category) => {
    const name = category?.toLowerCase() || "";
    if (name.includes("motherboard") || name.includes("pcb")) return <Database className="text-cyan-400" size={14} />;
    if (name.includes("cpu") || name.includes("processor") || name.includes("microchip")) return <Cpu className="text-purple-400" size={14} />;
    if (name.includes("label") || name.includes("sticker")) return <FileText className="text-emerald-400" size={14} />;
    return <Sliders className="text-blue-400" size={14} />;
};

function StatCard({ label, value, icon: Icon, color, sublabel }) {
    return (
        <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-800/50 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative bg-[#0f172a]/45 border border-slate-800/80 p-5 rounded-xl hover:border-slate-700/60 transition-all duration-300">
                <div className="absolute top-0 left-4 right-4 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
                <div className="flex items-start justify-between">
                    <div className="space-y-1.5">
                        <p className="text-[10px] uppercase tracking-[0.15em] text-slate-500 font-semibold">{label}</p>
                        <h3 className="text-2xl font-extrabold tracking-tight text-slate-100 font-tech-code">{value}</h3>
                        {sublabel && (
                            <p className="text-[11px] text-slate-500 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                                {sublabel}
                            </p>
                        )}
                    </div>
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center border transition-all duration-300 ${color === 'cyan' ? 'bg-cyan-950/20 border-cyan-500/20 text-cyan-400 group-hover:shadow-[0_0_15px_rgba(6,182,212,0.15)]' : ''} ${color === 'red' ? 'bg-red-950/20 border-red-500/20 text-red-400' : ''} ${color === 'amber' ? 'bg-amber-950/20 border-amber-500/20 text-amber-400' : ''} ${color === 'emerald' ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-400 group-hover:shadow-[0_0_15px_rgba(16,185,129,0.15)]' : ''}`}>
                        <Icon size={20} />
                    </div>
                </div>
            </div>
        </div>
    );
}

function ChartCard({ title, icon: Icon, iconColor, children, badge, badgeColor }) {
    return (
        <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/5 to-purple-500/5 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative bg-[#0f172a]/55 border border-slate-800/80 p-6 rounded-xl shadow-lg">
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2.5">
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center border ${iconColor}`}>
                            <Icon size={16} />
                        </div>
                        <div>
                            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-200">{title}</h2>
                        </div>
                    </div>
                    {badge && (
                        <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full border ${badgeColor || 'bg-slate-900 border-slate-800 text-slate-500'}`}>
                            {badge}
                        </span>
                    )}
                </div>
                {children}
            </div>
        </div>
    );
}

export default function AnalyticsDashboardPage() {
    const [queueItems, setQueueItems] = useState([]);
    const [cases, setCases] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    // New backend data states
    const [vendors, setVendors] = useState([]);
    const [sites, setSites] = useState([]);
    const [repeatOffenders, setRepeatOffenders] = useState([]);
    const [monthlyTrend, setMonthlyTrend] = useState([]);
    const [monthlyBreakdown, setMonthlyBreakdown] = useState([]);

    // Interactive selected vendor details state
    const [selectedVendor, setSelectedVendor] = useState(null);
    const [vendorDetailLoading, setVendorDetailLoading] = useState(false);
    const [vendorDetails, setVendorDetails] = useState(null);

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
                breakdownData
            ] = await Promise.all([
                getTriageQueue({ page: 1, pageSize: 1000, filters: {} }),
                getTriageStats(),
                getCases(),
                getVendorAnalytics(),
                getSiteAnalytics(),
                getRepeatOffenders(),
                getMonthlyTrend(),
                getMonthlyBreakdown()
            ]);
            setQueueItems(Array.isArray(queueResult?.items) ? queueResult.items : []);
            setCases(casesData || []);
            setStats(statsData);
            setVendors(vendorData || []);
            setSites(siteData || []);
            setRepeatOffenders(offendersData || []);
            setMonthlyTrend(trendData || []);
            setMonthlyBreakdown(breakdownData || []);
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

    // CSV Export function — downloads current queue data as .csv file
    const exportToCSV = () => {
        if (!queueItems.length) {
            alert("No data available to export.");
            return;
        }

        const headers = [
            "Case ID", "Part Number", "Commodity", "Capture Site",
            "Risk Score", "Status", "Reason", "Confidence",
            "Recommended Action", "Timestamp"
        ];

        const rows = queueItems.map(item => [
            item.caseId || "",
            item.partNumber || "",
            item.commodity || "",
            item.captureSite || "",
            item.riskScore || 0,
            item.status || "",
            item.reason || "",
            item.confidence || 0,
            item.recommendedAction || "",
            item.createdAt || ""
        ]);

        const csvContent = [
            headers.join(","),
            ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
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

    // --- ALL DATA DERIVED FROM BACKEND ONLY ---

    // Fraud distribution from queue items
    const fraudDist = { clean: 0, tampered: 0, missing: 0, mismatched: 0, reused: 0, pending: 0 };
    queueItems.forEach(item => {
        const reason = item.reason?.toLowerCase() || "";
        if (reason.includes("clean") || reason.includes("passed")) fraudDist.clean++;
        else if (reason.includes("tamper")) fraudDist.tampered++;
        else if (reason.includes("miss")) fraudDist.missing++;
        else if (reason.includes("mismatch")) fraudDist.mismatched++;
        else if (reason.includes("reuse")) fraudDist.reused++;
        else fraudDist.pending++;
    });

    const pieData = Object.entries(fraudDist)
        .filter(([_, v]) => v > 0)
        .map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));

    const totalCases = queueItems.length;
    const fraudCases = fraudDist.tampered + fraudDist.missing + fraudDist.mismatched + fraudDist.reused;
    const fraudRate = totalCases > 0 ? ((fraudCases / totalCases) * 100).toFixed(1) : "0.0";

    // Commodity breakdown from queue items
    const commodityData = Object.values(
        queueItems.reduce((acc, item) => {
            const com = item.commodity || "Unknown";
            if (!acc[com]) acc[com] = { commodity: com, total: 0, fraud: 0 };
            acc[com].total++;
            if (item.status === "QUARANTINE") acc[com].fraud++;
            return acc;
        }, {})
    );

    if (loading) {
        return (
            <Layout title="Fraud Analytics Dashboard" subtitle="Real-time fraud intelligence from inspection data">
                <div className="flex items-center justify-center h-96">
                    <div className="flex flex-col items-center gap-4">
                        <div className="h-10 w-10 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
                        <p className="text-xs text-slate-500 font-semibold tracking-wider uppercase">Loading analytics...</p>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout
            title="Fraud Analytics Dashboard"
            subtitle={
                <span>
                    Real-time fraud intelligence across <span className="text-cyan-400 font-bold">{totalCases}</span> inspection cases ·
                    <span className="text-red-400 font-bold ml-1">{fraudCases}</span> fraud incidents detected
                </span>
            }
            actions={
                <div className="flex items-center gap-2">
                    <button
                        onClick={fetchData}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-800 bg-slate-900/60 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/30 text-[10px] font-extrabold uppercase tracking-wider transition-all"
                    >
                        <RefreshCw size={13} />
                        Refresh
                    </button>
                    <button
                        onClick={exportToCSV}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-cyan-500/30 bg-cyan-950/30 text-cyan-400 hover:bg-cyan-900/50 text-[10px] font-extrabold uppercase tracking-wider transition-all"
                    >
                        <Download size={13} />
                        Export CSV
                    </button>
                </div>
            }
        >
            {/* Repeat Offender Alerts (Top Prominent Banner) */}
            {repeatOffenders.length > 0 && (
                <div className="space-y-3 mb-8">
                    {repeatOffenders.map((offender) => (
                        <div
                            key={offender.vendor}
                            className="relative group overflow-hidden rounded-xl border border-red-500/20 bg-gradient-to-r from-red-950/40 via-red-950/20 to-slate-950/50 p-4 shadow-[0_0_20px_rgba(239,68,68,0.05)]"
                        >
                            <div className="absolute top-0 left-0 bottom-0 w-1 bg-red-500" />
                            <div className="flex items-center justify-between flex-wrap gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-9 w-9 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                                        <ShieldAlert size={18} />
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-black tracking-wider text-red-400 uppercase">
                                            {offender.status === "Repeat Offender" ? "⚠️ Repeat Offender Flagged" : "⚠️ Watch List Vendor"}
                                        </h4>
                                        <p className="text-[11px] text-slate-400 mt-0.5">
                                            Vendor <span className="font-extrabold text-slate-200">{offender.vendor}</span> has registered{" "}
                                            <span className="font-extrabold text-red-400">{offender.fraud_cases} fraud cases</span> within the last {offender.days_window} days.
                                        </p>
                                    </div>
                                </div>
                                <span className="text-[9px] font-black tracking-widest uppercase px-3 py-1 rounded bg-red-950/40 border border-red-500/30 text-red-400">
                                    {offender.status}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* KPI Cards — All Backend Data */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard label="Total Cases Inspected" value={totalCases} icon={Layers} color="cyan" sublabel={`${stats?.autoApproved || 0} auto-approved`} />
                <StatCard label="Fraud Incidents" value={fraudCases} icon={AlertTriangle} color="red" sublabel="Requires investigation" />
                <StatCard label="Fraud Detection Rate" value={`${fraudRate}%`} icon={TrendingUp} color="amber" sublabel="Of total inspections" />
                <StatCard label="Pending Review" value={stats?.pendingReview || 0} icon={Activity} color="emerald" sublabel="Awaiting human review" />
            </div>

            {/* Vendor Performance Table */}
            <div className="mb-8 relative group">
                <div className="relative bg-[#0f172a]/55 border border-slate-800/80 rounded-xl shadow-lg overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
                    <div className="px-6 py-4 border-b border-slate-800 bg-[#0d1527]/50 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="h-7 w-7 rounded-lg bg-blue-950/20 border border-blue-500/20 flex items-center justify-center text-blue-400">
                                <Database size={14} />
                            </div>
                            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-200">Vendor Performance Overview</h2>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="border-b border-slate-800 bg-slate-900/30">
                                    <th className="text-left px-6 py-3.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Vendor</th>
                                    <th className="text-center px-6 py-3.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Components Supplied</th>
                                    <th className="text-center px-6 py-3.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Fraud Cases</th>
                                    <th className="text-right px-6 py-3.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 pr-12">Fraud Rate</th>
                                    <th className="text-center px-6 py-3.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Trust Score</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60">
                                {vendors.map((vendor, i) => (
                                    <tr
                                        key={i}
                                        onClick={() => handleVendorClick(vendor.vendor)}
                                        className="hover:bg-slate-900/40 transition-colors cursor-pointer"
                                    >
                                        <td className="px-6 py-4 text-slate-200 font-semibold">{vendor.vendor}</td>
                                        <td className="px-6 py-4 text-center text-slate-300 font-tech-code">{vendor.components_supplied}</td>
                                        <td className="px-6 py-4 text-center text-red-400 font-bold font-tech-code">{vendor.fraud_cases}</td>
                                        <td className="px-6 py-4 text-right pr-12 font-tech-code">
                                            <span className={parseFloat(vendor.fraud_rate) > 10 ? "text-red-400 font-extrabold" : "text-emerald-400 font-bold"}>
                                                {vendor.fraud_rate}%
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center text-slate-300 font-tech-code">{vendor.trust_score}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Site and Vendor Summaries */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Site Performance Table */}
                <div className="relative group">
                    <div className="relative bg-[#0f172a]/55 border border-slate-800/80 rounded-xl shadow-lg overflow-hidden h-full">
                        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
                        <div className="px-6 py-4 border-b border-slate-800 bg-[#0d1527]/50 flex items-center gap-2.5">
                            <div className="h-7 w-7 rounded-lg bg-cyan-950/20 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                                <Activity size={14} />
                            </div>
                            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-200">Site Performance</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="border-b border-slate-800 bg-slate-900/30">
                                        <th className="text-left px-6 py-3.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Site</th>
                                        <th className="text-center px-6 py-3.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Inspections</th>
                                        <th className="text-center px-6 py-3.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Fraud Cases</th>
                                        <th className="text-right px-6 py-3.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Fraud Rate</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/60">
                                    {sites.map((site, i) => (
                                        <tr key={i} className="hover:bg-slate-900/40 transition-colors">
                                            <td className="px-6 py-4 text-slate-200 font-semibold">{site.site}</td>
                                            <td className="px-6 py-4 text-center text-slate-300 font-tech-code">{site.inspections}</td>
                                            <td className="px-6 py-4 text-center text-red-400 font-bold font-tech-code">{site.fraud_cases}</td>
                                            <td className="px-6 py-4 text-right font-tech-code">
                                                <span className={parseFloat(site.fraud_rate) > 5 ? "text-red-400 font-extrabold" : "text-emerald-400 font-bold"}>
                                                    {site.fraud_rate}%
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Vendor Fraud Summary Table */}
                <div className="relative group">
                    <div className="relative bg-[#0f172a]/55 border border-slate-800/80 rounded-xl shadow-lg overflow-hidden h-full">
                        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />
                        <div className="px-6 py-4 border-b border-slate-800 bg-[#0d1527]/50 flex items-center gap-2.5">
                            <div className="h-7 w-7 rounded-lg bg-purple-950/20 border border-purple-500/20 flex items-center justify-center text-purple-400">
                                <AlertTriangle size={14} />
                            </div>
                            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-200">Vendor Fraud Summary</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="border-b border-slate-800 bg-slate-900/30">
                                        <th className="text-left px-6 py-3.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Vendor</th>
                                        <th className="text-right px-6 py-3.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Fraud Cases</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/60">
                                    {vendors.slice(0, 5).map((v, i) => (
                                        <tr key={i} className="hover:bg-slate-900/40 transition-colors">
                                            <td className="px-6 py-4 text-slate-200 font-semibold">{v.vendor}</td>
                                            <td className="px-6 py-4 text-right text-red-400 font-bold font-tech-code">{v.fraud_cases}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Row 2 — Month-on-Month Compliance Trend & Granular Table */}
            <div className="grid grid-cols-1 gap-6 mb-8">
                <ChartCard
                    title="Month-on-Month Compliance & Fraud Timeline"
                    icon={TrendingUp}
                    iconColor="bg-emerald-950/20 border-emerald-500/20 text-emerald-400"
                    badge="LIVE TIMELINE"
                    badgeColor="bg-cyan-950/20 border-cyan-500/20 text-cyan-400"
                >
                    {monthlyTrend.length > 0 ? (
                        <div className="space-y-6">
                            <ResponsiveContainer width="100%" height={260}>
                                <BarChart data={monthlyTrend} barGap={4} barCategoryGap="30%">
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" strokeOpacity={0.4} />
                                    <XAxis dataKey="month" stroke="#64748b" fontSize={11} axisLine={false} tickLine={false} />
                                    <YAxis stroke="#64748b" fontSize={11} axisLine={false} tickLine={false} />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: '#1e293b', opacity: 0.3 }} />
                                    <Legend
                                        verticalAlign="bottom"
                                        height={30}
                                        iconType="rect"
                                        iconSize={10}
                                        formatter={(value) => <span className="text-xs text-slate-400">{value}</span>}
                                    />
                                    <Bar dataKey="total_inspections" fill="#3b82f6" name="Total Received" radius={[4, 4, 0, 0]} maxBarSize={45} />
                                    <Bar dataKey="fraud_cases" fill="#ef4444" name="Fraud Cases" radius={[4, 4, 0, 0]} maxBarSize={45} />
                                </BarChart>
                            </ResponsiveContainer>

                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-72 text-slate-500 gap-3">
                            <Activity size={32} className="text-slate-700" />
                            <p className="text-xs font-semibold">No historical timeline data recorded yet</p>
                        </div>
                    )}
                </ChartCard>
            </div>



            {/* Recent Cases Table — Backend Data */}
            <div className="relative group">
                <div className="relative bg-[#0f172a]/55 border border-slate-800/80 rounded-xl shadow-lg overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
                    <div className="px-6 py-4 border-b border-slate-800 bg-[#0d1527]/50 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="h-7 w-7 rounded-lg bg-emerald-950/20 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                                <Eye size={14} />
                            </div>
                            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-200">Recent Inspection Outcomes</h2>
                        </div>
                        <span className="text-[9px] text-slate-500 bg-slate-900 px-2 py-1 rounded-full border border-slate-800 font-semibold">{queueItems.length} CASES</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="border-b border-slate-800 bg-slate-900/30">
                                    <th className="text-left px-6 py-3.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Case ID</th>
                                    <th className="text-left px-6 py-3.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Delivery Date</th>
                                    <th className="text-left px-6 py-3.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Part</th>
                                    <th className="text-left px-6 py-3.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Commodity</th>
                                    <th className="text-left px-6 py-3.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Risk Score</th>
                                    <th className="text-left px-6 py-3.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Status</th>
                                    <th className="text-right px-6 py-3.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Reason</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60">
                                {queueItems.slice(0, 8).map((item, i) => (
                                    <tr key={item.id || i} className="hover:bg-slate-900/20 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className="font-tech-code text-cyan-400 font-bold">{item.caseId?.slice(0, 8)}...</span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-450 font-semibold">{item.date || "N/A"}</td>
                                        <td className="px-6 py-4 text-slate-300 font-semibold">{item.partNumber || "N/A"}</td>
                                        <td className="px-6 py-4">
                                            <span className="flex items-center gap-1.5 text-slate-400">
                                                {getCategoryIcon(item.commodity)}
                                                {item.commodity || "Unknown"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full ${item.riskScore >= 75 ? 'bg-red-500' : item.riskScore >= 50 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                                        style={{ width: `${item.riskScore}%` }}
                                                    />
                                                </div>
                                                <span className={`text-[10px] font-bold font-tech-code ${item.riskScore >= 75 ? 'text-red-400' : item.riskScore >= 50 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                                    {item.riskScore}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${item.status === 'AUTO-APPROVED' ? 'bg-emerald-950/20 text-emerald-400 border border-emerald-500/20' : item.status === 'QUARANTINE' ? 'bg-red-950/20 text-red-400 border border-red-500/20' : item.status === 'RETAKE REQUESTED' ? 'bg-amber-950/20 text-amber-400 border border-amber-500/20' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                                                {item.status === 'AUTO-APPROVED' ? <CheckCircle size={10} /> : item.status === 'QUARANTINE' ? <AlertTriangle size={10} /> : null}
                                                {item.status || "PENDING"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right text-slate-500">{item.reason || "—"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {queueItems.length > 8 && (
                        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/20 text-center">
                            <button className="text-[10px] font-extrabold uppercase tracking-wider text-cyan-400 hover:text-cyan-300 transition-colors">
                                View all {queueItems.length} cases →
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="mt-8 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/60 border border-slate-800">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[9px] text-slate-500 font-semibold tracking-wider uppercase">
                        All data from backend · {new Date().toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                </div>
            </div>
            {/* Vendor Details Modal */}
            {selectedVendor && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-slate-900 border border-slate-700 p-6 rounded-xl shadow-2xl max-w-md w-full relative">
                        <button onClick={() => setSelectedVendor(null)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
                            ✕
                        </button>
                        {vendorDetailLoading ? (
                            <div className="flex justify-center py-8">
                                <div className="h-8 w-8 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
                            </div>
                        ) : vendorDetails ? (
                            <>
                                <h3 className="text-xl font-bold text-white mb-4">{vendorDetails.vendor}</h3>
                                <div className="mb-6">
                                    <h4 className="text-sm font-semibold text-slate-300 uppercase mb-2">Monthly Breakdown</h4>
                                    <div className="space-y-2">
                                        {vendorDetails.monthly_trend.map((m, i) => (
                                            <div key={i} className="flex justify-between text-sm font-tech-code">
                                                <span className="w-12 text-slate-400">{m.month}</span>
                                                <span className="text-red-400 w-24 font-bold">{m.fraud} Fraud</span>
                                                <span className="text-emerald-400 w-24">{m.genuine} Genuine</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-sm font-semibold text-slate-300 uppercase mb-2 border-b border-slate-700 pb-2">Fraud Components Supplied</h4>
                                    <ul className="text-sm text-slate-400 space-y-1 mt-3 list-disc pl-5">
                                        {vendorDetails.fraud_components.map((c, i) => (
                                            <li key={i}>{c}</li>
                                        ))}
                                        {vendorDetails.fraud_components.length === 0 && (
                                            <li>No fraud components on record.</li>
                                        )}
                                    </ul>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-8 text-slate-400">Failed to load details.</div>
                        )}
                    </div>
                </div>
            )}
        </Layout>
    );
}