import type { Metadata } from "next";
import { Poppins, Inter, Outfit, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/components/providers/session-provider";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
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
        className={`${poppins.variable} ${inter.variable} ${outfit.variable} ${jetbrainsMono.variable} antialiased bg-background text-foreground`}
      >
        <AuthProvider>{children}</AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
