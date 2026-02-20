import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "If AI Worked For You...",
  description: "What would you want your AI employee to tackle first?",
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
