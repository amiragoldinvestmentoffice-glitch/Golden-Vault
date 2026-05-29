import { useState } from "react";
import { X, MessageCircle } from "lucide-react";

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
          className="relative z-10 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-transform hover:scale-110 active:scale-95 bg-green-500 hover:bg-green-400"
        >
          <MessageCircle size={28} color="white" strokeWidth={2} />
        </a>
      </div>

    </div>
  );
}
