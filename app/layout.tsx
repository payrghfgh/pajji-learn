// app/layout.tsx

import { Inter, Syne } from "next/font/google";
import "./globals.css";
import { PremiumBackground } from "./components/PremiumBackground";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
});

export const metadata = {
  title: "Pajji Learn | Master Your Future",
  description: "A premium, high-octane learning dashboard for the next generation of scholars.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${syne.variable}`}>
      <body className="font-sans antialiased" style={{ color: "var(--text)", backgroundColor: "var(--bg)" }}>
        <PremiumBackground />
        <main className="relative z-0 min-h-screen">
          {children}
        </main>
      </body>
    </html>
  )
}