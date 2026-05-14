import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KinderCare System",
  description: "Kindergarten Management System",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
