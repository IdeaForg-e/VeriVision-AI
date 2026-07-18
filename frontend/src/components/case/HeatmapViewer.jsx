// HeatmapViewer.jsx — Overlays a heat-map highlight on a part image to show AI attention regions
import { useState } from "react";

/**
 * Props:
 *  imageUrl     {string}   — the uploaded image URL
 *  heatmapUrl   {string}   — optional: separate heatmap image URL (overlay mode)
 *  region       {object}   — { x, y, w, h } percentages (used when no heatmapUrl)
 *  alt          {string}
 *  label        {string}   — caption below the viewer
 */
export default function HeatmapViewer({
  imageUrl,
  heatmapUrl,
  region,
  alt = "Part under review",
  label = "AI Attention Region",
}) {
  const [showOverlay, setShowOverlay] = useState(true);

  return (
    <div className="bg-white border border-outline-variant rounded-xl shadow-sm p-card-padding">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-headline-sm text-headline-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">thermostat</span>
          Heatmap Viewer
        </h3>
        <button
          onClick={() => setShowOverlay((v) => !v)}
          className="flex items-center gap-1.5 text-body-sm text-on-surface-variant hover:text-primary transition-colors px-3 py-1 rounded-lg border border-outline-variant hover:bg-primary/5"
        >
          <span className="material-symbols-outlined text-[18px]">
            {showOverlay ? "visibility_off" : "visibility"}
          </span>
          {showOverlay ? "Hide" : "Show"} Overlay
        </button>
      </div>

      <div className="relative aspect-square bg-surface-container-lowest rounded-lg overflow-hidden border border-outline-variant select-none">
        {/* Base image */}
        <img
          src={imageUrl}
          alt={alt}
          className="w-full h-full object-cover"
        />

        {/* Overlay: separate heatmap image OR box region */}
        {showOverlay && (
          <>
            {heatmapUrl ? (
              <img
                src={heatmapUrl}
                alt="Heatmap overlay"
                className="absolute inset-0 w-full h-full object-cover mix-blend-multiply opacity-70 transition-opacity duration-300"
              />
            ) : region ? (
              /* Bounding-box overlay derived from ROI region percentages */
              <div
                className="absolute border-2 border-primary rounded shadow-lg"
                style={{
                  left: `${region.x}%`,
                  top: `${region.y}%`,
                  width: `${region.w}%`,
                  height: `${region.h}%`,
                  background: "rgba(0,74,198,0.12)",
                  boxShadow: "0 0 0 9999px rgba(0,0,0,0.25)",
                  pointerEvents: "none",
                }}
              />
            ) : null}
          </>
        )}
      </div>

      {label && (
        <p className="text-center text-body-sm text-on-surface-variant italic mt-3">{label}</p>
      )}
    </div>
  );
}