"use client";

interface AvatarProps {
  name: string;
  photoURL?: string;
  size?: "sm" | "md" | "lg" | "xl";
  online?: boolean;
}

const sizeMap = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-base",
  xl: "w-16 h-16 text-xl",
};

const dotSizeMap = {
  sm: "w-2 h-2",
  md: "w-2.5 h-2.5",
  lg: "w-3 h-3",
  xl: "w-3.5 h-3.5",
};

// Generate a deterministic color from a name
function nameToColor(name: string): string {
  const colors = [
    "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4",
    "#FFEAA7", "#DDA0DD", "#98D8C8", "#F7DC6F",
    "#BB8FCE", "#85C1E9", "#F0B27A", "#82E0AA",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export default function Avatar({ name, photoURL, size = "md", online }: AvatarProps) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const bgColor = nameToColor(name);

  return (
    <div className={`relative flex-shrink-0 ${sizeMap[size]}`}>
      {photoURL ? (
        <img
          src={photoURL}
          alt={name}
          className={`${sizeMap[size]} rounded-full object-cover`}
          onError={(e) => {
            // Fallback to initials if image fails
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      ) : (
        <div
          className={`${sizeMap[size]} rounded-full flex items-center justify-center font-semibold text-white`}
          style={{ backgroundColor: bgColor }}
        >
          {initials}
        </div>
      )}
      {online !== undefined && (
        <span
          className={`absolute bottom-0 right-0 ${dotSizeMap[size]} rounded-full border-2 border-brand-sidebar ${online ? "bg-brand-green" : "bg-gray-500"}`}
        />
      )}
    </div>
  );
}
