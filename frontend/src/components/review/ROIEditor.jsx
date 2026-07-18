import { useCallback, useRef, useState } from "react";

/**
 * Draggable + resizable "AI prediction region" box, rendered over an image.
 * Region is stored/reported in percentages of the container so it stays
 * correct at any image size (the static Stitch export used raw pixels,
 * which breaks on resize — this version is layout-safe).
 *
 * Props:
 *  - region: { x, y, w, h } in % (0-100)
 *  - onChange(region): called continuously while dragging/resizing
 *  - onCommit(region): called once on mouse/touch up (good place to hit the API)
 *  - label: badge text, defaults to "AI_PREDICTION_REGION"
 */
export default function ROIEditor({ region, onChange, onCommit, label = "AI_PREDICTION_REGION" }) {
  const containerRef = useRef(null);
  const dragState = useRef(null);
  const [active, setActive] = useState(false);

  const clamp = (val, min, max) => Math.max(min, Math.min(val, max));

  const getPoint = (e) => {
    if (e.touches && e.touches[0]) return { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY };
    return { clientX: e.clientX, clientY: e.clientY };
  };

  const startDrag = useCallback(
    (e) => {
      if (e.target.dataset?.resizer) return;
      const { clientX, clientY } = getPoint(e);
      dragState.current = { mode: "move", startX: clientX, startY: clientY, startRegion: region };
      setActive(true);
    },
    [region]
  );

  const startResize = useCallback(
    (e) => {
      e.stopPropagation();
      const { clientX, clientY } = getPoint(e);
      dragState.current = { mode: "resize", startX: clientX, startY: clientY, startRegion: region };
      setActive(true);
    },
    [region]
  );

  const onMove = useCallback(
    (e) => {
      if (!dragState.current || !containerRef.current) return;
      const { clientX, clientY } = getPoint(e);
      const rect = containerRef.current.getBoundingClientRect();
      const dxPct = ((clientX - dragState.current.startX) / rect.width) * 100;
      const dyPct = ((clientY - dragState.current.startY) / rect.height) * 100;
      const start = dragState.current.startRegion;

      if (dragState.current.mode === "move") {
        const x = clamp(start.x + dxPct, 0, 100 - start.w);
        const y = clamp(start.y + dyPct, 0, 100 - start.h);
        onChange({ ...start, x, y });
      } else {
        const w = clamp(start.w + dxPct, 5, 100 - start.x);
        const h = clamp(start.h + dyPct, 5, 100 - start.y);
        onChange({ ...start, w, h });
      }
    },
    [onChange]
  );

  const endDrag = useCallback(() => {
    if (!dragState.current) return;
    dragState.current = null;
    setActive(false);
    onCommit?.(region);
  }, [onCommit, region]);

  if (!region) return null;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full select-none"
      onMouseMove={onMove}
      onMouseUp={endDrag}
      onMouseLeave={endDrag}
      onTouchMove={onMove}
      onTouchEnd={endDrag}
    >
      <div
        className={`absolute border-2 border-dashed border-primary bg-primary/10 shadow-lg z-10 cursor-move ${
          active ? "ring-2 ring-primary" : ""
        }`}
        style={{
          left: `${region.x}%`,
          top: `${region.y}%`,
          width: `${region.w}%`,
          height: `${region.h}%`,
        }}
        onMouseDown={startDrag}
        onTouchStart={startDrag}
      >
        <div className="absolute -top-6 left-0 bg-primary text-white text-[10px] px-2 py-0.5 rounded-sm font-bold whitespace-nowrap">
          {label}
        </div>
        <div
          data-resizer="true"
          onMouseDown={startResize}
          onTouchStart={startResize}
          className="absolute -bottom-1.5 -right-1.5 w-4 h-4 bg-primary rounded-full border-2 border-white cursor-se-resize"
        />
      </div>
    </div>
  );
}
