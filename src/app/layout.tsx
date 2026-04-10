import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "react-hot-toast";

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
      <body>
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


git add .
git commit -m "Initial commit - app is working"
git branch -M main
git remote add origin https://github.com/Professor181/Bit-Talk.git
git push -u origin main