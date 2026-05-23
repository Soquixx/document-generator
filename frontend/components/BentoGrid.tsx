"use client";

import { motion } from "framer-motion";
import type { TechnicalDocumentationSchema } from "@/services/api";
import type { ReactNode } from "react";

interface BentoCard {
  id: string;
  area: string;
  children: ReactNode;
  label?: string;
  className?: string;
}

interface BentoGridProps {
  cards: BentoCard[];
  hasData: boolean;
}

const cardVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 280,
      damping: 28,
      delay: i * 0.08,
    },
  }),
};

export function ProjectMeta({ data }: { data: TechnicalDocumentationSchema }) {
  return (
    <motion.div
      className="project-meta"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
    >
      <div className="meta-inner">
        <h1 className="project-title">{data.project_title}</h1>
        <p className="project-summary">{data.executive_summary}</p>
      </div>

      <div className="components-row">
        {data.components.map((comp, i) => (
          <motion.div
            key={i}
            className="comp-chip"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.1 + i * 0.05 }}
            title={comp.purpose}
          >
            <span className="comp-chip-dot" />
            {comp.name}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

export default function BentoGrid({ cards, hasData }: BentoGridProps) {
  return (
    <motion.div
      className={`bento-grid ${hasData ? "bento-expanded" : "bento-compact"}`}
      layout
      transition={{ type: "spring", stiffness: 200, damping: 30 }}
    >
      {cards.map((card, i) => (
        <motion.div
          key={card.id}
          className={`bento-card ${card.className ?? ""}`}
          style={{ gridArea: card.area }}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          custom={i}
          layout
          transition={{ type: "spring", stiffness: 200, damping: 30 }}
        >
          {card.children}
        </motion.div>
      ))}
    </motion.div>
  );
}
