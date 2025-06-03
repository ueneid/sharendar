"use client";

import { X, Copy, Check } from "lucide-react";
import { useState } from "react";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareUrl: string;
  title: string;
}

export default function ShareModal({ isOpen, onClose, shareUrl, title }: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          url: shareUrl,
        });
      } catch (err) {
        console.error("Share failed:", err);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="relative bg-white rounded-t-xl w-full max-w-lg p-6 pb-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full"
        >
          <X className="w-5 h-5" />
        </button>
        
        <h3 className="text-lg font-semibold mb-4">{title}を共有</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              共有リンク
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
              />
              <button
                onClick={handleCopy}
                className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 flex items-center space-x-2"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>コピー済み</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>コピー</span>
                  </>
                )}
              </button>
            </div>
          </div>
          
          {navigator.share && (
            <button
              onClick={handleShare}
              className="w-full py-3 bg-secondary-500 text-white rounded-lg hover:bg-secondary-600"
            >
              他のアプリで共有
            </button>
          )}
        </div>
      </div>
    </div>
  );
}