import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "IS455 Demo Store",
  description: "Simple class demonstration storefront with Supabase backend"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
