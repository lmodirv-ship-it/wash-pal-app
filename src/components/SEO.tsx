import { useEffect } from "react";

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  image?: string;
}

function setMeta(selector: string, attr: string, value: string, create?: () => HTMLElement) {
  let el = document.head.querySelector<HTMLMetaElement | HTMLLinkElement>(selector);
  if (!el && create) {
    el = create() as any;
    document.head.appendChild(el);
  }
  if (el) el.setAttribute(attr, value);
}

export function SEO({ title, description, canonical, image }: SEOProps) {
  useEffect(() => {
    if (title) {
      document.title = title.length > 60 ? title.slice(0, 57) + "..." : title;
      setMeta('meta[property="og:title"]', "content", title, () => {
        const m = document.createElement("meta");
        m.setAttribute("property", "og:title");
        return m;
      });
      setMeta('meta[name="twitter:title"]', "content", title, () => {
        const m = document.createElement("meta");
        m.setAttribute("name", "twitter:title");
        return m;
      });
    }
    if (description) {
      const desc = description.length > 160 ? description.slice(0, 157) + "..." : description;
      setMeta('meta[name="description"]', "content", desc, () => {
        const m = document.createElement("meta");
        m.setAttribute("name", "description");
        return m;
      });
      setMeta('meta[property="og:description"]', "content", desc, () => {
        const m = document.createElement("meta");
        m.setAttribute("property", "og:description");
        return m;
      });
      setMeta('meta[name="twitter:description"]', "content", desc, () => {
        const m = document.createElement("meta");
        m.setAttribute("name", "twitter:description");
        return m;
      });
    }
    if (canonical) {
      setMeta('link[rel="canonical"]', "href", canonical, () => {
        const l = document.createElement("link");
        l.setAttribute("rel", "canonical");
        return l;
      });
    }
    if (image) {
      setMeta('meta[property="og:image"]', "content", image, () => {
        const m = document.createElement("meta");
        m.setAttribute("property", "og:image");
        return m;
      });
      setMeta('meta[name="twitter:image"]', "content", image, () => {
        const m = document.createElement("meta");
        m.setAttribute("name", "twitter:image");
        return m;
      });
    }
  }, [title, description, canonical, image]);

  return null;
}