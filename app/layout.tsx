/* ============================================
   Root Layout
   Wraps the entire app. Sets up fonts, metadata,
   and the global page structure.
   Includes an instant loading screen that shows
   before any JS loads (pure HTML/CSS).
   ============================================ */

import type { Metadata, Viewport } from "next";
import { Barlow_Condensed, Barlow, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import ServiceWorkerRegister from "@/components/layout/ServiceWorkerRegister";

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-barlow-condensed",
  display: "swap",
});

const barlow = Barlow({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-barlow",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "BARRAX",
  description: "Military-themed personal fitness and nutrition PWA",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "BARRAX",
  },
};

export const viewport: Viewport = {
  themeColor: "#0C0C0C",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${barlowCondensed.variable} ${barlow.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        {/* Inline loading screen styles — renders INSTANTLY before any JS */}
        <style dangerouslySetInnerHTML={{ __html: `
          #barrax-splash {
            position: fixed;
            inset: 0;
            z-index: 9999;
            background: #0C0C0C;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            transition: opacity 0.4s ease-out;
          }
          #barrax-splash.hide {
            opacity: 0;
            pointer-events: none;
          }
          #barrax-splash h1 {
            font-family: Arial Narrow, sans-serif;
            font-size: 2.5rem;
            font-weight: 700;
            letter-spacing: 0.2em;
            text-transform: uppercase;
            color: #C4B090;
            margin: 0;
          }
          #barrax-splash p {
            font-family: Courier New, monospace;
            font-size: 0.7rem;
            letter-spacing: 0.15em;
            text-transform: uppercase;
            color: #7A7A6E;
            margin-top: 12px;
          }
          #barrax-splash .bar-track {
            width: 120px;
            height: 3px;
            background: #1A221A;
            margin-top: 24px;
            overflow: hidden;
          }
          #barrax-splash .bar-fill {
            height: 100%;
            width: 40%;
            background: #4A6B3A;
            animation: splash-slide 1.2s ease-in-out infinite;
          }
          @keyframes splash-slide {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(350%); }
          }
        `}} />
      </head>
      <body className="min-h-dvh flex flex-col bg-bg-primary text-text-primary">
        {/* Loading splash — visible instantly, hidden when React hydrates */}
        <div id="barrax-splash">
          <h1>BARRAX</h1>
          <p>Loading systems</p>
          <div className="bar-track">
            <div className="bar-fill" />
          </div>
        </div>

        {/* Script to hide splash once the page content is ready */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            // Hide splash when Next.js finishes rendering
            // Uses requestIdleCallback for smoothness, falls back to setTimeout
            function hideSplash() {
              var el = document.getElementById('barrax-splash');
              if (el) {
                el.classList.add('hide');
                setTimeout(function() { el.remove(); }, 500);
              }
            }
            if (document.readyState === 'complete') {
              hideSplash();
            } else {
              window.addEventListener('load', function() {
                // Small delay so the page has time to paint
                setTimeout(hideSplash, 200);
              });
            }
          })();
        `}} />

        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
