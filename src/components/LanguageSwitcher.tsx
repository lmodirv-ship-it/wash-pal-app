import { useTranslation } from "react-i18next";
import { Languages, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const LANGS = [
  { code: "ar", label: "العربية", short: "ع" },
  { code: "fr", label: "Français", short: "FR" },
  { code: "en", label: "English", short: "EN" },
] as const;

export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { i18n, t } = useTranslation();
  const activeLanguage = (i18n.resolvedLanguage || i18n.language || "fr").split("-")[0];
  const current = LANGS.find((l) => l.code === activeLanguage) ?? LANGS[1];
  const setLanguage = async (code: (typeof LANGS)[number]["code"]) => {
    localStorage.setItem("lang", code);
    await i18n.changeLanguage(code);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          title={t("language.switchTo")}
          className={`h-10 rounded-xl gap-1.5 font-bold ${className}`}
        >
          <Languages className="w-4 h-4" />
          <span className="text-xs">{current.short}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[160px]">
        {LANGS.map((lng) => (
          <DropdownMenuItem
            key={lng.code}
            onClick={() => setLanguage(lng.code)}
            className="gap-2 cursor-pointer"
          >
            <Check
              className={`w-4 h-4 ${activeLanguage === lng.code ? "opacity-100" : "opacity-0"}`}
            />
            <span className="font-medium">{lng.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
