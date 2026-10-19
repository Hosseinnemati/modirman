import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { PwaRegister } from "@/components/app/pwa-register";

export const metadata: Metadata = {
  title: "مدیرمن | مدیریت هوشمند ساختمان",
  description:
    "مدیرمن - اپلیکیشن مدیریت هوشمند ساختمان با تقویم شمسی و یادآوری، مدیریت قبض‌ها، اعلان‌ها، درخواست‌های تعمیرات و ارتباط ساکنین",
  applicationName: "مدیرمن",
  keywords: ["مدیرمن", "مدیریت ساختمان", "تقویم شمسی", "یادآوری", "شارژ", "ساکنین", "قبض", "تعمیرات"],
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/images/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/images/app-icon.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/images/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "مدیرمن",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#2563eb",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css"
        />
      </head>
      <body className="antialiased bg-background text-foreground font-vazir">
        {children}
        <Toaster />
        <PwaRegister />
      </body>
    </html>
  );
}
