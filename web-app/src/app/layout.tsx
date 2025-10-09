import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { PreferencesProvider } from "@/lib/preferences/context";

export const metadata: Metadata = {
  title: "Inbox Triage App",
  description: "A web-based email triage companion that helps you summarise email threads, understand attachments and generate reply drafts — all running primarily on-device using Chrome's built-in AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <PreferencesProvider>
          <Sidebar>
            {children}
          </Sidebar>
        </PreferencesProvider>
      </body>
    </html>
  );
}
