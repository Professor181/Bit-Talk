"use client";
import EmojiPicker, { EmojiClickData, Theme } from "emoji-picker-react";

interface Props {
  onEmojiClick: (emojiData: EmojiClickData) => void;
}

export default function EmojiPickerWrapper({ onEmojiClick }: Props) {
  return (
    <EmojiPicker 
      onEmojiClick={onEmojiClick}
      theme={Theme.DARK}
      lazyLoadEmojis={true}
    />
  );
}