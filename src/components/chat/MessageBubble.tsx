"use client";

import { Message } from "@/lib/firestore";
import { useAuth } from "@/context/AuthContext";
import { format } from "date-fns";
import { Timestamp } from "firebase/firestore";
import Avatar from "./Avatar";

interface MessageBubbleProps {
  message: Message;
  showAvatar: boolean;
  isGroup: boolean;
}

export default function MessageBubble({ message, showAvatar, isGroup }: MessageBubbleProps) {
  const { user } = useAuth();
  const isOwn = message.senderId === user?.uid;

  if (message.type === "system") {
    return (
      <div className="flex justify-center my-2">
        <span className="bg-brand-sidebarHover text-brand-subtext text-xs px-3 py-1 rounded-full border border-brand-sidebarBorder">
          {message.text}
        </span>
      </div>
    );
  }

  const ts = message.timestamp as Timestamp;
  const timeStr = ts?.toDate ? format(ts.toDate(), "h:mm a") : "";

  return (
    <div className={`flex items-end gap-2 mb-1 ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar (only for group incoming) */}
      {isGroup && !isOwn && (
        <div className="w-7 flex-shrink-0">
          {showAvatar ? (
            <Avatar name={message.senderName} photoURL={message.senderPhotoURL} size="sm" />
          ) : null}
        </div>
      )}

      <div className={`max-w-[65%] flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
        {/* Sender name for group */}
        {isGroup && !isOwn && showAvatar && (
          <span className="text-xs text-brand-green font-medium ml-1 mb-0.5">
            {message.senderName}
          </span>
        )}

        {/* Bubble */}
        <div
          className={`relative px-3 py-2 rounded-2xl text-sm leading-relaxed break-words ${
            isOwn
              ? "bg-brand-msgOut text-brand-text rounded-tr-sm"
              : "bg-brand-msgIn text-brand-text rounded-tl-sm"
          }`}
        >
          <p>{message.text}</p>
          {/* Time + read receipt */}
          <div className={`flex items-center gap-1 mt-1 ${isOwn ? "justify-end" : "justify-end"}`}>
            <span className="text-[10px] text-brand-subtext opacity-80">{timeStr}</span>
            {isOwn && (
              <svg
                className={`w-3.5 h-3.5 flex-shrink-0 ${
                  message.readBy && message.readBy.length > 1
                    ? "text-blue-400"
                    : "text-brand-subtext"
                }`}
                viewBox="0 0 16 11"
                fill="currentColor"
              >
                {/* Double tick */}
                <path d="M11.071.653a.75.75 0 0 1 .205 1.04l-5.5 8a.75.75 0 0 1-1.152.114l-3-3a.75.75 0 0 1 1.06-1.06l2.39 2.39 4.957-7.212a.75.75 0 0 1 1.04-.272z"/>
                <path d="M14.071.653a.75.75 0 0 1 .205 1.04l-5.5 8a.75.75 0 0 1-.1.11.75.75 0 0 1-.048-.166L13.031.925a.75.75 0 0 1 1.04-.272z" opacity=".6"/>
              </svg>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
