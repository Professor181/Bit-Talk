"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useChats } from "@/hooks/useChats";
import { Chat, UserProfile } from "@/lib/firestore";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import ChatListItem from "./ChatListItem";
import NewChatModal from "./NewChatModal";
import CreateGroupModal from "./CreateGroupModal";
import Avatar from "./Avatar";
import toast from "react-hot-toast";

interface SidebarProps {
  activeChatId: string | null;
  onSelectChat: (chatId: string) => void;
}

export default function Sidebar({ activeChatId, onSelectChat }: SidebarProps) {
  const { user, signOut } = useAuth();
  const { chats, loading } = useChats();
  const [otherUsers, setOtherUsers] = useState<Map<string, UserProfile>>(new Map());
  const [searchTerm, setSearchTerm] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // Fetch other user profiles for direct chats
  useEffect(() => {
    if (!user || chats.length === 0) return;

    const uidsToFetch = new Set<string>();
    chats.forEach((chat) => {
      if (chat.type === "direct") {
        const otherId = chat.members.find((id) => id !== user.uid);
        if (otherId && !otherUsers.has(otherId)) {
          uidsToFetch.add(otherId);
        }
      }
    });

    if (uidsToFetch.size === 0) return;

    Promise.all(
      Array.from(uidsToFetch).map(async (uid) => {
        const snap = await getDoc(doc(db, "users", uid));
        if (snap.exists()) return { uid, ...(snap.data() as UserProfile) };
        return null;
      })
    ).then((results) => {
      const newMap = new Map(otherUsers);
      results.forEach((u) => {
        if (u) newMap.set(u.uid, u);
      });
      setOtherUsers(newMap);
    });
  }, [chats, user]);

  const filteredChats = chats.filter((chat) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    if (chat.type === "group") {
      return chat.name?.toLowerCase().includes(term);
    }
    const otherId = chat.members.find((id) => id !== user?.uid);
    const other = otherId ? otherUsers.get(otherId) : undefined;
    return other?.displayName.toLowerCase().includes(term) || other?.email.toLowerCase().includes(term);
  });

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch {
      toast.error("Failed to sign out");
    }
  };

  return (
    <div className="flex flex-col h-full bg-brand-sidebar border-r border-brand-sidebarBorder">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-brand-sidebarHover">
        <div className="flex items-center gap-3">
          <Avatar
            name={user?.displayName || user?.email || "Me"}
            photoURL={user?.photoURL || undefined}
            size="md"
          />
          <span className="font-semibold text-brand-text text-sm truncate max-w-[120px]">
            {user?.displayName || user?.email?.split("@")[0]}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* New Group */}
          <button
            onClick={() => setShowNewGroup(true)}
            title="New Group"
            className="p-2 rounded-full hover:bg-brand-sidebarBorder text-brand-subtext hover:text-brand-text transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
          </button>

          {/* New Chat */}
          <button
            onClick={() => setShowNewChat(true)}
            title="New Chat"
            className="p-2 rounded-full hover:bg-brand-sidebarBorder text-brand-subtext hover:text-brand-text transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
            </svg>
          </button>

          {/* Menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 rounded-full hover:bg-brand-sidebarBorder text-brand-subtext hover:text-brand-text transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
              </svg>
            </button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-10 z-20 bg-brand-sidebarHover border border-brand-sidebarBorder rounded-xl shadow-xl min-w-[160px] py-1 animate-fade-in">
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-brand-sidebarBorder transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                    </svg>
                    Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="px-3 py-2">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-subtext" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input
            type="text"
            placeholder="Search chats..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-brand-sidebarHover border-0 rounded-lg pl-9 pr-4 py-2 text-brand-text placeholder-brand-subtext focus:outline-none focus:ring-1 focus:ring-brand-green transition-all text-sm"
          />
        </div>
      </div>

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-brand-green border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && filteredChats.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-16 h-16 bg-brand-sidebarHover rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-brand-subtext" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
              </svg>
            </div>
            <p className="text-brand-subtext text-sm">
              {searchTerm ? "No chats found" : "No chats yet"}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setShowNewChat(true)}
                className="mt-3 text-brand-green text-sm hover:underline"
              >
                Start a new conversation
              </button>
            )}
          </div>
        )}

        {filteredChats.map((chat) => {
          const otherId = chat.type === "direct"
            ? chat.members.find((id) => id !== user?.uid)
            : undefined;
          const otherUser = otherId ? otherUsers.get(otherId) : undefined;

          // Calculate unread
          // (simplified — full implementation would track per-user read state)
          const unreadCount = 0;

          return (
            <ChatListItem
              key={chat.id}
              chat={chat}
              otherUser={otherUser}
              isActive={chat.id === activeChatId}
              onClick={() => onSelectChat(chat.id)}
              unreadCount={unreadCount}
            />
          );
        })}
      </div>

      {/* Modals */}
      {showNewChat && (
        <NewChatModal
          onClose={() => setShowNewChat(false)}
          onChatCreated={(id) => onSelectChat(id)}
        />
      )}
      {showNewGroup && (
        <CreateGroupModal
          onClose={() => setShowNewGroup(false)}
          onGroupCreated={(id) => onSelectChat(id)}
        />
      )}
    </div>
  );
}
