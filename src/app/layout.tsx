import type { Metadata } from "next";
import { Poppins, Inter, Outfit, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ErrorHandlerProvider } from "@/components/providers/error-handler-provider";
import { SchoolBrandingProvider } from "@/contexts/school-branding";

// ── Font Preload Strategy ──
// Preload critical fonts for faster text rendering
// Using 'swap' display for progressive enhancement

// Primary UI font - Preloaded for immediate text visibility
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  preload: true, // Ensure font file is preloaded
  adjustFontFallback: true, // Reduce layout shift during font swap
});

// Secondary UI font - Used for body text
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  preload: true,
  adjustFontFallback: true,
});

// Display font - Used for headings and emphasis
const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  preload: true,
  adjustFontFallback: true,
});

// Monospace font - Used for code and technical content
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
  preload: false, // Monospace fonts are less critical, can lazy-load
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
        suppressHydrationWarning
        className={`${poppins.variable} ${inter.variable} ${outfit.variable} ${jetbrainsMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SchoolBrandingProvider>
            <ErrorHandlerProvider>{children}</ErrorHandlerProvider>
          </SchoolBrandingProvider>
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
