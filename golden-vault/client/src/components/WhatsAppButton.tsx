import { useState } from "react";
import { X } from "lucide-react";

const WHATSAPP_NUMBER = "971500000000"; // 🔁 Replace with your real WhatsApp number (no + or spaces)
const WHATSAPP_MESSAGE = "Hello! I have a question about Amira Al Dahab.";

export default function WhatsAppButton() {
  const [tooltip, setTooltip] = useState(true);

  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {/* Tooltip bubble */}
      {tooltip && (
        <div className="flex items-center gap-2 bg-stone-800 border border-stone-700 text-stone-100 text-sm rounded-2xl px-4 py-2 shadow-lg animate-fade-in max-w-[200px]">
          <span>Chat with us on WhatsApp!</span>
          <button
            onClick={() => setTooltip(false)}
            className="text-stone-400 hover:text-stone-200 flex-shrink-0"
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* WhatsApp button */}
      
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => setTooltip(false)}
        aria-label="Chat on WhatsApp"
        className="w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
        style={{ backgroundColor: "#25D366" }}
      >
        {/* WhatsApp SVG icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 32 32"
          width="30"
          height="30"
          fill="white"
        >
          <path d="M16.003 2.667C8.637 2.667 2.667 8.637 2.667 16c0 2.363.633 4.673 1.833 6.697L2.667 29.333l6.82-1.787A13.29 13.29 0 0 0 16.003 29.333C23.37 29.333 29.333 23.363 29.333 16S23.37 2.667 16.003 2.667zm0 24.267a11.01 11.01 0 0 1-5.607-1.533l-.4-.24-4.047 1.06 1.08-3.94-.26-.407A10.963 10.963 0 0 1 5.04 16c0-6.04 4.923-10.96 10.963-10.96S27 9.96 27 16s-4.917 10.934-10.997 10.934zm6.007-8.2c-.327-.163-1.94-.957-2.24-1.067-.3-.113-.52-.163-.737.163-.22.327-.847 1.067-.963 1.287-.12.22-.233.247-.56.083-.327-.163-1.38-.507-2.627-1.617-.973-.867-1.627-1.933-1.82-2.26-.19-.327-.02-.5.143-.663.147-.147.327-.38.49-.567.163-.19.217-.327.327-.543.11-.22.057-.41-.027-.573-.083-.163-.737-1.78-1.01-2.437-.267-.64-.537-.553-.737-.563-.19-.01-.41-.013-.627-.013-.22 0-.573.083-.873.41-.3.327-1.143 1.117-1.143 2.72s1.17 3.153 1.333 3.373c.163.22 2.303 3.517 5.58 4.933.78.337 1.387.537 1.863.687.783.247 1.497.213 2.06.13.627-.093 1.94-.793 2.213-1.557.273-.763.273-1.42.19-1.557-.08-.137-.3-.22-.627-.383z" />
        </svg>

        {/* Pulse ring */}
        <span
          className="absolute w-14 h-14 rounded-full animate-ping opacity-30"
          style={{ backgroundColor: "#25D366" }}
        />
      </a>
    </div>
  );
}
