"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface MermaidGraphProps {
  graph: string;
}

export default function MermaidGraph({ graph }: MermaidGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [isRendered, setIsRendered] = useState(false);

  // Pan & Zoom state
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });
  const lastTransform = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!graph || !containerRef.current) return;

    setIsRendered(false);
    setRenderError(null);

    let cancelled = false;

    const renderMermaid = async () => {
      try {
        const mermaid = (await import("mermaid")).default;

        mermaid.initialize({
          startOnLoad: false,
          theme: "base",
          themeVariables: {
            primaryColor: "#f8f9fa",
            primaryTextColor: "#1a1a1a",
            primaryBorderColor: "#cbd5e1",
            lineColor: "#64748b",
            secondaryColor: "#f1f5f9",
            tertiaryColor: "#ffffff",
            background: "#faf9f6",
            mainBkg: "#ffffff",
            nodeBorder: "#cbd5e1",
            clusterBkg: "#f8fafc",
            titleColor: "#1a1a1a",
            edgeLabelBackground: "#ffffff",
            fontFamily: "'Inter', 'Geist', sans-serif",
            fontSize: "13px",
          },
          flowchart: {
            htmlLabels: true,
            curve: "basis",
            padding: 20,
          },
          sequence: {
            diagramMarginX: 20,
            diagramMarginY: 20,
            boxTextMargin: 5,
            noteMargin: 10,
            messageMargin: 35,
          },
        });

        const uniqueId = `mermaid-${Date.now()}-${Math.random().toString(36).slice(2)}`;

        const sanitizedGraph = graph.trim().replace(/```mermaid\n?/g, "").replace(/```\n?/g, "");

        const { svg } = await mermaid.render(uniqueId, sanitizedGraph);

        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = svg;
          const svgEl = containerRef.current.querySelector("svg");
          if (svgEl) {
            svgEl.style.width = "100%";
            svgEl.style.height = "auto";
            svgEl.style.maxWidth = "none";
            svgEl.removeAttribute("height");
            svgRef.current = svgEl as SVGSVGElement;
          }
          setIsRendered(true);
          setTransform({ x: 0, y: 0, scale: 1 });
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Mermaid render error:", err);
          setRenderError(
            err instanceof Error ? err.message : "Failed to render diagram"
          );
        }
      }
    };

    renderMermaid();
    return () => { cancelled = true; };
  }, [graph]);

  // Zoom handler
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setTransform((prev) => ({
      ...prev,
      scale: Math.min(Math.max(prev.scale * delta, 0.3), 4),
    }));
  }, []);

  // Pan handlers
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    isPanning.current = true;
    panStart.current = { x: e.clientX, y: e.clientY };
    lastTransform.current = { x: transform.x, y: transform.y };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, [transform]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isPanning.current) return;
    const dx = e.clientX - panStart.current.x;
    const dy = e.clientY - panStart.current.y;
    setTransform((prev) => ({
      ...prev,
      x: lastTransform.current.x + dx,
      y: lastTransform.current.y + dy,
    }));
  }, []);

  const handlePointerUp = useCallback(() => {
    isPanning.current = false;
  }, []);

  const resetView = () => setTransform({ x: 0, y: 0, scale: 1 });
  const zoomIn = () => setTransform((p) => ({ ...p, scale: Math.min(p.scale * 1.25, 4) }));
  const zoomOut = () => setTransform((p) => ({ ...p, scale: Math.max(p.scale * 0.8, 0.3) }));

  return (
    <div className="mermaid-wrapper">
      {/* Controls */}
      <AnimatePresence>
        {isRendered && (
          <motion.div
            className="mermaid-controls"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <button onClick={zoomOut} className="ctrl-btn" title="Zoom out">−</button>
            <button onClick={resetView} className="ctrl-btn ctrl-reset" title="Reset view">
              {Math.round(transform.scale * 100)}%
            </button>
            <button onClick={zoomIn} className="ctrl-btn" title="Zoom in">+</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Diagram viewport */}
      <div
        className="mermaid-viewport"
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        style={{ cursor: isPanning.current ? "grabbing" : "grab" }}
      >
        {!isRendered && !renderError && (
          <div className="mermaid-loading">
            <div className="wire-anim">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="wire-bar" style={{ animationDelay: `${i * 0.12}s` }} />
              ))}
            </div>
            <span className="wire-label">Rendering diagram…</span>
          </div>
        )}

        {renderError && (
          <div className="mermaid-error">
            <span className="error-icon">⚠</span>
            <p>Diagram render failed</p>
            <code>{renderError}</code>
          </div>
        )}

        <div
          ref={containerRef}
          style={{
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
            transformOrigin: "center center",
            transition: isPanning.current ? "none" : "transform 0.15s ease",
            willChange: "transform",
            display: isRendered ? "block" : "none",
          }}
        />
      </div>
    </div>
  );
}
