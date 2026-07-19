// AdminConsolePage.jsx — Redesigned premium parts template registry and golden OEM reference configurations dashboard
import { useState, useEffect } from "react";
import { Layout } from "../components/layout.jsx";
import { getProducts, createProduct, uploadGoldenReference } from "../services/productService.js";
import { 
  Shield, 
  Plus, 
  Upload, 
  Layers, 
  HelpCircle, 
  CheckCircle, 
  AlertCircle, 
  Cpu, 
  Database, 
  Sliders, 
  Eye, 
  Grid,
  FileText
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from "recharts";

export default function AdminConsolePage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // New product form states
  const [partNumber, setPartNumber] = useState("");
  const [name, setName] = useState("");
  const [commodity, setCommodity] = useState("motherboard");
  const [customCommodity, setCustomCommodity] = useState("");
  const [creating, setCreating] = useState(false);

  // Golden reference upload states
  const [uploadingForId, setUploadingForId] = useState(null);
  const [goldenFile, setGoldenFile] = useState(null);
  const [expectedSerial, setExpectedSerial] = useState("");
  const [cameraAngle, setCameraAngle] = useState("top");
  const [uploading, setUploading] = useState(false);

  const fetchProducts = async () => {
    try {
      const data = await getProducts();
      setProducts(data || []);
    } catch (err) {
      console.error("Failed to load products:", err);
      setErrorMsg("Failed to load product templates.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    if (!partNumber || !name) return;
    setCreating(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const finalCommodity = commodity === "other" ? (customCommodity.trim() || "other") : commodity;

    try {
      await createProduct({
        part_number: partNumber.trim(),
        name: name.trim(),
        commodity: finalCommodity.toLowerCase()
      });
      setSuccessMsg(`Product '${partNumber}' registered successfully!`);
      setPartNumber("");
      setName("");
      setCustomCommodity("");
      setCommodity("motherboard");
      fetchProducts();
    } catch (err) {
      setErrorMsg(err.message || "Failed to register product.");
    } finally {
      setCreating(false);
    }
  };

  const handleUploadGolden = async (productId) => {
    if (!goldenFile) {
      setErrorMsg("Please select a golden reference image file.");
      return;
    }
    setUploading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const formData = new FormData();
      formData.append("file", goldenFile);
      formData.append("angle", cameraAngle);
      if (expectedSerial) formData.append("expected_serial", expectedSerial.trim());

      // Preset ROI bounds mapping for auto validation alignment
      let roiConfig = null;
      const targetProd = products.find(p => p.id === productId);
      const category = targetProd?.commodity || "motherboard";
      
      if (category === "label") {
        roiConfig = { label_roi: { x: 420, y: 50, width: 420, height: 220 } };
      } else if (category === "motherboard") {
        roiConfig = { label_roi: { x: 200, y: 620, width: 150, height: 80 } };
      } else if (category === "microchip") {
        roiConfig = { label_roi: { x: 250, y: 250, width: 200, height: 100 } };
      } else {
        roiConfig = { label_roi: { x: 100, y: 100, width: 300, height: 200 } };
      }
      
      if (roiConfig) {
        formData.append("roi_config", JSON.stringify(roiConfig));
      }

      await uploadGoldenReference(productId, formData);
      setSuccessMsg(`Golden reference uploaded successfully for product ID ${productId}!`);
      setGoldenFile(null);
      setExpectedSerial("");
      setUploadingForId(null);
      fetchProducts();
    } catch (err) {
      setErrorMsg(err.message || "Failed to upload golden reference.");
    } finally {
      setUploading(false);
    }
  };

  // Helper mapping category values to icons
  const getCategoryIcon = (category) => {
    const name = category?.toLowerCase() || "";
    if (name.includes("motherboard") || name.includes("pcb")) return <Database className="text-cyan-400" size={16} />;
    if (name.includes("cpu") || name.includes("processor") || name.includes("microchip")) return <Cpu className="text-purple-400" size={16} />;
    if (name.includes("label") || name.includes("sticker")) return <FileText className="text-emerald-400" size={16} />;
    return <Sliders className="text-blue-400" size={16} />;
  };

  // Compute live deck stats counters
  const totalCount = products.length;
  const linkedCount = products.filter(p => p.golden_references && p.golden_references.length > 0).length;
  const missingCount = totalCount - linkedCount;
  const uniqueCategories = new Set(products.map(p => p.commodity)).size;

  return (
    <Layout
      title="Admin Template Console"
      subtitle="Register standard parts templates and upload clean OEM reference standards for pipeline verification."
    >
      {/* Top row: High-level dashboard stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-[#0f172a]/45 border border-slate-850 p-4 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-450 font-bold">Registered Templates</p>
            <h3 className="text-xl font-extrabold text-slate-100 font-tech-code mt-0.5">{totalCount}</h3>
          </div>
          <div className="h-9 w-9 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
            <Grid size={18} />
          </div>
        </div>

        <div className="bg-[#0f172a]/45 border border-slate-850 p-4 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-450 font-bold">Golden Reference OK</p>
            <h3 className="text-xl font-extrabold text-emerald-400 font-tech-code mt-0.5">{linkedCount}</h3>
          </div>
          <div className="h-9 w-9 rounded-lg bg-emerald-950/20 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle size={18} />
          </div>
        </div>

        <div className="bg-[#0f172a]/45 border border-slate-850 p-4 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-450 font-bold">Reference Missing</p>
            <h3 className="text-xl font-extrabold text-amber-550 font-tech-code mt-0.5">{missingCount}</h3>
          </div>
          <div className="h-9 w-9 rounded-lg bg-amber-950/20 border border-amber-500/20 flex items-center justify-center text-amber-500">
            <HelpCircle size={18} />
          </div>
        </div>

        <div className="bg-[#0f172a]/45 border border-slate-850 p-4 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-450 font-bold">Active Commodities</p>
            <h3 className="text-xl font-extrabold text-purple-400 font-tech-code mt-0.5">{uniqueCategories}</h3>
          </div>
          <div className="h-9 w-9 rounded-lg bg-purple-950/20 border border-purple-500/20 flex items-center justify-center text-purple-450">
            <Cpu size={18} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Form Panel (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="cyber-card bg-[#0f172a]/55 border-slate-800 p-6 shadow-lg relative overflow-hidden">
            {/* Top decorative glass line */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent"></div>
            
            <h2 className="text-sm font-extrabold uppercase text-slate-200 tracking-wider flex items-center gap-2 mb-6">
              <Plus size={18} className="text-cyan-400" />
              Register New Part
            </h2>
            
            <form onSubmit={handleCreateProduct} className="space-y-5 text-xs text-slate-350">
              <div className="flex flex-col gap-1.5">
                <label className="font-label-caps text-[10px] tracking-wider text-slate-500 uppercase font-semibold">Part Code / Number</label>
                <input
                  type="text"
                  required
                  value={partNumber}
                  onChange={(e) => setPartNumber(e.target.value)}
                  placeholder="e.g. XPS-MB-409"
                  className="cyber-input rounded-lg px-3.5 py-2.5 bg-slate-900/60 border border-slate-850 text-slate-200 text-sm focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/20 transition-all font-tech-code"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-label-caps text-[10px] tracking-wider text-slate-500 uppercase font-semibold">Description Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Dell XPS 15 Motherboard"
                  className="cyber-input rounded-lg px-3.5 py-2.5 bg-slate-900/60 border border-slate-850 text-slate-200 text-sm focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/20 transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-label-caps text-[10px] tracking-wider text-slate-500 uppercase font-semibold">Commodity Category</label>
                <select
                  value={commodity}
                  onChange={(e) => setCommodity(e.target.value)}
                  className="cyber-input rounded-lg px-3 py-2.5 bg-slate-900/80 border border-slate-850 text-slate-200 text-sm focus:border-cyan-500/40 transition-all"
                >
                  <option value="motherboard">Motherboard / Main PCB</option>
                  <option value="label">Warranty sticker / QA Label</option>
                  <option value="microchip">Microchips / Integrated Circuits (IC)</option>
                  <option value="processor">Processor (CPU / APU)</option>
                  <option value="ram">Memory Modules (RAM / SODIMM)</option>
                  <option value="storage">Storage Drives (SSD / HDD)</option>
                  <option value="gpu">Graphics Cards (GPU Board)</option>
                  <option value="battery">Li-ion Rechargeable Battery</option>
                  <option value="display">LCD Display Panel</option>
                  <option value="chassis">Metal / Plastic Chassis Frame</option>
                  <option value="fan">Cooling Fan & Heat Sink</option>
                  <option value="sensor">Optical / Thermal Sensors</option>
                  <option value="other">Other (Specify Custom Category)</option>
                </select>
              </div>

              {commodity === "other" && (
                <div className="flex flex-col gap-1.5 mt-2 animate-fade-in">
                  <label className="font-label-caps text-[10px] tracking-wider text-slate-500 uppercase font-semibold">Custom Category Name</label>
                  <input
                    type="text"
                    required
                    value={customCommodity}
                    onChange={(e) => setCustomCommodity(e.target.value)}
                    placeholder="e.g. LiquidCooler"
                    className="cyber-input rounded-lg px-3.5 py-2.5 bg-slate-950/65 border border-slate-850 text-slate-250 text-sm focus:border-cyan-500/40"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={creating}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-95 text-white rounded-lg font-bold transition disabled:opacity-50 mt-6 shadow-[0_0_15px_rgba(6,182,212,0.15)] uppercase tracking-wider text-[10px]"
              >
                {creating ? "Registering..." : "Create Product Template"}
              </button>
            </form>
          </div>

          {/* Guidelines box */}
          <div className="cyber-card bg-[#0f172a]/20 border-slate-900/60 p-5 text-slate-400 text-[11px] leading-relaxed space-y-3 relative overflow-hidden">
            <h3 className="font-bold text-slate-250 flex items-center gap-1.5 uppercase tracking-wide border-b border-slate-850 pb-2">
              <Shield size={14} className="text-cyan-400" />
              Upload Guidelines
            </h3>
            <p>1. **Golden Standard Reference** represent the exact layout expected on incoming items. Ensure uploaded references are high-quality, flat, and well-lit.</p>
            <p>2. Set an **Expected Serial** for stickers so the EasyOCR agent can check for character anomalies.</p>
          </div>
        </div>

        {/* Right Catalog Panel (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {errorMsg && (
            <div className="flex gap-3 bg-red-950/20 border border-red-500/25 text-red-400 rounded-xl p-4 animate-shake text-xs">
              <AlertCircle className="shrink-0 text-red-500" size={16} />
              <div>
                <p className="font-extrabold uppercase">Catalog Error</p>
                <p className="mt-0.5">{errorMsg}</p>
              </div>
            </div>
          )}

          {successMsg && (
            <div className="flex gap-3 bg-emerald-950/20 border border-emerald-500/25 text-emerald-400 rounded-xl p-4 animate-fade-in text-xs">
              <CheckCircle className="shrink-0 text-emerald-500" size={16} />
              <div>
                <p className="font-extrabold uppercase">Operation Succeeded</p>
                <p className="mt-0.5">{successMsg}</p>
              </div>
            </div>
          )}

          {/* Catalog list container */}
          <div className="cyber-card bg-[#0f172a]/55 border-slate-800 shadow-lg overflow-hidden relative">
            {/* Top decorative glass line */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500/30 to-transparent"></div>

            <div className="px-6 py-5 border-b border-slate-850 bg-[#0d1527]/50 flex justify-between items-center">
              <div>
                <h2 className="text-sm font-black uppercase text-slate-200 tracking-wider">Product Template Registry</h2>
                <p className="text-xs text-slate-450 mt-0.5">Manage reference standards for supply chain triaging</p>
              </div>
              <span className="bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 px-3 py-1 rounded-full text-xs font-semibold font-tech-code tracking-wide">
                {products.length} TEMPLATES
              </span>
            </div>

            <div className="divide-y divide-slate-850">
              {loading ? (
                <div className="py-16 text-center text-slate-450 text-xs">
                  Loading registered templates...
                </div>
              ) : products.length === 0 ? (
                <div className="py-16 text-center text-slate-450 text-xs leading-relaxed max-w-sm mx-auto">
                  <HelpCircle size={28} className="mx-auto text-slate-500 mb-2" />
                  No parts registered yet. Use the left panel to register your first product profile!
                </div>
              ) : (
                products.map((p) => {
                  const hasGolden = p.golden_references && p.golden_references.length > 0;
                  const isUploading = uploadingForId === p.id;
                  
                  return (
                    <div key={p.id} className="p-6 space-y-4 hover:bg-slate-900/10 transition-colors">
                      
                      {/* Catalog item header row */}
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-tech-code text-cyan-400 text-sm font-extrabold bg-cyan-950/20 px-2 py-0.5 border border-cyan-500/10 rounded">{p.part_number}</span>
                            <span className="text-slate-500">·</span>
                            <span className="text-[10px] capitalize text-slate-350 px-2.5 py-0.5 bg-slate-900/80 rounded-full border border-slate-800 flex items-center gap-1.5 font-bold uppercase tracking-wider">
                              {getCategoryIcon(p.commodity)}
                              {p.commodity}
                            </span>
                          </div>
                          <h3 className="font-bold text-slate-200 text-sm">{p.name}</h3>
                        </div>

                        <div>
                          {hasGolden ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-extrabold uppercase tracking-wide">
                              <CheckCircle size={11} />
                              Golden Template Linked
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-extrabold uppercase tracking-wide">
                              <HelpCircle size={11} />
                              Reference Missing
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Golden Reference Details Layout */}
                      {hasGolden && !isUploading ? (
                        <div className="bg-[#070a13]/70 rounded-xl p-4 border border-slate-850 flex flex-col sm:flex-row items-center gap-5 text-xs">
                          {/* Image preview with hover zoom */}
                          <div className="w-24 h-24 rounded-lg bg-slate-950 border border-slate-850 overflow-hidden flex-shrink-0 flex items-center justify-center relative group-preview">
                            <img 
                              src={`http://127.0.0.1:8000/data/golden/${p.golden_references[0].image_path ? p.golden_references[0].image_path.split(/[\\/]/).pop() : ""}`}
                              alt="Golden OEM standard template reference"
                              className="w-full h-full object-contain p-1.5 transform hover:scale-110 transition-transform duration-300"
                              onError={(e) => {
                                // Fallback icon if URL error
                                e.target.style.display = "none";
                                e.target.nextSibling.style.display = "block";
                              }}
                            />
                            <span className="material-symbols-outlined text-slate-550 text-2xl hidden absolute">image</span>
                          </div>
                           <div className="flex-1 space-y-1.5">
                            <p className="text-slate-400 font-semibold flex items-center gap-1.5">
                              <Eye size={12} className="text-slate-500" />
                              Camera Angle: <span className="font-tech-code text-slate-200 uppercase font-bold bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded">{p.golden_references[0].angle}</span>
                            </p>
                            {p.golden_references[0].expected_serial && (
                              <p className="text-slate-400 font-semibold">
                                Expected Barcode/Serial: <span className="font-tech-code text-cyan-400 font-extrabold">{p.golden_references[0].expected_serial}</span>
                              </p>
                            )}
                          </div>
                          
                          {/* Dynamic Acceptance Threshold Mini Chart */}
                          <div className="w-full sm:w-44 h-16 shrink-0 bg-[#090e1a]/80 p-2 border border-slate-850 rounded-lg hidden md:block">
                            <p className="text-[8px] uppercase text-slate-500 font-black tracking-widest mb-1.5">Acceptance Targets</p>
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart 
                                layout="vertical" 
                                data={[
                                  { name: "SSIM", score: 85, fill: "#06b6d4" },
                                  { name: "Matches", score: 75, fill: "#3b82f6" },
                                  { name: "OCR", score: 95, fill: "#a855f7" }
                                ]} 
                                margin={{ top: 0, right: 5, left: -25, bottom: 0 }}
                              >
                                <XAxis type="number" domain={[0, 100]} hide />
                                <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={7} tickLine={false} axisLine={false} />
                                <Bar dataKey="score" radius={[0, 2, 2, 0]} barSize={4}>
                                  {
                                    [
                                      { fill: "#06b6d4" },
                                      { fill: "#3b82f6" },
                                      { fill: "#a855f7" }
                                    ].map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))
                                  }
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                          
                          <button
                            onClick={() => setUploadingForId(p.id)}
                            className="text-[10px] text-slate-400 hover:text-cyan-400 font-black uppercase tracking-wider px-3.5 py-2 border border-slate-800 hover:border-cyan-500/20 rounded bg-slate-900/60 hover:bg-cyan-950/10 transition-all self-end sm:self-center"
                          >
                            Update Reference
                          </button>
                        </div>
                      ) : isUploading ? (
                        /* Upload Panel (Glassmorphic) */
                        <div className="bg-[#0c1322] rounded-xl p-5 border border-slate-800 space-y-4 animate-fade-in text-xs relative overflow-hidden">
                          <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-500/25 to-transparent"></div>
                          
                          <h4 className="font-extrabold uppercase text-slate-200 tracking-wide">Upload OEM Golden Reference standard</h4>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[10px] uppercase text-slate-500 font-semibold">Expected Barcode text (Optional)</label>
                              <input
                                type="text"
                                value={expectedSerial}
                                onChange={(e) => setExpectedSerial(e.target.value)}
                                placeholder="e.g. 91165LUS0DDD"
                                className="cyber-input rounded-lg px-3 py-2 bg-slate-900 border border-slate-850 text-slate-200 focus:border-cyan-500/30"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[10px] uppercase text-slate-500 font-semibold">Camera Angle</label>
                              <select
                                value={cameraAngle}
                                onChange={(e) => setCameraAngle(e.target.value)}
                                className="cyber-input rounded-lg bg-slate-900 border border-slate-850 text-slate-200 px-3 py-2 focus:border-cyan-500/30"
                              >
                                <option value="top">Top Down View</option>
                                <option value="angled">Angled Perspective</option>
                              </select>
                            </div>
                          </div>

                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] uppercase text-slate-500 font-semibold">Clean OEM Reference Image file</label>
                            <label className="border border-dashed border-slate-800 hover:border-cyan-500/30 bg-slate-950/50 hover:bg-cyan-950/5 rounded-xl p-5 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setGoldenFile(e.target.files[0])}
                                className="hidden"
                              />
                              <Upload className="text-slate-500" size={16} />
                              <span className="text-xs font-bold text-slate-350 truncate max-w-[400px]">
                                {goldenFile ? goldenFile.name : "Select standard image file"}
                              </span>
                            </label>
                          </div>

                          <div className="flex justify-end gap-2.5 pt-2">
                            <button
                              disabled={uploading}
                              onClick={() => {
                                setUploadingForId(null);
                                setGoldenFile(null);
                                setExpectedSerial("");
                              }}
                              className="px-4 py-1.5 border border-slate-800 rounded bg-slate-900 text-slate-400 hover:bg-slate-850 hover:text-slate-100 text-[10px] font-extrabold uppercase tracking-wide transition"
                            >
                              Cancel
                            </button>
                            <button
                              disabled={uploading || !goldenFile}
                              onClick={() => handleUploadGolden(p.id)}
                              className="px-4 py-1.5 rounded bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-black text-[10px] uppercase tracking-wide shadow-md disabled:opacity-50 transition"
                            >
                              {uploading ? "Uploading..." : "Save Template"}
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Missing reference warning banner & upload button */
                        <div className="flex justify-start">
                          <button
                            onClick={() => setUploadingForId(p.id)}
                            className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-amber-500 font-black px-4 py-2.5 border border-amber-500/25 hover:border-amber-500/40 rounded-lg bg-amber-500/5 hover:bg-amber-500/10 transition-all duration-300"
                          >
                            <Upload size={13} />
                            Upload OEM Golden Reference Standard
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

      </div>
    </Layout>
  );
}
