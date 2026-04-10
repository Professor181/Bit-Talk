"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { searchUsers, UserProfile, createGroupChat } from "@/lib/firestore";
import Avatar from "./Avatar";
import toast from "react-hot-toast";

interface CreateGroupModalProps {
  onClose: () => void;
  onGroupCreated: (chatId: string) => void;
}

export default function CreateGroupModal({ onClose, onGroupCreated }: CreateGroupModalProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<"members" | "name">("members");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<UserProfile[]>([]);
  const [groupName, setGroupName] = useState("");
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!searchTerm.trim() || !user) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const users = await searchUsers(searchTerm, user.uid);
        setSearchResults(users.filter((u) => !selectedUsers.find((s) => s.uid === u.uid)));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm, user, selectedUsers]);

  const toggleUser = (u: UserProfile) => {
    setSelectedUsers((prev) =>
      prev.find((s) => s.uid === u.uid)
        ? prev.filter((s) => s.uid !== u.uid)
        : [...prev, u]
    );
    setSearchTerm("");
  };

  const handleCreate = async () => {
    if (!groupName.trim() || selectedUsers.length === 0 || !user) return;
    setCreating(true);
    try {
      const memberUids = selectedUsers.map((u) => u.uid);
      const chatId = await createGroupChat(groupName.trim(), user.uid, memberUids);
      toast.success(`Group "${groupName}" created!`);
      onGroupCreated(chatId);
      onClose();
    } catch (err: any) {
      toast.error("Failed to create group");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 px-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-brand-sidebar rounded-2xl shadow-2xl border border-brand-sidebarBorder w-full max-w-md animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-brand-sidebarBorder">
          <div className="flex items-center gap-3">
            {step === "name" && (
              <button onClick={() => setStep("members")} className="text-brand-subtext hover:text-brand-text transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
                </svg>
              </button>
            )}
            <h2 className="text-lg font-semibold text-brand-text">
              {step === "members" ? "Add Members" : "Name Your Group"}
            </h2>
          </div>
          <button onClick={onClose} className="text-brand-subtext hover:text-brand-text p-1 rounded-full hover:bg-brand-sidebarHover transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Step 1: Select members */}
        {step === "members" && (
          <>
            {/* Selected users chips */}
            {selectedUsers.length > 0 && (
              <div className="px-4 py-3 flex flex-wrap gap-2 border-b border-brand-sidebarBorder">
                {selectedUsers.map((u) => (
                  <span
                    key={u.uid}
                    className="flex items-center gap-1.5 bg-brand-teal/30 border border-brand-teal/40 text-brand-text text-sm px-2.5 py-1 rounded-full"
                  >
                    <Avatar name={u.displayName} photoURL={u.photoURL} size="sm" />
                    {u.displayName.split(" ")[0]}
                    <button
                      onClick={() => toggleUser(u)}
                      className="text-brand-subtext hover:text-red-400 ml-0.5 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Search */}
            <div className="p-4 border-b border-brand-sidebarBorder">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-subtext" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
                <input
                  autoFocus
                  type="text"
                  placeholder="Search users to add..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-brand-sidebarHover border border-brand-sidebarBorder rounded-xl pl-10 pr-4 py-2.5 text-brand-text placeholder-brand-subtext focus:outline-none focus:border-brand-green transition-colors text-sm"
                />
              </div>
            </div>

            {/* Results */}
            <div className="max-h-56 overflow-y-auto">
              {loading && (
                <div className="flex justify-center py-6">
                  <div className="w-5 h-5 border-2 border-brand-green border-t-transparent rounded-full animate-spin"/>
                </div>
              )}
              {!loading && searchTerm && searchResults.length === 0 && (
                <p className="text-center text-brand-subtext text-sm py-6">No users found</p>
              )}
              {!loading && !searchTerm && (
                <p className="text-center text-brand-subtext text-sm py-6">Search for users to add</p>
              )}
              {searchResults.map((u) => (
                <button
                  key={u.uid}
                  onClick={() => toggleUser(u)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-brand-sidebarHover transition-colors text-left"
                >
                  <Avatar name={u.displayName} photoURL={u.photoURL} size="md" online={u.online}/>
                  <div className="flex-1 min-w-0">
                    <p className="text-brand-text font-medium text-sm">{u.displayName}</p>
                    <p className="text-brand-subtext text-xs truncate">{u.email}</p>
                  </div>
                  <svg className="w-5 h-5 text-brand-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
                  </svg>
                </button>
              ))}
            </div>

            {/* Next */}
            <div className="p-4 border-t border-brand-sidebarBorder">
              <button
                onClick={() => setStep("name")}
                disabled={selectedUsers.length === 0}
                className="w-full bg-brand-green hover:bg-brand-darkGreen text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                Next
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                </svg>
              </button>
              <p className="text-xs text-brand-subtext text-center mt-2">
                {selectedUsers.length} member{selectedUsers.length !== 1 ? "s" : ""} selected
              </p>
            </div>
          </>
        )}

        {/* Step 2: Group name */}
        {step === "name" && (
          <div className="p-6 space-y-5">
            {/* Selected members preview */}
            <div>
              <p className="text-xs text-brand-subtext uppercase font-semibold tracking-wider mb-3">Members ({selectedUsers.length + 1})</p>
              <div className="flex flex-wrap gap-2">
                <div className="flex flex-col items-center gap-1">
                  <Avatar
                    name={user?.displayName || "Me"}
                    photoURL={user?.photoURL || undefined}
                    size="sm"
                  />
                  <span className="text-[10px] text-brand-subtext">You</span>
                </div>
                {selectedUsers.map((u) => (
                  <div key={u.uid} className="flex flex-col items-center gap-1">
                    <Avatar name={u.displayName} photoURL={u.photoURL} size="sm"/>
                    <span className="text-[10px] text-brand-subtext max-w-[48px] truncate text-center">{u.displayName.split(" ")[0]}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Group name input */}
            <div>
              <label className="block text-sm text-brand-subtext mb-1.5">Group name</label>
              <input
                autoFocus
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                placeholder="e.g. Family, Work Team, Friends..."
                maxLength={50}
                className="w-full bg-brand-sidebarHover border border-brand-sidebarBorder rounded-xl px-4 py-3 text-brand-text placeholder-brand-subtext focus:outline-none focus:border-brand-green transition-colors"
              />
              <p className="text-xs text-brand-subtext mt-1 text-right">{groupName.length}/50</p>
            </div>

            <button
              onClick={handleCreate}
              disabled={creating || !groupName.trim()}
              className="w-full bg-brand-green hover:bg-brand-darkGreen text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {creating ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                  Creating...
                </span>
              ) : "Create Group"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
