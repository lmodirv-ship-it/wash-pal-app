import { Service } from "@/types";

export function getServiceName(s: Service, lang: string): string {
  if (lang === "fr") return s.nameFr || s.nameAr || s.name;
  if (lang === "en") return s.nameEn || s.nameAr || s.name;
  return s.nameAr || s.name;
}

export function getServiceDescription(s: Service, lang: string): string {
  if (lang === "fr") return s.descriptionFr || s.descriptionAr || s.description || "";
  if (lang === "en") return s.descriptionEn || s.descriptionAr || s.description || "";
  return s.descriptionAr || s.description || "";
}
