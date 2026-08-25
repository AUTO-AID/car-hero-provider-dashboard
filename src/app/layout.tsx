import type { Metadata } from "next";
import { Cairo, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

/**
 * الخط الأساسي: **Cairo**.
 *
 * كان IBM Plex Sans Arabic، وهو خط نصّي رفيع الحروف مصمَّم للمتون الطويلة —
 * فبدا في واجهة كثيفة الأزرار والشارات باهتاً وصعب القراءة على شاشة داكنة،
 * خصوصاً في المقاسات الصغيرة. Cairo أعرض ريشةً وأوضح عدّادات، وهو الخط
 * السائد في واجهات التحكّم العربية، ويصل إلى الوزن 1000 فلا يحتاج المتصفّح
 * إلى تغميق صناعي يشوّه اتصال الحروف.
 */
const sansArabic = Cairo({
  variable: "--font-sans-arabic",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700", "800"],
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
