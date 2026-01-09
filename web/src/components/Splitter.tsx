import { useEffect, useRef, useState } from "react";

type Props = {
  leftPanel: React.ReactNode;
  rightPanel: React.ReactNode;
  defaultSplitPosition?: number; // 0-100 (%)
  minLeftWidth?: number; // px
  minRightWidth?: number; // px
  storageKey?: string;
};

export function Splitter({
  leftPanel,
  rightPanel,
  defaultSplitPosition = 35,
  minLeftWidth = 280,
  minRightWidth = 350,
  storageKey = "gantt-splitter-position",
}: Props) {
  const [splitPosition, setSplitPosition] = useState(() => {
    if (storageKey) {
      const saved = localStorage.getItem(storageKey);
      if (saved) return Number(saved);
    }
    return defaultSplitPosition;
  });

  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const containerWidth = rect.width;
      const mouseX = e.clientX - rect.left;

      // Calcular nuevo porcentaje
      let newPercent = (mouseX / containerWidth) * 100;

      // Aplicar límites
      const minLeftPercent = (minLeftWidth / containerWidth) * 100;
      const maxLeftPercent = 100 - (minRightWidth / containerWidth) * 100;

      newPercent = Math.max(minLeftPercent, Math.min(maxLeftPercent, newPercent));

      setSplitPosition(newPercent);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      if (storageKey) {
        localStorage.setItem(storageKey, String(splitPosition));
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, splitPosition, minLeftWidth, minRightWidth, storageKey]);

  return (
    <div
      ref={containerRef}
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        position: "relative",
        minWidth: 0,
        userSelect: isDragging ? "none" : "auto",
      }}
    >
      {/* Panel izquierdo */}
      <div
        style={{
          width: `${splitPosition}%`,
          height: "100%",
          overflow: "hidden",
          position: "relative",
          minWidth: 0,
        }}
      >
        {leftPanel}
      </div>

      {/* Divisor draggable */}
      <div
        onMouseDown={() => setIsDragging(true)}
        style={{
          width: 6,
          height: "100%",
          background: isDragging ? "#0052cc" : "#dfe1e6",
          cursor: "col-resize",
          position: "relative",
          flexShrink: 0,
          transition: isDragging ? "none" : "background 0.15s ease",
          zIndex: 100,
        }}
        onMouseEnter={(e) => {
          if (!isDragging) {
            (e.target as HTMLElement).style.background = "#c1c7d0";
          }
        }}
        onMouseLeave={(e) => {
          if (!isDragging) {
            (e.target as HTMLElement).style.background = "#dfe1e6";
          }
        }}
      >
        {/* Indicador visual */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 3,
            height: 40,
            background: isDragging ? "white" : "#8993a4",
            borderRadius: 2,
            pointerEvents: "none",
          }}
        />
      </div>

      {/* Panel derecho */}
      <div
        style={{
          width: `${100 - splitPosition}%`,
          height: "100%",
          overflow: "hidden",
          position: "relative",
          minWidth: 0,
        }}
      >
        {rightPanel}
      </div>
    </div>
  );
}
