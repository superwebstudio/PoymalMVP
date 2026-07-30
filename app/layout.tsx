import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/AppShell";
import { AuthBootstrap } from "@/components/AuthBootstrap";
import { NotificationContainer } from "@/components/Notification";
import { NotificationListener } from "@/components/NotificationListener";
import { QueryProvider } from "@/providers/QueryProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Poymal - Fishing Logbook",
  description: "A fishing logbook app for anglers",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="app-phone-shell" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <QueryProvider>
          <AuthBootstrap />
          <AppShell>
            <NotificationContainer />
            <NotificationListener />
            {children}
          </AppShell>
        </QueryProvider>
      </body>
    </html>
  );
}
