"use client";

import { useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { doc, updateDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase"; 
import { updateProfile } from "firebase/auth";

export default function ProfileSettings({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const [name, setName] = useState(user?.displayName || "");
  const [about, setAbout] = useState("Hey there! I am using Bit-Talk.");
  const [loading, setLoading] = useState(false);
  const [dpPreview, setDpPreview] = useState(user?.photoURL || "");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      // Create a temporary URL to show a preview immediately
      setDpPreview(URL.createObjectURL(file));
    }
  };

  const uploadToCloudinary = async (file: File) => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      throw new Error("Cloudinary credentials are not set in .env.local");
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || "Cloudinary upload failed");
    
    // Cloudinary gives us a secure HTTPS url for the new image
    return data.secure_url; 
  };

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);

    try {
      let photoURL = user.photoURL;

      // 1. Upload to Cloudinary if a new file was selected
      if (selectedFile) {
        photoURL = await uploadToCloudinary(selectedFile);
      }

      // 2. Update the Firebase AUTH Brain (This fixes your Sidebar display)
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: name,
          photoURL: photoURL,
        });
      }

      // 3. Update the Firestore DATABASE Brain (This fixes what other users see)
      await updateDoc(doc(db, "users", user.uid), {
        displayName: name,
        photoURL: photoURL,
        about: about,
      });

      // 4. Force the app to refresh and load the new data instantly
      window.location.reload(); 
      
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-brand-chatBg w-full max-w-md rounded-2xl border border-brand-teal/30 p-6 shadow-2xl">
        <h2 className="text-2xl font-bold text-brand-text mb-6">Profile Settings</h2>

        {/* Profile Picture Upload */}
        <div className="flex flex-col items-center mb-6">
          <div 
            className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-brand-green/50 cursor-pointer group"
            onClick={() => fileInputRef.current?.click()}
          >
            {dpPreview ? (
              <img src={dpPreview} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-brand-teal/20 flex items-center justify-center">
                <span className="text-4xl text-brand-green">👤</span>
              </div>
            )}
            
            <div className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center transition-all">
              <span className="text-white text-xs font-bold">CHANGE DP</span>
            </div>
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImageChange} 
            accept="image/*" 
            className="hidden" 
          />
        </div>

        {/* Name Input */}
        <div className="mb-4">
          <label className="block text-brand-green text-sm font-semibold mb-1">Your Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-[#2A3942] text-brand-text px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green"
            placeholder="Your Display Name"
          />
        </div>

        {/* About Input */}
        <div className="mb-8">
          <label className="block text-brand-green text-sm font-semibold mb-1">About</label>
          <textarea
            value={about}
            onChange={(e) => setAbout(e.target.value)}
            className="w-full bg-[#2A3942] text-brand-text px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green resize-none h-24"
            placeholder="Hey there! I am using Bit-Talk."
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-5 py-2 rounded-lg text-brand-subtext hover:bg-[#2A3942] transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={loading}
            className="px-5 py-2 rounded-lg bg-brand-green text-[#111B21] font-bold hover:bg-[#005c4b] hover:text-white transition-colors disabled:opacity-50 flex justify-center items-center min-w-[80px]"
          >
            {loading ? (
              <span className="animate-spin h-5 w-5 border-2 border-[#111B21] border-t-transparent rounded-full"></span>
            ) : (
              "Save"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}