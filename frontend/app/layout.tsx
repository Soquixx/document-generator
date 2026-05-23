import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "DocuAgent AI Engine — Automated Technical Documentation",
  description:
    "Generate comprehensive technical documentation, architecture diagrams, and PR templates from any GitHub repository using multi-agent AI.",
  keywords: ["documentation", "AI", "GitHub", "architecture", "mermaid", "developer tools"],
  openGraph: {
    title: "DocuAgent AI Engine",
    description: "From code to docs, in seconds.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>{children}</body>
    </html>
  );
}
