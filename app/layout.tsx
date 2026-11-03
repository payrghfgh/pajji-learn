// app/layout.tsx

import { Inter, Syne, Bricolage_Grotesque, Plus_Jakarta_Sans, Azeret_Mono } from "next/font/google";
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

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
});

const azeret = Azeret_Mono({
  subsets: ["latin"],
  variable: "--font-azeret",
});

export const metadata = {
  title: "Pajji Learn",
  description: "A premium, high-octane learning dashboard for the next generation of scholars.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${syne.variable} ${bricolage.variable} ${jakarta.variable} ${azeret.variable}`}>
      <body className="font-sans antialiased" style={{ color: "var(--text)", backgroundColor: "var(--bg)" }}>
        <PremiumBackground />
        <main className="relative z-0 min-h-screen">
          {children}
        </main>
      </body>
    </html>
  )
}