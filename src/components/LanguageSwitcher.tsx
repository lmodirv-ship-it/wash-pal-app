import { useTranslation } from "react-i18next";
import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { i18n, t } = useTranslation();
  const next = i18n.language === "ar" ? "fr" : "ar";

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => i18n.changeLanguage(next)}
      title={t("language.switchTo")}
      className={`h-10 rounded-xl gap-1.5 font-bold ${className}`}
    >
      <Languages className="w-4 h-4" />
      <span className="text-xs">{next === "ar" ? "ع" : "FR"}</span>
    </Button>
  );
}
