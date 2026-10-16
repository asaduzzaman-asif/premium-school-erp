import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast"; // নতুন ইম্পোর্ট

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Premium School ERP",
  description: "A complete management system for educational institutions",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Toaster position="top-right" reverseOrder={false} /> {/* যুক্ত করা হলো */}
        {children}
      </body>
    </html>
  );
}