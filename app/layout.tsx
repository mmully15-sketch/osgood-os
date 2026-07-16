import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Osgood OS",
  description: "Internal venue sales and operations system for The Osgood."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
