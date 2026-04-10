"use client";

import { UserProfile } from "@/lib/firestore";

interface ContactProfileModalProps {
  contact: UserProfile;
  onClose: () => void;
}

export default function ContactProfileModal({ contact, onClose }: ContactProfileModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-brand-chatBg w-full max-w-md rounded-2xl border border-brand-teal/30 p-6 shadow-2xl relative">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-brand-subtext hover:text-brand-text transition-colors"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-xl font-bold text-brand-text mb-6 text-center">Contact Info</h2>

        {/* Big Avatar */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-brand-green/50 mb-4 shadow-lg">
            {contact.photoURL ? (
              <img src={contact.photoURL} alt={contact.displayName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-brand-teal/20 flex items-center justify-center">
                <span className="text-5xl text-brand-green">👤</span>
              </div>
            )}
          </div>
          <h3 className="text-2xl font-bold text-white">{contact.displayName || contact.email.split('@')[0]}</h3>
          <p className="text-brand-subtext">{contact.email}</p>
        </div>

        {/* About Section */}
        <div className="bg-[#111B21] rounded-xl p-4 border border-[#2A3942]">
          <label className="block text-brand-green text-xs font-bold mb-2 uppercase tracking-wider">About</label>
          <p className="text-brand-text text-base">
            {contact.about || "Hey there! I am using Bit-Talk."}
          </p>
        </div>

      </div>
    </div>
  );
}