import type { Metadata } from "next";
import { Inter, Cinzel } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Artfolio — Your Art. Your Space.",
  description:
    "A decentralized digital art-sharing platform where users publish their artwork, discover creative works, and appreciate other artists on Botchain.",
  keywords: ["Artfolio", "Web3 Art", "Digital Gallery", "Botchain", "Solidity", "Crypto Art"],
  icons: {
    icon: "/icon.svg",
  },
  openGraph: {
    title: "Artfolio — Your Art. Your Space.",
    description: "Decentralized digital art exhibition platform on Botchain.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${cinzel.variable} dark`}>
      <body className="bg-[#111116] text-[#FFFFFF] antialiased selection:bg-[#B69CFF] selection:text-[#111116]">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

