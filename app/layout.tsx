import type { Metadata } from "next";
import { Toaster } from "sonner";
import { deezerFont } from "./fonts";
import "./globals.css";
import { SessionProvider } from "@/components/providers";

export const metadata: Metadata = {
  title: "Deezer Pilot | AI Music Concierge",
  description: "Your personal AI music curator powered by Deezer",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${deezerFont.variable} antialiased bg-background text-foreground`}
      >
        <SessionProvider>
          {children}
          <Toaster richColors position="bottom-right" theme="dark" />
        </SessionProvider>
      </body>
    </html>
  );
}
