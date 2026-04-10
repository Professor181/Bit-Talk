"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Sidebar from "@/components/chat/Sidebar";
import ChatWindow from "@/components/chat/ChatWindow";

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<"sidebar" | "chat">("sidebar");
  
  // 1. Add the mounted state to prevent hydration mismatch
  const [mounted, setMounted] = useState(false);

  // 2. Set mounted to true once the component loads in the browser
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router, mounted]);

  const handleSelectChat = (chatId: string) => {
    setActiveChatId(chatId);
    setMobileView("chat");
  };

  const handleBackToSidebar = () => {
    setMobileView("sidebar");
  };

  // 3. Show the loading screen if we are waiting on Auth OR waiting for the browser to mount
  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-chatBg">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-brand-green border-t-transparent rounded-full animate-spin" />
          <p className="text-brand-subtext text-sm">Loading ChatApp...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="h-screen flex overflow-hidden bg-brand-chatBg">
      {/* ── Desktop Layout ── */}
      <div className="hidden md:flex w-full h-full">
        {/* Sidebar */}
        <div className="w-[380px] flex-shrink-0 h-full">
          <Sidebar activeChatId={activeChatId} onSelectChat={handleSelectChat} />
        </div>

        {/* Chat area */}
        <div className="flex-1 h-full">
          {activeChatId ? (
            <ChatWindow key={activeChatId} chatId={activeChatId} />
          ) : (
            <WelcomeScreen />
          )}
        </div>
      </div>

      {/* ── Mobile Layout ── */}
      <div className="flex md:hidden w-full h-full">
        {mobileView === "sidebar" ? (
          <div className="w-full h-full">
            <Sidebar activeChatId={activeChatId} onSelectChat={handleSelectChat} />
          </div>
        ) : (
          <div className="w-full h-full">
            {activeChatId ? (
              <ChatWindow
                key={activeChatId}
                chatId={activeChatId}
                onBack={handleBackToSidebar}
              />
            ) : (
              <WelcomeScreen onBack={handleBackToSidebar} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function WelcomeScreen({ onBack }: { onBack?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-brand-chatBg px-6">
      {onBack && (
        <button
          onClick={onBack}
          className="absolute top-4 left-4 text-brand-subtext hover:text-brand-text p-2"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
          </svg>
        </button>
      )}

      {/* Decorative ring */}
      <div className="relative mb-8">
        <div className="w-32 h-32 rounded-full border-4 border-brand-teal/30 flex items-center justify-center">
          <div className="w-24 h-24 rounded-full border-4 border-brand-green/40 flex items-center justify-center">
            <div className="w-16 h-16 bg-brand-teal/20 rounded-full flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-9 h-9 fill-brand-green">
                <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2.546 20.7a1 1 0 001.282 1.282l3.532-.892A9.96 9.96 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/>
              </svg>
            </div>
          </div>
        </div>
        {/* Decorative dots */}
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-brand-green rounded-full opacity-70"/>
        <div className="absolute -bottom-2 -left-2 w-3 h-3 bg-brand-teal rounded-full opacity-50"/>
      </div>

      <h2 className="text-2xl font-bold text-brand-text mb-3">ChatApp</h2>
      <p className="text-brand-subtext text-center max-w-sm leading-relaxed">
        Send and receive messages, create groups, and stay connected — all in real time.
      </p>

      <div className="mt-8 grid grid-cols-3 gap-6 text-center">
        {[
          { icon: "🔒", label: "End-to-end messaging" },
          { icon: "👥", label: "Group chats" },
          { icon: "⚡", label: "Real-time updates" },
        ].map((f) => (
          <div key={f.label} className="flex flex-col items-center gap-1.5">
            <span className="text-2xl">{f.icon}</span>
            <span className="text-brand-subtext text-xs">{f.label}</span>
          </div>
        ))}
      </div>

      <p className="mt-10 text-brand-subtext text-sm text-center">
        Select a chat on the left to get started
      </p>
    </div>
  );
}