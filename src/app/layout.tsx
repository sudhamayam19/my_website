import type { Metadata } from "next";
import { Alegreya, Alegreya_Sans } from "next/font/google";
import "./globals.css";

const editorialDisplay = Alegreya({
  variable: "--font-editorial-display",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const editorialBody = Alegreya_Sans({
  variable: "--font-editorial-body",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Sudha Devarakonda | RJ | Translator | Voice Artist",
    template: "%s | Sudha Devarakonda",
  },
  description:
    "Official website frontend for Sudha Devarakonda. Explore blog posts, media highlights, and admin-ready content management UI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${editorialDisplay.variable} ${editorialBody.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
