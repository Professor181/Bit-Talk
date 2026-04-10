"use client";

import { useEffect, useState } from "react";
import { subscribeToMessages, Message, markMessagesRead } from "@/lib/firestore";
import { useAuth } from "@/context/AuthContext";

export function useMessages(chatId: string | null) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!chatId || !user) {
      setMessages([]);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToMessages(chatId, (msgs) => {
      setMessages(msgs);
      setLoading(false);
      // Mark messages as read
      markMessagesRead(chatId, user.uid).catch(console.error);
    });

    return unsubscribe;
  }, [chatId, user]);

  return { messages, loading };
}
