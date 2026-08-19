import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

/* الخط الأساسي للواجهة العربية — أوزان 400..700 (لا يوجد 900 في هذه العائلة،
   لذلك يُربط font-black بـ 700 في globals.css تفادياً للتغميق الصناعي
   الذي يشوّه اتصال الحروف العربية) */
const sansArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-sans-arabic",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

/* خط أحادي المسافة للمعرّفات اللاتينية: أرقام الطلبات والمعاملات و IBAN */
const mono = IBM_Plex_Mono({
  variable: "--font-mono-latin",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "لوحة مزوّد الخدمة | كار هيرو",
    template: "%s | كار هيرو",
  },
  description: "لوحة تحكّم مزوّدي الخدمة في كار هيرو — الطلبات والخدمات والأرباح.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      data-scroll-behavior="smooth"
      className={`dark ${sansArabic.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
