"use client";

import { useEffect, useState } from "react";
import { subscribeToUserChats, Chat } from "@/lib/firestore";
import { useAuth } from "@/context/AuthContext";

export function useChats() {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setChats([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToUserChats(user.uid, (updatedChats) => {
      setChats(updatedChats);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  return { chats, loading };
}
