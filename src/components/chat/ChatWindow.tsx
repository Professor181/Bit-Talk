"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useMessages } from "@/hooks/useMessages";
import {
  Chat,
  UserProfile,
  sendMessage,
  subscribeToMessages,
  Message,
} from "@/lib/firestore";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import MessageBubble from "./MessageBubble";
import Avatar from "./Avatar";
import GroupInfoModal from "./GroupInfoModal";
import toast from "react-hot-toast";

interface ChatWindowProps {
  chatId: string;
  onBack?: () => void; // mobile back button
}

export default function ChatWindow({ chatId, onBack }: ChatWindowProps) {
  const { user } = useAuth();
  const { messages, loading } = useMessages(chatId);
  const [chat, setChat] = useState<Chat | null>(null);
  const [otherUser, setOtherUser] = useState<UserProfile | null>(null);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Subscribe to chat metadata
  useEffect(() => {
    const ref = doc(db, "chats", chatId);
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setChat({ id: snap.id, ...snap.data() } as Chat);
      }
    });
    return unsub;
  }, [chatId]);

  // Fetch other user for DM
  useEffect(() => {
    if (!chat || chat.type !== "direct" || !user) return;
    const otherId = chat.members.find((id) => id !== user.uid);
    if (!otherId) return;

    const ref = doc(db, "users", otherId);
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setOtherUser({ uid: snap.id, ...snap.data() } as UserProfile);
      }
    });
    return unsub;
  }, [chat, user]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-resize textarea
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessageText(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  };

  const handleSend = async () => {
    const text = messageText.trim();
    if (!text || !user || sending) return;

    setSending(true);
    setMessageText("");
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }

    try {
      await sendMessage(chatId, {
        uid: user.uid,
        displayName: user.displayName || user.email?.split("@")[0] || "User",
        photoURL: user.photoURL || "",
      }, text);
    } catch (err) {
      toast.error("Failed to send message");
      setMessageText(text); // restore
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Chat name / display info
  const chatName = chat?.type === "group"
    ? chat.name || "Group Chat"
    : otherUser?.displayName || "Loading...";

  const chatSubtitle = chat?.type === "group"
    ? `${chat.members?.length || 0} members`
    : otherUser?.online
    ? "online"
    : "offline";

  const chatPhoto = chat?.type === "group" ? undefined : otherUser?.photoURL;

  if (!chat) {
    return (
      <div className="flex-1 flex items-center justify-center bg-brand-chatBg">
        <div className="w-8 h-8 border-2 border-brand-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-brand-chatBg">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-brand-sidebarHover border-b border-brand-sidebarBorder">
        {/* Back button (mobile) */}
        {onBack && (
          <button onClick={onBack} className="text-brand-subtext hover:text-brand-text p-1 mr-1 flex-shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
            </svg>
          </button>
        )}

        <button
          className="flex items-center gap-3 flex-1 min-w-0 text-left hover:opacity-90 transition-opacity"
          onClick={() => chat.type === "group" && setShowGroupInfo(true)}
        >
          <Avatar
            name={chatName}
            photoURL={chatPhoto}
            size="md"
            online={chat.type === "direct" ? otherUser?.online : undefined}
          />
          <div className="min-w-0">
            <p className="text-brand-text font-semibold text-sm truncate">{chatName}</p>
            <p className={`text-xs truncate ${
              chat.type === "direct" && otherUser?.online
                ? "text-brand-green"
                : "text-brand-subtext"
            }`}>
              {chatSubtitle}
            </p>
          </div>
        </button>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {chat.type === "group" && (
            <button
              onClick={() => setShowGroupInfo(true)}
              className="p-2 rounded-full text-brand-subtext hover:text-brand-text hover:bg-brand-sidebarBorder transition-colors"
              title="Group info"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Messages area */}
      <div
        className="flex-1 overflow-y-auto px-4 py-4"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      >
        {loading && (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-brand-green border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 bg-brand-sidebarHover rounded-full flex items-center justify-center mb-3">
              <svg className="w-8 h-8 text-brand-subtext" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
              </svg>
            </div>
            <p className="text-brand-subtext">No messages yet. Say hi! 👋</p>
          </div>
        )}

        {messages.map((msg, idx) => {
          const prevMsg = messages[idx - 1];
          const showAvatar = !prevMsg || prevMsg.senderId !== msg.senderId;
          return (
            <MessageBubble
              key={msg.id}
              message={msg}
              showAvatar={showAvatar}
              isGroup={chat.type === "group"}
            />
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <div className="px-4 py-3 bg-brand-sidebarHover border-t border-brand-sidebarBorder">
        <div className="flex items-end gap-3">
          <div className="flex-1 bg-brand-sidebar rounded-2xl border border-brand-sidebarBorder focus-within:border-brand-green transition-colors">
            <textarea
              ref={inputRef}
              value={messageText}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              rows={1}
              className="w-full bg-transparent px-4 py-3 text-brand-text placeholder-brand-subtext focus:outline-none resize-none text-sm leading-relaxed"
              style={{ minHeight: "44px", maxHeight: "120px" }}
            />
          </div>

          <button
            onClick={handleSend}
            disabled={!messageText.trim() || sending}
            className={`flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center transition-all ${
              messageText.trim()
                ? "bg-brand-green hover:bg-brand-darkGreen text-white"
                : "bg-brand-sidebarBorder text-brand-subtext cursor-not-allowed"
            }`}
          >
            {sending ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            )}
          </button>
        </div>
        <p className="text-xs text-brand-subtext mt-1.5 px-1">
          Press <kbd className="px-1 py-0.5 bg-brand-sidebarBorder rounded text-[10px]">Enter</kbd> to send,{" "}
          <kbd className="px-1 py-0.5 bg-brand-sidebarBorder rounded text-[10px]">Shift+Enter</kbd> for new line
        </p>
      </div>

      {/* Group Info Modal */}
      {showGroupInfo && chat.type === "group" && (
        <GroupInfoModal
          chat={chat}
          onClose={() => setShowGroupInfo(false)}
        />
      )}
    </div>
  );
}
