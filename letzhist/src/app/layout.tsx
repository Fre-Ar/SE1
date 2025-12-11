import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/auth-context";
import Header from "@/components/header";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LëtzHist",
  description: "Local History documentation web app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
           <Header showSearch={true}/> {/*TODO: MOVE HEADER TO PAGES*/}
           {children}
        </AuthProvider>
      </body>
    </html>
  );
}