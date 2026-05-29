export default function WhatsAppButton() {
  const phone = "971500000000";
  const text = encodeURIComponent("Hello! I have a question about Amira Al Dahab.");
  const link = "https://wa.me/" + phone + "?text=" + text;

  return (
    
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        zIndex: 50,
        width: "56px",
        height: "56px",
        borderRadius: "50%",
        backgroundColor: "#25D366",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
        textDecoration: "none",
        color: "white",
        fontSize: "26px",
      }}
    >
      💬
    </a>
  );
}
