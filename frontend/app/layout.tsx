import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MMA Fight Predictor",
  description: "Voorspel de winnaar van een MMA gevecht",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl">
      <body>{children}</body>
    </html>
  );
}