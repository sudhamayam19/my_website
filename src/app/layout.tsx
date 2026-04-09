import type { Metadata } from "next";
import { Alegreya, Alegreya_Sans } from "next/font/google";
import Script from "next/script";
import { ChatWidget } from "@/components/ChatWidget";
import { DailyDoseBanner } from "@/components/DailyDoseBanner";
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
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://sudhamayam.vercel.app"),
  title: {
    default: "Sudha Devarakonda | RJ | Translator | Voice Artist",
    template: "%s | Sudha Devarakonda",
  },
  description:
    "Official website frontend for Sudha Devarakonda. Explore blog posts, media highlights, and admin-ready content management UI.",
  openGraph: {
    title: "Sudha Devarakonda | RJ | Translator | Voice Artist",
    description:
      "Official website frontend for Sudha Devarakonda. Explore blog posts, media highlights, and admin-ready content management UI.",
    type: "website",
    images: [
      {
        url: "/api/og",
        width: 1200,
        height: 630,
        alt: "Sudha Devarakonda social preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sudha Devarakonda | RJ | Translator | Voice Artist",
    description:
      "Official website frontend for Sudha Devarakonda. Explore blog posts, media highlights, and admin-ready content management UI.",
    images: ["/api/og"],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const adsensePublisherId = process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID;

  return (
    <html lang="en" className="scroll-smooth">
      <head>
        {adsensePublisherId && (
          <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsensePublisherId}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        )}
      </head>
      <body className={`${editorialDisplay.variable} ${editorialBody.variable} antialiased`}>
        <DailyDoseBanner />
        {children}
        <ChatWidget />
        {gaMeasurementId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaMeasurementId}');
              `}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
