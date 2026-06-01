import { useEffect } from "react";

interface SEOProps {
  title: string;
  description: string;
  path?: string;
  image?: string;
  price?: string | number;
  type?: "website" | "product";
}

const SITE_NAME = "Amira Al Dahab";
const SITE_URL = "https://www.amira-al-dahab.com";
const DEFAULT_OG_IMAGE = `${SITE_URL}/og.png`;

export default function SEO({ title, description, path = "", image, price, type = "website" }: SEOProps) {
  useEffect(() => {
    const full = `${title} | ${SITE_NAME}`;
    const canonical = `${SITE_URL}${path}`;
    const ogImage = image || DEFAULT_OG_IMAGE;

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
    setMeta('meta[property="og:image"]', "property=og:image", ogImage);
    setMeta('meta[property="og:image:width"]', "property=og:image:width", "1200");
    setMeta('meta[property="og:image:height"]', "property=og:image:height", "630");
    setMeta('meta[property="og:url"]', "property=og:url", canonical);
    setMeta('meta[property="og:type"]', "property=og:type", type === "product" ? "product" : "website");
    setMeta('meta[property="og:locale"]', "property=og:locale", "en_AE");

    // Product-specific OG tags
    if (price) {
      setMeta('meta[property="og:price:amount"]', "property=og:price:amount", String(price));
      setMeta('meta[property="og:price:currency"]', "property=og:price:currency", "USD");
      setMeta('meta[property="product:price:amount"]', "property=product:price:amount", String(price));
      setMeta('meta[property="product:price:currency"]', "property=product:price:currency", "USD");
    }

    // Twitter
    setMeta('meta[name="twitter:card"]', "name=twitter:card", "summary_large_image");
    setMeta('meta[name="twitter:title"]', "name=twitter:title", full);
    setMeta('meta[name="twitter:description"]', "name=twitter:description", description);
    setMeta('meta[name="twitter:image"]', "name=twitter:image", ogImage);

    // WhatsApp uses og:image — ensure it's absolute
    setMeta('meta[property="og:image:secure_url"]', "property=og:image:secure_url", ogImage);

  }, [title, description, path, image, price, type]);

  return null;
}
