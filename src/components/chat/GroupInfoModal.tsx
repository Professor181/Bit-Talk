"use client";

import { useState, useEffect } from "react";
import { Chat, UserProfile, addMemberToGroup, removeMemberFromGroup, searchUsers } from "@/lib/firestore";
import { useAuth } from "@/context/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Avatar from "./Avatar";
import toast from "react-hot-toast";

interface GroupInfoModalProps {
  chat: Chat;
  onClose: () => void;
}

export default function GroupInfoModal({ chat, onClose }: GroupInfoModalProps) {
  const { user } = useAuth();
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [showAddMember, setShowAddMember] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);

  const isAdmin = user ? (chat.admins || []).includes(user.uid) : false;

  // Load member profiles
  useEffect(() => {
    const fetchMembers = async () => {
      setLoadingMembers(true);
      const profiles = await Promise.all(
        chat.members.map(async (uid) => {
          const snap = await getDoc(doc(db, "users", uid));
          if (snap.exists()) return { uid: snap.id, ...snap.data() } as UserProfile;
          return null;
        })
      );
      setMembers(profiles.filter(Boolean) as UserProfile[]);
      setLoadingMembers(false);
    };
    fetchMembers();
  }, [chat.members]);

  // Search for users to add
  useEffect(() => {
    if (!searchTerm.trim() || !user) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await searchUsers(searchTerm, user.uid);
        setSearchResults(results.filter((u) => !chat.members.includes(u.uid)));
      } catch {
        // ignore
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm, user, chat.members]);

  const handleAddMember = async (uid: string) => {
    setAdding(uid);
    try {
      await addMemberToGroup(chat.id, uid);
      toast.success("Member added");
      setSearchTerm("");
      setShowAddMember(false);
    } catch {
      toast.error("Failed to add member");
    } finally {
      setAdding(null);
    }
  };

  const handleRemoveMember = async (uid: string) => {
    if (!confirm("Remove this member from the group?")) return;
    setRemoving(uid);
    try {
      await removeMemberFromGroup(chat.id, uid);
      toast.success("Member removed");
    } catch {
      toast.error("Failed to remove member");
    } finally {
      setRemoving(null);
    }
  };

  const handleLeaveGroup = async () => {
    if (!user || !confirm("Leave this group?")) return;
    setRemoving(user.uid);
    try {
      await removeMemberFromGroup(chat.id, user.uid);
      toast.success("Left the group");
      onClose();
    } catch {
      toast.error("Failed to leave group");
    } finally {
      setRemoving(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 px-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose}/>
      <div className="relative bg-brand-sidebar rounded-2xl shadow-2xl border border-brand-sidebarBorder w-full max-w-md max-h-[85vh] flex flex-col animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-brand-sidebarBorder flex-shrink-0">
          <h2 className="text-lg font-semibold text-brand-text">Group Info</h2>
          <button onClick={onClose} className="text-brand-subtext hover:text-brand-text p-1 rounded-full hover:bg-brand-sidebarHover transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {/* Group avatar & name */}
          <div className="flex flex-col items-center py-6 px-4">
            <div className="w-20 h-20 bg-brand-teal rounded-full flex items-center justify-center mb-3 shadow-lg">
              <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v1h8v-1zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-1a4 4 0 00-.83-2.45A5.97 5.97 0 0118 18v-1h-2v1zM4 18v-1A5.97 5.97 0 015.83 14.55 4 4 0 004 17v1H2v-1h2z"/>
              </svg>
            </div>
            <h3 className="text-xl font-bold text-brand-text">{chat.name}</h3>
            <p className="text-brand-subtext text-sm mt-1">{chat.members.length} members</p>
          </div>

          {/* Members section */}
          <div className="px-4 pb-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-brand-subtext uppercase tracking-wider">
                Members
              </h4>
              {isAdmin && (
                <button
                  onClick={() => setShowAddMember(!showAddMember)}
                  className="text-brand-green text-sm hover:underline flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
                  </svg>
                  Add member
                </button>
              )}
            </div>

            {/* Add member search */}
            {showAddMember && (
              <div className="mb-3 bg-brand-sidebarHover rounded-xl border border-brand-sidebarBorder overflow-hidden">
                <div className="p-3">
                  <input
                    autoFocus
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-brand-sidebar rounded-lg px-3 py-2 text-brand-text placeholder-brand-subtext text-sm focus:outline-none border border-brand-sidebarBorder focus:border-brand-green transition-colors"
                  />
                </div>
                {searching && (
                  <div className="flex justify-center py-4">
                    <div className="w-5 h-5 border-2 border-brand-green border-t-transparent rounded-full animate-spin"/>
                  </div>
                )}
                {!searching && searchTerm && searchResults.length === 0 && (
                  <p className="text-center text-brand-subtext text-sm py-4">No users found</p>
                )}
                {searchResults.slice(0, 5).map((u) => (
                  <div key={u.uid} className="flex items-center gap-3 px-3 py-2 hover:bg-brand-sidebarBorder transition-colors">
                    <Avatar name={u.displayName} photoURL={u.photoURL} size="sm"/>
                    <div className="flex-1 min-w-0">
                      <p className="text-brand-text text-sm font-medium">{u.displayName}</p>
                      <p className="text-brand-subtext text-xs truncate">{u.email}</p>
                    </div>
                    <button
                      onClick={() => handleAddMember(u.uid)}
                      disabled={adding === u.uid}
                      className="text-brand-green text-sm font-medium hover:underline disabled:opacity-60"
                    >
                      {adding === u.uid ? "Adding..." : "Add"}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Member list */}
            {loadingMembers ? (
              <div className="flex justify-center py-4">
                <div className="w-5 h-5 border-2 border-brand-green border-t-transparent rounded-full animate-spin"/>
              </div>
            ) : (
              <div className="space-y-1">
                {members.map((member) => (
                  <div key={member.uid} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-brand-sidebarHover transition-colors">
                    <Avatar name={member.displayName} photoURL={member.photoURL} size="md" online={member.online}/>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-brand-text font-medium text-sm">
                          {member.uid === user?.uid ? "You" : member.displayName}
                        </p>
                        {(chat.admins || []).includes(member.uid) && (
                          <span className="text-[10px] bg-brand-teal/30 text-brand-green px-1.5 py-0.5 rounded-full border border-brand-teal/30">
                            Admin
                          </span>
                        )}
                      </div>
                      <p className="text-brand-subtext text-xs">{member.email}</p>
                    </div>
                    {/* Remove button (admin only, can't remove self via this, use leave) */}
                    {isAdmin && member.uid !== user?.uid && (
                      <button
                        onClick={() => handleRemoveMember(member.uid)}
                        disabled={removing === member.uid}
                        className="text-red-400 hover:text-red-300 text-xs font-medium disabled:opacity-60"
                      >
                        {removing === member.uid ? "..." : "Remove"}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Leave group footer */}
        <div className="p-4 border-t border-brand-sidebarBorder flex-shrink-0">
          <button
            onClick={handleLeaveGroup}
            disabled={removing === user?.uid}
            className="w-full py-2.5 text-red-400 hover:bg-red-900/20 rounded-xl transition-colors text-sm font-medium flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
            {removing === user?.uid ? "Leaving..." : "Leave Group"}
          </button>
        </div>
      </div>
    </div>
  );
}
