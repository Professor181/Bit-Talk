/**
 * Firestore Data Models & Helper Functions
 *
 * Collections:
 *  users/{uid}                  - User profiles
 *  chats/{chatId}               - Chat metadata (1-to-1 and groups)
 *  chats/{chatId}/messages/{id} - Messages inside a chat
 *  otpCodes/{email}             - Temporary OTP storage (auto-expire via TTL)
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  arrayUnion,
  arrayRemove,
  limit,
  writeBatch,
} from "firebase/firestore";
import { db } from "./firebase";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  createdAt: Timestamp;
  lastSeen: Timestamp;
  online: boolean;
}

export interface Chat {
  id: string;
  type: "direct" | "group";
  name?: string;          // only for groups
  photoURL?: string;      // only for groups
  members: string[];      // array of uids
  admins?: string[];      // only for groups
  createdBy?: string;     // uid of creator (groups)
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastMessage?: {
    text: string;
    senderId: string;
    senderName: string;
    timestamp: Timestamp;
  };
  // computed on client
  unreadCount?: number;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderPhotoURL: string;
  text: string;
  type: "text" | "image" | "system";
  timestamp: Timestamp;
  readBy: string[];
}

// ─────────────────────────────────────────────
// User helpers
// ─────────────────────────────────────────────
export async function upsertUser(user: Partial<UserProfile> & { uid: string }) {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      ...user,
      createdAt: serverTimestamp(),
      lastSeen: serverTimestamp(),
      online: true,
    });
  } else {
    await updateDoc(ref, {
      ...user,
      lastSeen: serverTimestamp(),
      online: true,
    });
  }
}

export async function setUserOffline(uid: string) {
  const ref = doc(db, "users", uid);
  await updateDoc(ref, { online: false, lastSeen: serverTimestamp() });
}

export async function getUserByEmail(email: string): Promise<UserProfile | null> {
  const q = query(collection(db, "users"), where("email", "==", email), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as unknown as UserProfile;
}

export async function searchUsers(searchTerm: string, currentUid: string): Promise<UserProfile[]> {
  // Search by displayName prefix (case-sensitive in Firestore)
  const q = query(
    collection(db, "users"),
    where("displayName", ">=", searchTerm),
    where("displayName", "<=", searchTerm + "\uf8ff"),
    limit(20)
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ ...d.data() } as UserProfile))
    .filter((u) => u.uid !== currentUid);
}

// ─────────────────────────────────────────────
// Chat helpers
// ─────────────────────────────────────────────

/** Create or get existing 1-to-1 chat between two users */
export async function getOrCreateDirectChat(
  uid1: string,
  uid2: string
): Promise<string> {
  // Stable chat ID = sorted uids joined
  const chatId = [uid1, uid2].sort().join("_");
  const ref = doc(db, "chats", chatId);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      type: "direct",
      members: [uid1, uid2],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
  return chatId;
}

/** Create a group chat */
export async function createGroupChat(
  name: string,
  creatorUid: string,
  memberUids: string[]
): Promise<string> {
  const members = Array.from(new Set([creatorUid, ...memberUids]));
  const ref = await addDoc(collection(db, "chats"), {
    type: "group",
    name,
    members,
    admins: [creatorUid],
    createdBy: creatorUid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  // Post a system message
  await addDoc(collection(db, "chats", ref.id, "messages"), {
    chatId: ref.id,
    senderId: "system",
    senderName: "System",
    senderPhotoURL: "",
    text: "Group created",
    type: "system",
    timestamp: serverTimestamp(),
    readBy: [],
  });
  return ref.id;
}

/** Add member to group */
export async function addMemberToGroup(chatId: string, uid: string) {
  await updateDoc(doc(db, "chats", chatId), {
    members: arrayUnion(uid),
  });
}

/** Remove member from group */
export async function removeMemberFromGroup(chatId: string, uid: string) {
  await updateDoc(doc(db, "chats", chatId), {
    members: arrayRemove(uid),
    admins: arrayRemove(uid),
  });
}

// ─────────────────────────────────────────────
// Message helpers
// ─────────────────────────────────────────────
export async function sendMessage(
  chatId: string,
  sender: { uid: string; displayName: string; photoURL: string },
  text: string
) {
  const batch = writeBatch(db);

  // Add message
  const msgRef = doc(collection(db, "chats", chatId, "messages"));
  batch.set(msgRef, {
    chatId,
    senderId: sender.uid,
    senderName: sender.displayName,
    senderPhotoURL: sender.photoURL,
    text,
    type: "text",
    timestamp: serverTimestamp(),
    readBy: [sender.uid],
  });

  // Update chat metadata
  const chatRef = doc(db, "chats", chatId);
  batch.update(chatRef, {
    updatedAt: serverTimestamp(),
    lastMessage: {
      text,
      senderId: sender.uid,
      senderName: sender.displayName,
      timestamp: serverTimestamp(),
    },
  });

  await batch.commit();
}

/** Mark all messages in a chat as read by the given user */
export async function markMessagesRead(chatId: string, uid: string) {
  const q = query(
    collection(db, "chats", chatId, "messages"),
    where("readBy", "array-contains", uid)
  );
  // We only need to update messages NOT yet read
  const allMsgs = query(
    collection(db, "chats", chatId, "messages"),
    orderBy("timestamp", "desc"),
    limit(50)
  );
  const snap = await getDocs(allMsgs);
  const batch = writeBatch(db);
  snap.docs.forEach((d) => {
    const data = d.data();
    if (!data.readBy?.includes(uid)) {
      batch.update(d.ref, { readBy: arrayUnion(uid) });
    }
  });
  await batch.commit();
}

// ─────────────────────────────────────────────
// Realtime listeners (return unsubscribe fn)
// ─────────────────────────────────────────────
export function subscribeToUserChats(
  uid: string,
  callback: (chats: Chat[]) => void
) {
  const q = query(
    collection(db, "chats"),
    where("members", "array-contains", uid),
    orderBy("updatedAt", "desc")
  );
  return onSnapshot(q, (snap) => {
    const chats = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Chat));
    callback(chats);
  });
}

export function subscribeToMessages(
  chatId: string,
  callback: (messages: Message[]) => void
) {
  const q = query(
    collection(db, "chats", chatId, "messages"),
    orderBy("timestamp", "asc")
  );
  return onSnapshot(q, (snap) => {
    const messages = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Message));
    callback(messages);
  });
}
