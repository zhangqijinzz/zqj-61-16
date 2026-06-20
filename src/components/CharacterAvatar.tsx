import { CharacterType } from "@/types";
import { motion } from "framer-motion";
import { Sparkles, Trophy } from "lucide-react";

const characterConfig: Record<
  CharacterType,
  { gradient: string; emoji: string }
> = {
  knight: { gradient: "from-amber-400 to-orange-600", emoji: "🛡️" },
  warrior: { gradient: "from-red-400 to-rose-600", emoji: "⚔️" },
  guardian: { gradient: "from-blue-400 to-indigo-600", emoji: "🌟" },
  ranger: { gradient: "from-green-400 to-emerald-600", emoji: "🏹" },
};

const sizeMap = {
  sm: "w-10 h-10 text-lg",
  md: "w-16 h-16 text-2xl",
  lg: "w-24 h-24 text-4xl",
};

const badgeSizeMap = {
  sm: { container: "-top-1 -right-1", badge: "w-5 h-5 text-xs", icon: 10 },
  md: { container: "-top-2 -right-2", badge: "w-7 h-7 text-sm", icon: 14 },
  lg: { container: "-top-3 -right-3", badge: "w-10 h-10 text-lg", icon: 20 },
};

interface CharacterAvatarProps {
  characterType: CharacterType;
  size?: "sm" | "md" | "lg";
  showProgressStar?: boolean;
}

export default function CharacterAvatar({
  characterType,
  size = "md",
  showProgressStar = false,
}: CharacterAvatarProps) {
  const { gradient, emoji } = characterConfig[characterType];
  const badgeSize = badgeSizeMap[size];

  return (
    <div className="relative inline-block">
      <div
        className={`${sizeMap[size]} rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center border-2 border-white shadow-lg ${
          size === "lg" ? "animate-float" : ""
        }`}
      >
        <span>{emoji}</span>
      </div>
      {showProgressStar && (
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", bounce: 0.5 }}
          className={`absolute ${badgeSize.container} ${badgeSize.badge} rounded-full bg-gradient-to-br from-adventure-gold to-adventure-orange flex items-center justify-center border-2 border-white shadow-lg animate-pulse-glow`}
        >
          <Trophy size={badgeSize.icon} className="text-white" />
        </motion.div>
      )}
    </div>
  );
}
