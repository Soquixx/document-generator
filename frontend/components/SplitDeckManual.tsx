"use client";

import { useState, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";


interface SplitDeckManualProps {
  documentation: string;
  prTemplate: string;
}

const TABS = ["Documentation", "PR Template"] as const;
type Tab = (typeof TABS)[number];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.button
      onClick={handleCopy}
      className="copy-btn"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.93 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
    >
      <AnimatePresence mode="wait">
        {copied ? (
          <motion.span
            key="check"
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.7, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            ✓ Copied
          </motion.span>
        ) : (
          <motion.span
            key="copy"
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.7, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            Copy
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

export default function SplitDeckManual({ documentation, prTemplate }: SplitDeckManualProps) {
  const [activeTab, setActiveTab] = useState<Tab>("Documentation");
  const tabId = useId();

  const content = activeTab === "Documentation" ? documentation : prTemplate;

  return (
    <div className="split-deck">
      {/* Tab navigator */}
      <div className="tab-nav" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab}
            role="tab"
            aria-selected={activeTab === tab}
            aria-controls={`${tabId}-panel`}
            onClick={() => setActiveTab(tab)}
            className={`tab-pill ${activeTab === tab ? "active" : ""}`}
          >
            {activeTab === tab && (
              <motion.span
                layoutId={`${tabId}-capsule`}
                className="tab-capsule"
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
              />
            )}
            <span className="tab-label">{tab}</span>
          </button>
        ))}

        <div className="tab-spacer" />
        <CopyButton text={content} />
      </div>

      {/* Content panel */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          role="tabpanel"
          id={`${tabId}-panel`}
          className="tab-content"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
            components={{
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              code({ node: _node, inline, className, children, ...props }: any) {
                const match = /language-(\w+)/.exec(className ?? "");
                return !inline && match ? (
                  <SyntaxHighlighter
                    style={oneLight}
                    language={match[1]}
                    PreTag="div"
                    customStyle={{
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      borderRadius: "10px",
                      padding: "1rem",
                      fontSize: "0.8em",
                      fontFamily: "'Geist Mono', monospace",
                    }}
                  >
                    {String(children).replace(/\n$/, "")}
                  </SyntaxHighlighter>
                ) : (
                  <code className={`inline-code ${className ?? ""}`} {...props}>
                    {children}
                  </code>
                );
              },
              h1: ({ children }) => <h1 className="md-h1">{children}</h1>,
              h2: ({ children }) => <h2 className="md-h2">{children}</h2>,
              h3: ({ children }) => <h3 className="md-h3">{children}</h3>,
              p: ({ children }) => <p className="md-p">{children}</p>,
              blockquote: ({ children }) => (
                <blockquote className="md-blockquote">{children}</blockquote>
              ),
              ul: ({ children }) => <ul className="md-ul">{children}</ul>,
              ol: ({ children }) => <ol className="md-ol">{children}</ol>,
              li: ({ children }) => <li className="md-li">{children}</li>,
              a: ({ children, href }) => (
                <a href={href} className="md-link" target="_blank" rel="noopener noreferrer">
                  {children}
                </a>
              ),
              table: ({ children }) => (
                <div className="md-table-wrap">
                  <table className="md-table">{children}</table>
                </div>
              ),
              hr: () => <hr className="md-hr" />,
            }}
          >
            {content}
          </ReactMarkdown>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
