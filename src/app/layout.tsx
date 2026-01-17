 import type { Metadata } from "next";
  import { Inter } from "next/font/google";
  import { Analytics } from "@vercel/analytics/react";
  import "./globals.css";

  const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter"
  });

  export const metadata: Metadata = {
    title: "Decision Brief AI - Transform Notes Into Board-Ready Briefs",
    description: "AI-powered executive summaries in 30 seconds. Upload documents or paste text to generate structured decision briefs through 5 strategic lenses.",
  };

  export default function RootLayout({
    children,
  }: Readonly<{
    children: React.ReactNode;
  }>) {
    return (
      <html lang="en">
        <body className={`${inter.variable} font-sans antialiased`}>
          {children}
          <Analytics />
        </body>
      </html>
    );
  }
