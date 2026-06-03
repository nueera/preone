import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PreOne - Operating System for Modern Preschools",
  description: "All-in-one preschool ERP system for managing students, teachers, attendance, fees, admissions, growth tracking, and communication. Built for modern preschools.",
  keywords: ["PreOne", "Preschool ERP", "Preschool Management", "Education", "Student Management", "Fee Management", "Attendance", "Admission CRM"],
  authors: [{ name: "PreOne Team" }],
  icons: {
    icon: "/preonelogo.png",
  },
  openGraph: {
    title: "PreOne - Operating System for Modern Preschools",
    description: "All-in-one preschool ERP system for managing students, teachers, attendance, fees, admissions, and growth tracking",
    url: "https://preone.edu",
    siteName: "PreOne",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PreOne - Operating System for Modern Preschools",
    description: "All-in-one preschool ERP system for modern preschools",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
