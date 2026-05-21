import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import { TRPCReactProvider } from "@/trpc/react";
import { NavBar } from "@/components/nav-bar";
import { auth } from "@/lib/auth";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tractor",
  description: "Customer, Order & Payment management",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth.api.getSession({ headers: await headers() }).catch(() => null);
  const isAuthed = !!session;

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen bg-background font-sans antialiased">
        <TRPCReactProvider>
          {isAuthed && <NavBar />}
          <main
            className={
              isAuthed
                ? "pb-16 md:pb-0 md:pl-56 min-h-screen"
                : "min-h-screen"
            }
          >
            {children}
          </main>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
