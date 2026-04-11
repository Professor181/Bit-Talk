import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
// 1. Notice the capital 'I' here
import { Inter } from "next/font/google"; 
import { Toaster } from "react-hot-toast";

// 2. And the capital 'I' here
const inter = Inter({ subsets: ["latin"] });
export const metadata: Metadata = {
  title: "ChatApp – Real-time Messaging",
  description: "WhatsApp-like chat app with Firebase",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning={true} className={inter.className}>
        <AuthProvider>
          {children}
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                background: "#1F2C33",
                color: "#E9EDEF",
                border: "1px solid #2A3942",
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}

