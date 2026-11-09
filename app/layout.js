import { Outfit, Space_Grotesk } from "next/font/google";
import "./globals.css";
import CampaignLayer from "../components/CampaignLayer";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata = {
  title: "Sparkle Beverages | Chill. Sip. Sparkle.",
  description: "Must be Chill. Sip. Sparkle. Your ultimate campus fuel packed in grab-and-go pouches.",
  manifest: "/manifest.json", // 🚨 THIS TURNS YOUR SITE INTO A NATIVE APP
};

// Paints a live campaign's colours before the page appears (no flash on repeat visits).
const EARLY_THEME_SCRIPT = `(function(){try{var raw=localStorage.getItem('sparkleThemeCss');if(!raw)return;var s=JSON.parse(raw);var t=new Date().toISOString().slice(0,10);if(!s||!s.css||t<s.start||t>s.end)return;var p=location.pathname;if(p.indexOf('/admin')===0||p.indexOf('/checkout')===0)return;if(sessionStorage.getItem('sparklePreviewTemplate'))return;var e=document.createElement('style');e.id='sparkle-theme-style';e.textContent=s.css;document.head.appendChild(e);}catch(e){}})();`;

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: EARLY_THEME_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <CampaignLayer />
        {children}
      </body>
    </html>
  );
}
