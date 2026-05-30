import { useEffect } from "react";

interface SEOProps {
  title: string;
  description: string;
  path?: string;
}

const SITE_NAME = "Amira Al Dahab";
const SITE_URL = "https://www.amira-al-dahab.com";
const OG_IMAGE = `${SITE_URL}/og.png`;

export default function SEO({ title, description, path = "" }: SEOProps) {
  useEffect(() => {
    const full = `${title} | ${SITE_NAME}`;
    const canonical = `${SITE_URL}${path}`;

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

    const setLink = (rel: string, href: string) => {
      let el = document.querySelector(`link[rel="${rel}"]`);
      if (!el) {
        el = document.createElement("link");
        el.setAttribute("rel", rel);
        document.head.appendChild(el);
      }
      el.setAttribute("href", href);
    };

    // Basic
    setMeta('meta[name="description"]', "name=description", description);
    setMeta('meta[name="robots"]', "name=robots", "index, follow");
    setMeta('meta[name="theme-color"]', "name=theme-color", "#d4a017");

    // Canonical
    setLink("canonical", canonical);

    // Open Graph
    setMeta('meta[property="og:site_name"]', "property=og:site_name", SITE_NAME);
    setMeta('meta[property="og:title"]', "property=og:title", full);
    setMeta('meta[property="og:description"]', "property=og:description", description);
    setMeta('meta[property="og:image"]', "property=og:image", OG_IMAGE);
    setMeta('meta[property="og:url"]', "property=og:url", canonical);
    setMeta('meta[property="og:type"]', "property=og:type", "website");
    setMeta('meta[property="og:locale"]', "property=og:locale", "en_AE");

    // Twitter
    setMeta('meta[name="twitter:card"]', "name=twitter:card", "summary_large_image");
    setMeta('meta[name="twitter:title"]', "name=twitter:title", full);
    setMeta('meta[name="twitter:description"]', "name=twitter:description", description);
    setMeta('meta[name="twitter:image"]', "name=twitter:image", OG_IMAGE);

  }, [title, description, path]);

  return null;
}
