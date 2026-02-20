import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "If AI Worked For You...",
  description: "What would you want your AI employee to tackle first?",
  openGraph: {
    title: "If AI Worked For You...",
    description: "What would you want your AI employee to tackle first? Take this quick survey and tell us which problems matter most.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "If AI Worked For You...",
    description: "What would you want your AI employee to tackle first? Take this quick survey and tell us which problems matter most.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
