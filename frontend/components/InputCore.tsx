"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface InputCoreProps {
  onSubmit: (url: string) => void;
  isLoading: boolean;
}

const WIREFRAME_LINES = [
  { w: "60%", delay: 0 },
  { w: "85%", delay: 0.08 },
  { w: "45%", delay: 0.16 },
  { w: "70%", delay: 0.24 },
  { w: "55%", delay: 0.32 },
  { w: "80%", delay: 0.4 },
  { w: "40%", delay: 0.48 },
];

export default function InputCore({ onSubmit, isLoading }: InputCoreProps) {
  const [url, setUrl] = useState("");
  const [validationError, setValidationError] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const validate = (val: string) => {
    if (!val.trim()) return "Please enter a GitHub repository URL.";
    try {
      const u = new URL(val.trim());
      if (!u.hostname.includes("github.com"))
        return "URL must be a github.com repository.";
      return "";
    } catch {
      return "Enter a valid URL (e.g. https://github.com/user/repo).";
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate(url);
    if (err) {
      setValidationError(err);
      return;
    }
    setValidationError("");
    onSubmit(url.trim());
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
    if (validationError) setValidationError("");
  };

  return (
    <div className="input-core">
      <div className="input-core-header">
        <div className="input-badge">
          <span className="badge-dot" />
          Input Core
        </div>
        <p className="input-subtitle">Generate full documentation from any public GitHub repo</p>
      </div>

      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            className="wireframe-loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="wireframe-header">
              <div className="wf-circle" />
              <div className="wf-circle" />
              <div className="wf-circle" />
            </div>
            <div className="wireframe-lines">
              {WIREFRAME_LINES.map((line, i) => (
                <motion.div
                  key={i}
                  className="wf-line"
                  style={{ width: line.w }}
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{
                    duration: 1.4,
                    repeat: Infinity,
                    delay: line.delay,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </div>
            <div className="wireframe-status">
              <motion.span
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.2, repeat: Infinity }}
                className="wf-status-text"
              >
                Orchestrating agents
              </motion.span>
              <div className="wf-dots">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="wf-dot"
                    animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.18 }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="input-form"
          >
            <div className={`input-field-wrap ${isFocused ? "focused" : ""} ${validationError ? "error" : ""}`}>
              <div className="input-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                </svg>
              </div>
              <input
                ref={inputRef}
                type="text"
                value={url}
                onChange={handleChange}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder="https://github.com/owner/repository"
                className="input-field"
                disabled={isLoading}
                autoComplete="off"
                spellCheck={false}
              />
            </div>

            <AnimatePresence>
              {validationError && (
                <motion.p
                  className="input-error"
                  initial={{ opacity: 0, height: 0, y: -4 }}
                  animate={{ opacity: 1, height: "auto", y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                >
                  {validationError}
                </motion.p>
              )}
            </AnimatePresence>

            <motion.button
              type="submit"
              className="submit-btn"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              <span>Generate Documentation</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </motion.button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
