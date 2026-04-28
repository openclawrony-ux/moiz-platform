import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Specsmith — turn product notes into a tight spec",
  description:
    "Paste a brain dump, a meeting transcript, or a PRD draft. Specsmith returns a structured, reviewable engineering spec.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
