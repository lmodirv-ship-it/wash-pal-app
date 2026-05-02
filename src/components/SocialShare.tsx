import { useTranslation } from "react-i18next";
import { Facebook, MessageCircle, Twitter, Link2, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface SocialShareProps {
  url?: string;
  title?: string;
  className?: string;
}

export function SocialShare({ url, title, className = "" }: SocialShareProps) {
  const { i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const [copied, setCopied] = useState(false);

  const shareUrl = url || (typeof window !== "undefined" ? window.location.origin : "");
  const shareTitle = title || (isAr ? "اكتشف CarwashPro - منصة إدارة المغاسل" : "Discover CarwashPro - The car wash platform");

  const enc = encodeURIComponent;
  const links = {
    whatsapp: `https://wa.me/?text=${enc(shareTitle + " " + shareUrl)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${enc(shareUrl)}`,
    twitter: `https://twitter.com/intent/tweet?text=${enc(shareTitle)}&url=${enc(shareUrl)}`,
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success(isAr ? "تم نسخ الرابط ✓" : "Link copied ✓");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(isAr ? "تعذر النسخ" : "Copy failed");
    }
  };

  const btn = "w-10 h-10 rounded-full flex items-center justify-center border border-white/15 bg-white/5 text-white/80 hover:text-white hover:bg-white/10 hover:border-white/30 transition-all backdrop-blur-md";

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-xs text-white/50 me-1">
        {isAr ? "شارك:" : "Share:"}
      </span>
      <a href={links.whatsapp} target="_blank" rel="noopener noreferrer" className={btn} aria-label="WhatsApp">
        <MessageCircle className="w-4 h-4" />
      </a>
      <a href={links.facebook} target="_blank" rel="noopener noreferrer" className={btn} aria-label="Facebook">
        <Facebook className="w-4 h-4" />
      </a>
      <a href={links.twitter} target="_blank" rel="noopener noreferrer" className={btn} aria-label="Twitter / X">
        <Twitter className="w-4 h-4" />
      </a>
      <button onClick={handleCopy} className={btn} aria-label={isAr ? "نسخ الرابط" : "Copy link"}>
        {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Link2 className="w-4 h-4" />}
      </button>
    </div>
  );
}