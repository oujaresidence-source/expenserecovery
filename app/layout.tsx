import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "استعادة مصاريف الشقق",
  description: "نموذج عربي طويل لإعادة بناء مصاريف الشقق من ذاكرة المؤسس.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
