"use client";

import { useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ApiError } from "@/services/api";

interface ErrorModalProps {
  error: ApiError | null;
  onDismiss: () => void;
}

const TYPE_CONFIG = {
  network: {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M1 6s4-2 11-2 11 2 11 2" />
        <path d="M1 12s4-2 11-2 11 2 11 2" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </svg>
    ),
    label: "Connection Failed",
    accent: "#ef4444",
  },
  server: {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
        <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
        <line x1="6" y1="6" x2="6.01" y2="6" />
        <line x1="6" y1="18" x2="6.01" y2="18" />
      </svg>
    ),
    label: "Server Error",
    accent: "#f59e0b",
  },
  validation: {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
    label: "Invalid Response",
    accent: "#6366f1",
  },
};

export default function ErrorModal({ error, onDismiss }: ErrorModalProps) {
  const config = error ? TYPE_CONFIG[error.type] : TYPE_CONFIG.network;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onDismiss();
    },
    [onDismiss]
  );

  useEffect(() => {
    if (error) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [error, handleKeyDown]);

  return (
    <AnimatePresence>
      {error && (
        <>
          {/* Backdrop */}
          <motion.div
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onDismiss}
          />

          {/* Modal panel */}
          <motion.div
            className="modal-panel"
            role="alertdialog"
            aria-modal="true"
            aria-label={config.label}
            initial={{ scale: 0.88, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.88, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            {/* Accent line */}
            <div
              className="modal-accent"
              style={{ backgroundColor: config.accent }}
            />

            <div className="modal-body">
              <div
                className="modal-icon-wrap"
                style={{ color: config.accent, backgroundColor: `${config.accent}15` }}
              >
                {config.icon}
              </div>

              <div className="modal-text">
                <h3 className="modal-title">{config.label}</h3>
                <p className="modal-message">{error.message}</p>

                {error.type === "network" && (
                  <div className="modal-hint">
                    <code className="modal-code">uvicorn main:app --reload</code>
                    <span className="modal-hint-text">Start the backend on port 8000</span>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-actions">
              <motion.button
                className="modal-retry-btn"
                onClick={onDismiss}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
              >
                Dismiss
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
