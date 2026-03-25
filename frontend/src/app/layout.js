import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata = {
  title: "SwachhTech | Command Center",
  description: "Municipal waste intelligence and operations platform.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.className}>
      <body className="antialiased bg-[#F5F7FA] min-h-screen">
        {children}
      </body>
    </html>
  );
}
