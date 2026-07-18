// ImageComparison.jsx — Side-by-side golden vs uploaded image viewer with optional diff overlay
import { useState } from "react";

/**
 * Props:
 *  goldenUrl    {string}  — OEM reference image URL
 *  uploadedUrl  {string}  — uploaded/defective image URL
 *  altGolden    {string}
 *  altUploaded  {string}
 *  imageHash    {string}  — shown as a tech code label
 */
export default function ImageComparison({
  goldenUrl,
  uploadedUrl,
  altGolden = "Golden reference image",
  altUploaded = "Uploaded image",
  imageHash,
}) {
  const [zoom, setZoom] = useState(null); // null | "golden" | "uploaded"

  return (
    <div className="bg-white border border-outline-variant rounded-xl shadow-sm p-card-padding">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-headline-sm text-headline-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">compare</span>
          Image Comparison
        </h3>
        {imageHash && (
          <span className="font-tech-code text-body-sm text-on-surface-variant bg-surface-container-low px-2 py-1 rounded">
            {imageHash}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Golden */}
        <div className="flex flex-col gap-2">
          <span className="font-label-caps text-[10px] uppercase text-on-surface-variant">
            Golden Reference (OEM)
          </span>
          <div
            className="relative aspect-square rounded-lg overflow-hidden border border-outline-variant bg-surface-container-lowest cursor-zoom-in group"
            onClick={() => setZoom(zoom === "golden" ? null : "golden")}
          >
            <img
              src={goldenUrl}
              alt={altGolden}
              className="w-full h-full object-cover grayscale opacity-80 group-hover:opacity-100 group-hover:grayscale-0 transition-all duration-300"
            />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="material-symbols-outlined text-white text-3xl drop-shadow-lg">zoom_in</span>
            </div>
            <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur px-2 py-0.5 rounded-full text-[10px] font-bold border border-outline-variant uppercase">
              Source: Master_DB
            </div>
          </div>
        </div>

        {/* Uploaded */}
        <div className="flex flex-col gap-2">
          <span className="font-label-caps text-[10px] uppercase text-on-surface-variant">
            Uploaded (Review Required)
          </span>
          <div
            className="relative aspect-square rounded-lg overflow-hidden border border-outline-variant bg-surface-container-lowest cursor-zoom-in group"
            onClick={() => setZoom(zoom === "uploaded" ? null : "uploaded")}
          >
            <img
              src={uploadedUrl}
              alt={altUploaded}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="material-symbols-outlined text-white text-3xl drop-shadow-lg">zoom_in</span>
            </div>
            <div className="absolute top-2 right-2 bg-error text-white px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">
              Flagged
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {zoom && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-8 cursor-zoom-out animate-fade-in"
          onClick={() => setZoom(null)}
        >
          <img
            src={zoom === "golden" ? goldenUrl : uploadedUrl}
            alt={zoom === "golden" ? altGolden : altUploaded}
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
          />
          <button
            className="absolute top-4 right-4 text-white p-2 rounded-full bg-white/10 hover:bg-white/20"
            onClick={() => setZoom(null)}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
      )}
    </div>
  );
}