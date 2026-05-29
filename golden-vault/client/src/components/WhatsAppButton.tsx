import { useState } from "react";
import { X } from "lucide-react";

const WHATSAPP_NUMBER = "971500000000";
const WHATSAPP_MESSAGE = "Hello! I have a question about Amira Al Dahab.";

export default function WhatsAppButton() {
  const [tooltip, setTooltip] = useState(true);

  const url =
    "https://wa.me/" +
    WHATSAPP_NUMBER +
    "?text=" +
    encodeURIComponent(WHATSAPP_MESSAGE);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">

      {tooltip && (
        <div className="flex items-center gap-2 bg-stone-800 border border-stone-700 text-stone-100 text-sm rounded-2xl px-4 py-2 shadow-lg max-w-xs">
          <span>Chat with us on WhatsApp!</span>
          <button
            onClick={() => setTooltip(false)}
            className="text-stone-400 hover:text-stone-200 flex-shrink-0"
          >
            <X size={13} />
          </button>
        </div>
      )}

      <div className="relative flex items-center justify-center w-14 h-14">
        <span className="absolute inset-0 rounded-full animate-ping opacity-25 bg-green-500" />
        
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat on WhatsApp"
          onClick={() => setTooltip(false)}
          className="relative z-10 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
          style={{ backgroundColor: "#25D366" }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            width="28"
            height="28"
            fill="white"
          >
            <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.524 3.655 1.435 5.16L2 22l4.949-1.418A9.955 9.955 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18a7.96 7.96 0 0 1-4.273-1.243l-.306-.186-3.122.896.858-3.044-.2-.313A7.96 7.96 0 0 1 4 12c0-4.411 3.589-8 8-8s8 3.589 8 8-3.589 8-8 8zm4.406-5.872c-.242-.121-1.43-.706-1.651-.786-.222-.08-.384-.121-.545.121-.16.242-.625.786-.766.948-.141.161-.282.181-.524.06-.242-.12-1.022-.376-1.947-1.196-.72-.638-1.206-1.428-1.347-1.67-.141-.242-.015-.373.106-.493.109-.109.242-.282.363-.423.12-.141.16-.242.242-.403.08-.161.04-.302-.02-.423-.061-.12-.545-1.316-.746-1.8-.196-.471-.396-.407-.545-.415l-.464-.008c-.161 0-.423.06-.645.302-.222.242-.847.827-.847 2.017s.867 2.34 1.008 2.502c.14.161 1.706 2.604 4.134 3.65.578.25 1.028.398 1.38.51.58.184 1.108.158 1.525.096.465-.069 1.43-.585 1.632-1.15.2-.564.2-1.046.14-1.147-.06-.1-.222-.161-.464-.282z" />
          </svg>
        </a>
      </div>
    </div>
  );
}
