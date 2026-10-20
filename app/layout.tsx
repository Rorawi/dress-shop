import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "Charwin Stores | Style, made yours",
    template: "%s | Charwin Stores",
  },
  description:
    "Discover clothing and intimates selected for everyday confidence. Browse Charwin Stores and order directly on WhatsApp.",
  applicationName: "Charwin Stores",
  openGraph: {
    title: "Charwin Stores | Style, made yours",
    description: "Clothing and intimates, selected with care.",
    siteName: "Charwin Stores",
    type: "website",
    images: [
      {
        url: "/brand/charwin-stores-logo.jpg",
        width: 960,
        height: 960,
        alt: "Charwin Stores logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Charwin Stores | Style, made yours",
    description: "Clothing and intimates, selected with care.",
    images: ["/brand/charwin-stores-logo.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-GH" className={`${playfair.variable} ${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
