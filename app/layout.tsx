import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Priority Survey",
  description: "Help us understand what matters most to you",
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
