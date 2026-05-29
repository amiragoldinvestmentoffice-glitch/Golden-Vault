import { useEffect } from "react";

interface SEOProps {
  title: string;
  description: string;
}

const SITE_NAME = "Amira Al Dahab";
const SITE_URL = "https://golden-vault-cy1g.onrender.com";
const OG_IMAGE = `${SITE_URL}/og.png`;

export default function SEO({ title, description }: SEOProps) {
  useEffect(() => {
    const full = `${title} | ${SITE_NAME}`;
    document.title = full;

    const setMeta = (selector: string, attr: string, value: string) => {
      let el = document.querySelector(selector);
      if (!el) {
        el = document.createElement("meta");
        const [key, val] = attr.split("=");
        el.setAttribute(key, val);
        document.head.appendChild(el);
      }
      el.setAttribute("content", value);
    };

    setMeta('meta[name="description"]', "name=description", description);
    setMeta('meta[property="og:title"]', "property=og:title", full);
    setMeta('meta[property="og:description"]', "property=og:description", description);
    setMeta('meta[property="og:image"]', "property=og:image", OG_IMAGE);
    setMeta('meta[property="og:url"]', "property=og:url", SITE_URL);
    setMeta('meta[property="og:type"]', "property=og:type", "website");
    setMeta('meta[name="twitter:card"]', "name=twitter:card", "summary_large_image");
    setMeta('meta[name="twitter:title"]', "name=twitter:title", full);
    setMeta('meta[name="twitter:description"]', "name=twitter:description", description);
  }, [title, description]);

  return null;
}
