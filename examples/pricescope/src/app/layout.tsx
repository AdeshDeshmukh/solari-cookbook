import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PriceScope — Real-Time SaaS Pricing Intelligence Engine",
  description: "Scrape, compare, and audit SaaS pricing across multiple countries simultaneously using Solari cloud browser fleet.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased min-h-screen bg-slate-950 text-slate-100">
        {children}
      </body>
    </html>
  );
}
