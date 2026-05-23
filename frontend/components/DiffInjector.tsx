"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence, useSpring, useTransform } from "framer-motion";
import type { DiffUpdateSchema } from "@/services/api";

interface DiffInjectorProps {
  currentDocs: string;
  onResult: (result: DiffUpdateSchema) => void;
  onError?: () => void;
}

type DropState = "idle" | "hovering" | "processing" | "success" | "error";

export default function DiffInjector({ currentDocs, onResult, onError }: DiffInjectorProps) {
  const [dropState, setDropState] = useState<DropState>("idle");
  const [diffText, setDiffText] = useState("");
  const [changesBullets, setChangesBullets] = useState<string[]>([]);
  const [isPasteMode, setIsPasteMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Spring physics for border pulse
  const springVal = useSpring(0, { stiffness: 300, damping: 25 });
  const glowOpacity = useTransform(springVal, [0, 1], [0, 1]);

  const triggerPulse = () => {
    springVal.set(1);
    setTimeout(() => springVal.set(0), 600);
  };

  const processDiff = useCallback(
    async (diff: string) => {
      if (!diff.trim()) return;

      setDropState("processing");
      triggerPulse();

      try {
        const { updateDocsFromDiff } = await import("@/services/api");
        const result = await updateDocsFromDiff(currentDocs, diff);

        if (result) {
          setChangesBullets(result.change_summary_bullets);
          onResult(result);
          setDropState("success");
          triggerPulse();
        } else {
          setDropState("error");
          onError?.();
        }
      } catch {
        setDropState("error");
        onError?.();
      }

      setTimeout(() => {
        if (dropState !== "idle") setDropState("idle");
      }, 3000);
    },
    [currentDocs, onResult, onError]
  );

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setDropState("idle");

      const file = e.dataTransfer.files[0];
      if (file) {
        const text = await file.text();
        setDiffText(text);
        processDiff(text);
        return;
      }

      const text = e.dataTransfer.getData("text/plain");
      if (text) {
        setDiffText(text);
        processDiff(text);
      }
    },
    [processDiff]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDropState("hovering");
  };

  const handleDragLeave = () => setDropState("idle");

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setDiffText(text);
    processDiff(text);
  };

  const handlePasteSubmit = () => {
    if (diffText.trim()) processDiff(diffText);
  };

  const borderColorMap: Record<DropState, string> = {
    idle: "var(--border)",
    hovering: "#6366f1",
    processing: "#f59e0b",
    success: "#10b981",
    error: "#ef4444",
  };

  const bgMap: Record<DropState, string> = {
    idle: "transparent",
    hovering: "rgba(99,102,241,0.04)",
    processing: "rgba(245,158,11,0.04)",
    success: "rgba(16,185,129,0.06)",
    error: "rgba(239,68,68,0.04)",
  };

  return (
    <div className="diff-injector">
      <div className="diff-header">
        <div className="input-badge">
          <span className="badge-dot badge-amber" />
          Live Diff Injector
        </div>
        <div className="diff-toggle">
          <button
            onClick={() => setIsPasteMode(false)}
            className={`toggle-btn ${!isPasteMode ? "active" : ""}`}
          >
            Drop
          </button>
          <button
            onClick={() => setIsPasteMode(true)}
            className={`toggle-btn ${isPasteMode ? "active" : ""}`}
          >
            Paste
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!isPasteMode ? (
          <motion.div
            key="drop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="drop-zone"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              animate={{
                borderColor: borderColorMap[dropState],
                backgroundColor: bgMap[dropState],
              }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              style={{ cursor: "pointer" }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".diff,.patch,text/plain"
                style={{ display: "none" }}
                onChange={handleFileInput}
              />

              <AnimatePresence mode="wait">
                {dropState === "processing" ? (
                  <motion.div key="proc" className="drop-state-content" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}>
                    <motion.div className="proc-spinner" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} />
                    <span className="drop-label">Analyzing diff…</span>
                  </motion.div>
                ) : dropState === "success" ? (
                  <motion.div key="success" className="drop-state-content" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}>
                    <span className="drop-icon success-icon">✓</span>
                    <span className="drop-label success-label">Diff injected</span>
                  </motion.div>
                ) : dropState === "error" ? (
                  <motion.div key="error" className="drop-state-content" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}>
                    <span className="drop-icon error-icon">✗</span>
                    <span className="drop-label error-label">Injection failed</span>
                  </motion.div>
                ) : (
                  <motion.div key="idle" className="drop-state-content" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}>
                    <div className="drop-icon-wrap">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                    </div>
                    <span className="drop-label">
                      {dropState === "hovering" ? "Release to inject" : "DROP REPO PATCH"}
                    </span>
                    <span className="drop-sublabel">.diff or .patch file · or click to browse</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Glow overlay */}
              <motion.div
                className="drop-glow"
                style={{ opacity: glowOpacity }}
              />
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="paste"
            className="paste-zone"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <textarea
              className="diff-textarea"
              value={diffText}
              onChange={(e) => setDiffText(e.target.value)}
              placeholder={"Paste raw git diff here…\n\ndiff --git a/file.py b/file.py\n--- a/file.py\n+++ b/file.py\n@@ -1,3 +1,4 @@"}
              rows={8}
              spellCheck={false}
            />
            <motion.button
              className="inject-btn"
              onClick={handlePasteSubmit}
              disabled={!diffText.trim() || dropState === "processing"}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              {dropState === "processing" ? "Injecting…" : "Inject Diff"}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Change summary */}
      <AnimatePresence>
        {changesBullets.length > 0 && (
          <motion.div
            className="change-summary"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
          >
            <p className="change-summary-title">Changes applied</p>
            <ul className="change-bullets">
              {changesBullets.map((bullet, i) => (
                <motion.li
                  key={i}
                  className="change-bullet"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25, delay: i * 0.06 }}
                >
                  {bullet}
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
