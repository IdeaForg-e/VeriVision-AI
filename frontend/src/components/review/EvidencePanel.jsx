import ROIEditor from "./ROIEditor.jsx";

export default function EvidencePanel({ caseData, region, onRegionChange, onRegionCommit }) {
  if (!caseData) return null;

  return (
    <div className="lg:col-span-8 bg-white border border-outline-variant rounded-xl shadow-sm p-card-padding flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="font-headline-sm text-headline-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">analytics</span>
          Evidence Analysis
        </h2>
        <span className="font-tech-code text-on-surface-variant text-body-sm bg-surface-container-low px-2 py-1 rounded">
          IMAGE_HASH: {caseData.imageHash}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Golden Reference */}
        <div className="flex flex-col gap-3">
          <span className="font-label-caps text-on-surface-variant uppercase">Golden Reference (OEM Standard)</span>
          <div className="relative aspect-square bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden group">
            <img
              className="w-full h-full object-cover grayscale opacity-80"
              alt="Golden reference part"
              src={caseData.goldenImageUrl}
            />
            <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
            <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-bold border border-outline-variant tracking-wider uppercase">
              Source: Master_DB
            </div>
          </div>
        </div>

        {/* Defective / Uploaded */}
        <div className="flex flex-col gap-3">
          <span className="font-label-caps text-on-surface-variant uppercase">
            Defective / Uploaded (Review Required)
          </span>
          <div className="relative aspect-square bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden select-none">
            <img
              className="w-full h-full object-cover absolute inset-0"
              alt="Uploaded part under review"
              src={caseData.uploadedImageUrl}
            />
            <ROIEditor region={region} onChange={onRegionChange} onCommit={onRegionCommit} />
          </div>
        </div>
      </div>

      <div className="bg-surface-container-low p-4 rounded-lg flex gap-3 items-start border-l-4 border-primary">
        <span className="material-symbols-outlined text-primary mt-0.5">info</span>
        <p className="text-body-sm text-on-surface-variant leading-relaxed">
          Drag or resize the box if the AI's highlighted region is off. Your correction is saved as a training
          example for the <span className="font-tech-code text-primary">{caseData.neuralModel}</span> neural model.
        </p>
      </div>
    </div>
  );
}
