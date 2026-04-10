"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { searchUsers, UserProfile, getOrCreateDirectChat } from "@/lib/firestore";
import Avatar from "./Avatar";
import toast from "react-hot-toast";

interface NewChatModalProps {
  onClose: () => void;
  onChatCreated: (chatId: string) => void;
}

export default function NewChatModal({ onClose, onChatCreated }: NewChatModalProps) {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!searchTerm.trim() || !user) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const users = await searchUsers(searchTerm, user.uid);
        setResults(users);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm, user]);

  const startChat = async (otherUser: UserProfile) => {
    if (!user) return;
    try {
      const chatId = await getOrCreateDirectChat(user.uid, otherUser.uid);
      onChatCreated(chatId);
      onClose();
    } catch (err: any) {
      toast.error("Failed to open chat");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-brand-sidebar rounded-2xl shadow-2xl border border-brand-sidebarBorder w-full max-w-md animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-brand-sidebarBorder">
          <h2 className="text-lg font-semibold text-brand-text">New Chat</h2>
          <button onClick={onClose} className="text-brand-subtext hover:text-brand-text p-1 rounded-full hover:bg-brand-sidebarHover transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-brand-sidebarBorder">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-subtext" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              autoFocus
              type="text"
              placeholder="Search by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-brand-sidebarHover border border-brand-sidebarBorder rounded-xl pl-10 pr-4 py-2.5 text-brand-text placeholder-brand-subtext focus:outline-none focus:border-brand-green transition-colors text-sm"
            />
          </div>
        </div>

        {/* Results */}
        <div className="max-h-72 overflow-y-auto">
          {loading && (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-brand-green border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {!loading && searchTerm && results.length === 0 && (
            <div className="text-center py-8 text-brand-subtext text-sm">
              No users found for &ldquo;{searchTerm}&rdquo;
            </div>
          )}
          {!loading && !searchTerm && (
            <div className="text-center py-8 text-brand-subtext text-sm">
              Type a name to search for users
            </div>
          )}
          {results.map((u) => (
            <button
              key={u.uid}
              onClick={() => startChat(u)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-brand-sidebarHover transition-colors text-left"
            >
              <Avatar name={u.displayName} photoURL={u.photoURL} size="md" online={u.online} />
              <div>
                <p className="text-brand-text font-medium text-sm">{u.displayName}</p>
                <p className="text-brand-subtext text-xs">{u.email}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
