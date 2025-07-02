import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { NextAuthProvider } from "./providers"; // <--- 추가

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Barim App",
  description: "GitHub Issue based TODO app",
};

export default function RootLayout({
                                     children,
                                   }: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <html lang="en">
      <body className={inter.className}>
      <NextAuthProvider>{children}</NextAuthProvider> {/* <--- 수정 */}
      </body>
      </html>
  );
}