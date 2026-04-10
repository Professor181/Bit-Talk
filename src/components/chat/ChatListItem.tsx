"use client";

import { Chat, UserProfile } from "@/lib/firestore";
import { useAuth } from "@/context/AuthContext";
import Avatar from "./Avatar";
import { formatDistanceToNowStrict, format, isToday, isYesterday } from "date-fns";
import { Timestamp } from "firebase/firestore";

interface ChatListItemProps {
  chat: Chat;
  otherUser?: UserProfile;
  isActive: boolean;
  onClick: () => void;
  unreadCount?: number;
}

function formatChatTime(ts: Timestamp | undefined): string {
  if (!ts) return "";
  const date = ts.toDate ? ts.toDate() : new Date(ts as any);
  if (isToday(date)) return format(date, "h:mm a");
  if (isYesterday(date)) return "Yesterday";
  return format(date, "MM/dd/yy");
}

export default function ChatListItem({
  chat,
  otherUser,
  isActive,
  onClick,
  unreadCount = 0,
}: ChatListItemProps) {
  const { user } = useAuth();

  const name = chat.type === "group"
    ? chat.name || "Group Chat"
    : otherUser?.displayName || "Unknown User";

  const photoURL = chat.type === "group" ? undefined : otherUser?.photoURL;
  const isOnline = chat.type === "direct" ? otherUser?.online : undefined;

  const lastMsgText = chat.lastMessage
    ? chat.lastMessage.senderId === user?.uid
      ? `You: ${chat.lastMessage.text}`
      : chat.type === "group"
      ? `${chat.lastMessage.senderName.split(" ")[0]}: ${chat.lastMessage.text}`
      : chat.lastMessage.text
    : "Start chatting";

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 transition-colors text-left ${
        isActive
          ? "bg-brand-sidebarHover"
          : "hover:bg-brand-sidebarHover"
      }`}
    >
      <div className="relative">
        <Avatar
          name={name}
          photoURL={photoURL}
          size="md"
          online={isOnline}
        />
        {chat.type === "group" && (
          <span className="absolute -bottom-0.5 -right-0.5 bg-brand-teal rounded-full p-0.5">
            <svg className="w-2.5 h-2.5 text-white fill-white" viewBox="0 0 20 20">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v1h8v-1zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-1a4 4 0 00-.83-2.45A5.97 5.97 0 0118 18v-1h-2v1zM4 18v-1A5.97 5.97 0 015.83 14.55 4 4 0 004 17v1H2v-1h2z"/>
            </svg>
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className={`font-medium truncate ${isActive ? "text-brand-text" : "text-brand-text"}`}>
            {name}
          </span>
          <span className="text-xs text-brand-subtext flex-shrink-0 ml-2">
            {formatChatTime(chat.lastMessage?.timestamp)}
          </span>
        </div>
        <div className="flex items-center justify-between mt-0.5">
          <p className="text-sm text-brand-subtext truncate max-w-[180px]">
            {lastMsgText}
          </p>
          {unreadCount > 0 && (
            <span className="ml-2 bg-brand-green text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 font-bold">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
