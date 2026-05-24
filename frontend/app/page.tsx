"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import InputCore from "@/components/InputCore";
import MermaidGraph from "@/components/MermaidGraph";
import SplitDeckManual from "@/components/SplitDeckManual";
import DiffInjector from "@/components/DiffInjector";

import ErrorModal from "@/components/ErrorModal";
import BentoGrid, { ProjectMeta } from "@/components/BentoGrid";
import { generateDocs } from "@/services/api";
import type { TechnicalDocumentationSchema, DiffUpdateSchema, ApiError } from "@/services/api";

export default function Home() {

  const [isLoading, setIsLoading] = useState(false);

  const [docData, setDocData] = useState<TechnicalDocumentationSchema | null>(null);

  const [activeDoc, setActiveDoc] = useState<string>("");

  const [apiError, setApiError] = useState<ApiError | null>(null);
  // Listen for API errors dispatched from the service layer

  useEffect(() => {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<ApiError>;
      setApiError(customEvent.detail);

    };
    window.addEventListener("docuagent:api-error", handler);

    return () => window.removeEventListener("docuagent:api-error", handler);

  }, []);
  const handleGenerate = useCallback(async (url: string) => {
    setIsLoading(true);
    setDocData(null);
    setActiveDoc("");
    const result = await generateDocs(url);
    if (result) {
      setDocData(result);
      setActiveDoc(result.documentation_markdown);
    }

    setIsLoading(false);

  }, []);
  const handleDiffResult = useCallback((result: DiffUpdateSchema) => {
    setActiveDoc(result.updated_documentation_markdown);
    if (docData) {

      setDocData({

        ...docData,

        documentation_markdown: result.updated_documentation_markdown,

      });

    }

  }, [docData]);
  const hasData = docData !== null;
  // ─── Original Working Layout Mappings (Do Not Modify) ───
  const bentoCards = [
    {
      id: "input",
      area: "input",
     className: "card-input",
      children: (
        <InputCore onSubmit={handleGenerate} isLoading={isLoading} />
      ),
    },

    ...(hasData
      ? [
          {
            id: "meta",
            area: "meta",
            className: "card-meta",
            children: <ProjectMeta data={docData!} />,

          },
          {
            id: "graph",
            area: "graph",
            className: "card-graph",
            children: (
              <div className="graph-card-inner">
                <div className="card-label">
                  <span className="label-dot label-dot-blue" />
                  Architecture
                </div>
                <MermaidGraph graph={docData!.mermaid_graph} />
              </div>

            ),
          },
          {
            id: "manual",
            area: "manual",
            className: "card-manual",
            children: (

              <SplitDeckManual

                documentation={activeDoc || docData!.documentation_markdown}

                prTemplate={docData!.pull_request_template}

              />

            ),
          },

          {

            id: "diff",

            area: "diff",

            className: "card-diff",

            children: (
              <DiffInjector
                currentDocs={activeDoc || docData!.documentation_markdown}
                onResult={handleDiffResult}
              />

            ),

          },

        ]

      : []),

  ];
  return (
    <>
      {/* Global header */}
      <header className="site-header">
        <motion.div
          className="header-inner"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}

        >
          <div className="logo">
            <div className="logo-mark">

              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">

                <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" />

                <polygon points="12 7 17 10 17 14 12 17 7 14 7 10 12 7" />
              </svg>
            </div>
            <span className="logo-text">DocuAgent</span>
            <span className="logo-tag">AI Engine</span>
          </div>
          <nav className="header-nav">
            <a href="http://localhost:8000/docs" target="_blank" rel="noopener noreferrer" className="nav-link">

              API Docs
            </a>
            <div className="status-pill">
              <motion.span
                className="status-dot"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              Ready
            </div>
          </nav>
        </motion.div>
      </header>

      {/* Main content */}
      <main className="main-content">
        <AnimatePresence mode="wait">
          {!hasData && !isLoading && (
            <motion.div
              key="hero"
              className="hero-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ type: "spring", stiffness: 280, damping: 28 }}
            >
              <h2 className="hero-headline">
                From code to docs,
                <br />
                <span className="hero-accent">in seconds.</span>
              </h2>
              <p className="hero-sub">
                Drop a GitHub URL. Multi-agent AI generates architecture diagrams, full documentation, and PR templates instantly.
              </p>

            </motion.div>

          )}

        </AnimatePresence>
        <BentoGrid cards={bentoCards} hasData={hasData} />
      </main>
      {/* Error modal */}

      <ErrorModal error={apiError} onDismiss={() => setApiError(null)} />
    </>
  );
}
