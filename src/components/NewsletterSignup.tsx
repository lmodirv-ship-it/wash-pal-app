import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Mail, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

const emailSchema = z
  .string()
  .trim()
  .email({ message: "Invalid email" })
  .max(255);

export function NewsletterSignup() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      toast.error(isAr ? "البريد الإلكتروني غير صحيح" : "Invalid email");
      return;
    }
    setLoading(true);
    const { error } = await supabase
      .from("newsletter_subscribers")
      .insert({ email: parsed.data.toLowerCase(), source: "footer", language: i18n.language });

    setLoading(false);

    if (error) {
      if (error.code === "23505") {
        setDone(true);
        toast.success(isAr ? "أنت مشترك بالفعل ✓" : "Already subscribed ✓");
        return;
      }
      toast.error(isAr ? "حدث خطأ، حاول لاحقاً" : "Something went wrong");
      return;
    }
    setDone(true);
    setEmail("");
    toast.success(isAr ? "تم الاشتراك بنجاح 🎉" : "Subscribed successfully 🎉");
  };

  return (
    <div>
      <h4 className="font-bold text-sm text-white mb-3 flex items-center gap-2">
        <Mail className="w-4 h-4" />
        {isAr ? "اشترك في النشرة" : "Newsletter"}
      </h4>
      <p className="text-xs text-white/60 mb-3 leading-relaxed">
        {isAr ? "نصائح، تحديثات وعروض خاصة لأصحاب المغاسل." : "Tips, updates & special offers for car wash owners."}
      </p>
      {done ? (
        <div className="flex items-center gap-2 text-emerald-400 text-sm">
          <Check className="w-4 h-4" />
          {isAr ? "شكراً لاشتراكك!" : "Thanks for subscribing!"}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="email"
            required
            maxLength={255}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={isAr ? "بريدك الإلكتروني" : "Your email"}
            className="flex-1 min-w-0 h-10 px-3 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-cyan-400/50"
          />
          <button
            type="submit"
            disabled={loading}
            className="h-10 px-3 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-400 text-white text-sm font-bold disabled:opacity-50 hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] transition-shadow"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (isAr ? "اشترك" : "Join")}
          </button>
        </form>
      )}
    </div>
  );
}