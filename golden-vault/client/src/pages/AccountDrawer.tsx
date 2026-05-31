import { useState, useRef, useEffect } from "react";
import { X, Camera, Upload, CheckCircle, Clock, AlertCircle, ChevronDown, User, MapPin, Briefcase, Phone, Mail, Shield } from "lucide-react";
import { api } from "../lib/api";

// ── Theme (matches ShopPage) ──────────────────────────────────────────────────
const DARK = {
  pageBg: "#06080F",
  drawerBg: "#0A0D18",
  cardBg: "#0F1420",
  text: "#EDE5D5",
  textSub: "#8899AA",
  textMuted: "#445566",
  gold: "#D4A820",
  goldLight: "#F0C940",
  goldGlow: "rgba(212,168,32,0.25)",
  border: "rgba(212,168,32,0.1)",
  borderHover: "rgba(212,168,32,0.4)",
  inputBg: "#07090F",
  shadow: "0 4px 24px rgba(0,0,0,0.55)",
  btnTextColor: "#0A0700",
  overlay: "rgba(0,0,0,0.75)",
};
const LIGHT = {
  pageBg: "#FDF8F0",
  drawerBg: "#FFFFFF",
  cardBg: "#FDF8F0",
  text: "#1A1208",
  textSub: "#6B5534",
  textMuted: "#9B8A60",
  gold: "#B8880A",
  goldLight: "#D4A820",
  goldGlow: "rgba(184,136,10,0.18)",
  border: "rgba(184,136,10,0.18)",
  borderHover: "rgba(184,136,10,0.5)",
  inputBg: "#F5EDD8",
  shadow: "0 4px 24px rgba(120,80,0,0.1)",
  btnTextColor: "#FFFFFF",
  overlay: "rgba(100,60,0,0.45)",
};

type KYCStatus = "not_submitted" | "pending" | "verified" | "rejected";

interface ProfileData {
  full_name: string;
  phone: string;
  location: string;
  job: string;
  avatar_url: string;
}

interface KYCData {
  status: KYCStatus;
  id_type: string;
  rejection_reason?: string;
}

interface AccountDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user: { id: number; email: string; name?: string } | null;
  isDark: boolean;
}

// Inject styles once
const STYLE_ID = "amira-drawer-styles";
function injectDrawerStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const el = document.createElement("style");
  el.id = STYLE_ID;
  el.textContent = `
    .amira-upload-label {
      display: block;
      cursor: pointer;
    }
    .amira-upload-label input[type="file"] {
      position: absolute;
      width: 1px;
      height: 1px;
      opacity: 0;
      overflow: hidden;
      clip: rect(0,0,0,0);
      white-space: nowrap;
    }
    .amira-upload-box {
      border-radius: 12px;
      height: 110px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      transition: border-color 0.2s ease;
      position: relative;
    }
    .amira-upload-box:hover {
      border-style: solid !important;
    }
  `;
  document.head.appendChild(el);
}

export default function AccountDrawer({ isOpen, onClose, user, isDark }: AccountDrawerProps) {
  const C = isDark ? DARK : LIGHT;
  const [tab, setTab] = useState<"profile" | "kyc">("profile");

  useEffect(() => { injectDrawerStyles(); }, []);

  // Profile state
  const [profile, setProfile] = useState<ProfileData>({
    full_name: user?.name || "",
    phone: "",
    location: "",
    job: "",
    avatar_url: "",
  });
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");

  // KYC state — matches existing /api/kyc route (JSON, no file upload)
  const [kyc, setKyc] = useState<KYCData>({ status: "not_submitted", id_type: "passport" });
  const [kycForm, setKycForm] = useState({
    fullName: "",
    country: "",
    idType: "passport",
    idNumber: "",
    selfieNote: "",
  });
  const [kycSubmitting, setKycSubmitting] = useState(false);
  const [kycStatus, setKycStatus] = useState<"idle" | "success" | "error">("idle");

  // Load profile & KYC on open
  useEffect(() => {
    if (!isOpen || !user) return;
    api.get("/user/profile")
      .then((r) => {
        const d = r.data;
        setProfile({
          full_name: d.full_name || user.name || "",
          phone: d.phone || "",
          location: d.location || "",
          job: d.job || "",
          avatar_url: d.avatar_url || "",
        });
        if (d.avatar_url) setAvatarPreview(d.avatar_url);
      })
      .catch(() => {});
    api.get("/kyc")
      .then((r) => {
        const d = r.data;
        if (!d) return;
        setKyc({
          status: d.status === "approved" ? "verified" : (d.status ?? "not_submitted"),
          id_type: d.id_type ?? "passport",
          rejection_reason: d.admin_note ?? d.rejection_reason ?? undefined,
        });
        if (d.full_name) setKycForm(f => ({ ...f, fullName: d.full_name, idType: d.id_type ?? "passport" }));
      })
      .catch(() => {});
  }, [isOpen, user]);

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  // ── File helpers ────────────────────────────────────────────────────────────
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleKycFile = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (f: File) => void,
    previewSetter: (s: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setter(file);
    const reader = new FileReader();
    reader.onload = (ev) => previewSetter(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  // ── Actions ─────────────────────────────────────────────────────────────────
  const saveProfile = async () => {
    setSaving(true);
    setSaveStatus("idle");
    try {
      let avatarUrl = profile.avatar_url;
      if (avatarFile) {
        const formData = new FormData();
        formData.append("avatar", avatarFile);
        const res = await api.post("/user/profile/avatar", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        avatarUrl = res.data.url;
      }
      await api.put("/user/profile", { ...profile, avatar_url: avatarUrl });
      setProfile((p) => ({ ...p, avatar_url: avatarUrl }));
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch {
      setSaveStatus("error");
    } finally {
      setSaving(false);
    }
  };

  const submitKyc = async () => {
    if (!kycForm.fullName.trim() || !kycForm.country.trim() || !kycForm.idNumber.trim()) return;
    setKycSubmitting(true);
    setKycStatus("idle");
    try {
      await api.post("/kyc", {
        fullName:   kycForm.fullName.trim(),
        country:    kycForm.country.trim(),
        idType:     kycForm.idType,
        idNumber:   kycForm.idNumber.trim(),
        selfieNote: kycForm.selfieNote.trim() || undefined,
      });
      setKyc((k) => ({ ...k, status: "pending" }));
      setKycStatus("success");
    } catch {
      setKycStatus("error");
    } finally {
      setKycSubmitting(false);
    }
  };

  // ── Style helpers ────────────────────────────────────────────────────────────
  const fieldLabel = (text: string) => (
    <label
      style={{
        display: "block",
        fontSize: 11,
        fontWeight: 600,
        color: C.textMuted,
        textTransform: "uppercase" as const,
        letterSpacing: "0.1em",
        marginBottom: 6,
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {text}
    </label>
  );

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "11px 14px",
    background: C.inputBg,
    border: `1px solid ${C.border}`,
    borderRadius: 10,
    color: C.text,
    fontSize: 14,
    outline: "none",
    fontFamily: "'DM Sans', sans-serif",
    transition: "border-color 0.2s ease",
    boxSizing: "border-box",
  };

  const kycStatusConfig: Record<KYCStatus, { color: string; icon: JSX.Element; label: string; bg: string }> = {
    not_submitted: {
      color: C.textMuted,
      icon: <AlertCircle size={16} />,
      label: "Not Submitted",
      bg: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
    },
    pending: {
      color: "#F59E0B",
      icon: <Clock size={16} />,
      label: "Under Review",
      bg: "rgba(245,158,11,0.08)",
    },
    verified: {
      color: "#10B981",
      icon: <CheckCircle size={16} />,
      label: "Verified",
      bg: "rgba(16,185,129,0.08)",
    },
    rejected: {
      color: "#F87171",
      icon: <AlertCircle size={16} />,
      label: "Rejected",
      bg: "rgba(248,113,113,0.08)",
    },
  };

  const kycStatusInfo = kycStatusConfig[kyc.status];

  // ── Upload Box — uses <label> wrapping <input> so click always works ─────────
  const UploadBox = ({
    label,
    preview,
    onChange,
    required,
    uid,
  }: {
    label: string;
    preview: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    required?: boolean;
    uid: string; // unique id for label↔input linkage
  }) => (
    <div>
      {fieldLabel(label + (required ? " *" : ""))}
      <label
        htmlFor={uid}
        style={{
          display: "block",
          cursor: "pointer",
          borderRadius: 12,
          height: 110,
          border: `2px dashed ${preview ? C.gold : C.border}`,
          background: preview ? "transparent" : C.inputBg,
          overflow: "hidden",
          position: "relative",
          transition: "border-color 0.2s ease",
        }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLLabelElement).style.borderColor = C.gold)}
        onMouseLeave={(e) =>
          ((e.currentTarget as HTMLLabelElement).style.borderColor = preview ? C.gold : C.border)
        }
      >
        {preview ? (
          <img src={preview} alt={label} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <Upload size={20} style={{ color: C.textMuted }} />
            <span style={{ color: C.textMuted, fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>
              Click to upload
            </span>
          </div>
        )}
        {/* Hidden but real input — tied to label via id */}
        <input
          id={uid}
          type="file"
          accept="image/*,.pdf"
          style={{
            position: "absolute",
            width: 1,
            height: 1,
            opacity: 0,
            overflow: "hidden",
            clip: "rect(0,0,0,0)",
            whiteSpace: "nowrap",
          }}
          onChange={onChange}
        />
      </label>
    </div>
  );

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: C.overlay,
          zIndex: 998,
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
          transition: "opacity 0.3s ease",
          backdropFilter: "blur(4px)",
        }}
      />

      {/* Drawer */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "min(480px, 100vw)",
          background: C.drawerBg,
          borderLeft: `1px solid ${C.border}`,
          zIndex: 999,
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.38s cubic-bezier(0.32, 0.72, 0, 1)",
          display: "flex",
          flexDirection: "column",
          boxShadow: isDark ? "-24px 0 80px rgba(0,0,0,0.6)" : "-24px 0 80px rgba(100,60,0,0.15)",
          overflowY: "auto",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "24px 24px 0",
            borderBottom: `1px solid ${C.border}`,
            position: "sticky",
            top: 0,
            background: C.drawerBg,
            zIndex: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div>
              <p style={{ color: C.textMuted, fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", margin: 0, marginBottom: 4 }}>My Account</p>
              <h2
                style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontSize: 22,
                  fontWeight: 600,
                  color: C.gold,
                  margin: 0,
                }}
              >
                {profile.full_name || user?.name || user?.email?.split("@")[0] || "Investor"}
              </h2>
              <p style={{ color: C.textMuted, fontSize: 12, margin: "3px 0 0", fontFamily: "'DM Sans', sans-serif" }}>
                {user?.email}
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                width: 38, height: 38, borderRadius: "50%",
                background: C.cardBg, border: `1px solid ${C.border}`,
                color: C.textSub, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", borderBottom: `1px solid ${C.border}` }}>
            {(["profile", "kyc"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  padding: "12px 20px",
                  background: "transparent",
                  border: "none",
                  borderBottom: `2px solid ${tab === t ? C.gold : "transparent"}`,
                  color: tab === t ? C.gold : C.textMuted,
                  fontSize: 13,
                  fontWeight: tab === t ? 600 : 400,
                  cursor: "pointer",
                  textTransform: "capitalize",
                  fontFamily: "'DM Sans', sans-serif",
                  letterSpacing: "0.04em",
                  transition: "all 0.2s ease",
                  marginBottom: -1,
                }}
              >
                {t === "kyc" ? "KYC Verification" : "Profile"}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "28px 24px", flex: 1 }}>

          {/* ── PROFILE TAB ── */}
          {tab === "profile" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>

              {/* Avatar — also uses label-based upload */}
              <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <label htmlFor="avatar-upload" style={{ cursor: "pointer", display: "block" }}>
                    <div
                      style={{
                        width: 80, height: 80, borderRadius: "50%",
                        border: `2px solid ${C.gold}60`,
                        overflow: "hidden",
                        background: isDark ? "#0F1420" : "#F5EDD8",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        boxShadow: `0 0 24px ${C.goldGlow}`,
                      }}
                    >
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <User size={30} style={{ color: C.textMuted }} />
                      )}
                    </div>
                    <div
                      style={{
                        position: "absolute", bottom: 0, right: 0,
                        width: 26, height: 26, borderRadius: "50%",
                        background: C.gold, border: `2px solid ${C.drawerBg}`,
                        color: C.btnTextColor,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        pointerEvents: "none",
                      }}
                    >
                      <Camera size={12} />
                    </div>
                  </label>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    style={{
                      position: "absolute", width: 1, height: 1,
                      opacity: 0, overflow: "hidden",
                      clip: "rect(0,0,0,0)", whiteSpace: "nowrap",
                    }}
                    onChange={handleAvatarChange}
                  />
                </div>
                <div>
                  <p style={{ color: C.text, fontWeight: 500, fontSize: 15, margin: "0 0 3px", fontFamily: "'Cormorant Garamond', serif" }}>
                    Profile Photo
                  </p>
                  <p style={{ color: C.textMuted, fontSize: 12, margin: 0, fontFamily: "'DM Sans', sans-serif" }}>
                    JPG, PNG or GIF — max 5MB
                  </p>
                  <label
                    htmlFor="avatar-upload"
                    style={{
                      display: "inline-block", marginTop: 8,
                      padding: "5px 14px", borderRadius: 8,
                      background: "transparent", border: `1px solid ${C.border}`,
                      color: C.gold, fontSize: 12, cursor: "pointer",
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    Upload Photo
                  </label>
                </div>
              </div>

              <hr style={{ border: "none", borderTop: `1px solid ${C.border}`, margin: 0 }} />

              {/* Full name */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
                  <User size={13} style={{ color: C.textMuted }} />
                  {fieldLabel("Full Name")}
                </div>
                <input type="text" placeholder="e.g. Amira Al Dahab" value={profile.full_name}
                  onChange={(e) => setProfile((p) => ({ ...p, full_name: e.target.value }))}
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = C.gold)}
                  onBlur={(e) => (e.target.style.borderColor = C.border)}
                />
              </div>

              {/* Email (read only) */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
                  <Mail size={13} style={{ color: C.textMuted }} />
                  {fieldLabel("Email Address")}
                </div>
                <input type="email" value={user?.email || ""} readOnly
                  style={{ ...inputStyle, opacity: 0.5, cursor: "not-allowed" }}
                />
              </div>

              {/* Phone */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
                  <Phone size={13} style={{ color: C.textMuted }} />
                  {fieldLabel("Phone Number")}
                </div>
                <input type="tel" placeholder="+971 50 000 0000" value={profile.phone}
                  onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = C.gold)}
                  onBlur={(e) => (e.target.style.borderColor = C.border)}
                />
              </div>

              {/* Location */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
                  <MapPin size={13} style={{ color: C.textMuted }} />
                  {fieldLabel("Location")}
                </div>
                <input type="text" placeholder="e.g. Dubai, UAE" value={profile.location}
                  onChange={(e) => setProfile((p) => ({ ...p, location: e.target.value }))}
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = C.gold)}
                  onBlur={(e) => (e.target.style.borderColor = C.border)}
                />
              </div>

              {/* Job */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
                  <Briefcase size={13} style={{ color: C.textMuted }} />
                  {fieldLabel("Occupation")}
                </div>
                <input type="text" placeholder="e.g. Business Owner, Investor" value={profile.job}
                  onChange={(e) => setProfile((p) => ({ ...p, job: e.target.value }))}
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = C.gold)}
                  onBlur={(e) => (e.target.style.borderColor = C.border)}
                />
              </div>

              {/* Save button */}
              <button
                onClick={saveProfile}
                disabled={saving}
                style={{
                  width: "100%", padding: "13px", borderRadius: 11,
                  background: C.gold, color: C.btnTextColor,
                  border: "none", fontSize: 14, fontWeight: 600,
                  cursor: saving ? "not-allowed" : "pointer",
                  fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.05em",
                  opacity: saving ? 0.6 : 1, transition: "opacity 0.2s ease, transform 0.1s ease",
                  marginTop: 4,
                }}
                onMouseEnter={(e) => !saving && (e.currentTarget.style.transform = "translateY(-1px)")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
              >
                {saving ? "Saving…" : "Save Profile"}
              </button>

              {saveStatus === "success" && (
                <div style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 8 }}>
                  <CheckCircle size={15} style={{ color: "#10B981", flexShrink: 0 }} />
                  <span style={{ color: "#10B981", fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>Profile saved successfully!</span>
                </div>
              )}
              {saveStatus === "error" && (
                <p style={{ color: "#F87171", fontSize: 12, fontFamily: "'DM Sans', sans-serif", margin: 0 }}>Failed to save. Please try again.</p>
              )}
            </div>
          )}

          {/* ── KYC TAB ── */}
          {tab === "kyc" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>

              {/* Status badge */}
              <div style={{ background: kycStatusInfo.bg, border: `1px solid ${kycStatusInfo.color}30`, borderRadius: 14, padding: "16px 20px", display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div style={{ color: kycStatusInfo.color, flexShrink: 0, marginTop: 1 }}>{kycStatusInfo.icon}</div>
                <div>
                  <p style={{ color: kycStatusInfo.color, fontWeight: 600, fontSize: 14, margin: "0 0 4px", fontFamily: "'DM Sans', sans-serif" }}>
                    {kycStatusInfo.label}
                  </p>
                  {kyc.status === "not_submitted" && <p style={{ color: C.textMuted, fontSize: 12, margin: 0, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6 }}>Complete KYC to unlock higher investment limits and full account access.</p>}
                  {kyc.status === "pending" && <p style={{ color: C.textMuted, fontSize: 12, margin: 0, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6 }}>Your documents are being reviewed. This typically takes 1–2 business days.</p>}
                  {kyc.status === "verified" && <p style={{ color: C.textMuted, fontSize: 12, margin: 0, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6 }}>Your identity is verified. You have full access to all investment features.</p>}
                  {kyc.status === "rejected" && kyc.rejection_reason && <p style={{ color: C.textMuted, fontSize: 12, margin: 0, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6 }}>Reason: {kyc.rejection_reason}</p>}
                </div>
              </div>

              {/* Benefits */}
              {kyc.status !== "verified" && (
                <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px 18px" }}>
                  <p style={{ color: C.gold, fontSize: 12, fontWeight: 600, margin: "0 0 10px", letterSpacing: "0.06em", textTransform: "uppercase", fontFamily: "'DM Sans', sans-serif" }}>Benefits of Verification</p>
                  {["Higher investment limits (up to $500,000)", "Expedited withdrawals", "Access to exclusive gold offerings", "Verified badge on your profile"].map((b) => (
                    <div key={b} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.gold, flexShrink: 0 }} />
                      <span style={{ color: C.textSub, fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>{b}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* KYC form — matches /api/kyc JSON schema */}
              {(kyc.status === "not_submitted" || kyc.status === "rejected") && (
                <>
                  <hr style={{ border: "none", borderTop: `1px solid ${C.border}`, margin: 0 }} />

                  {/* Full name */}
                  <div>
                    {fieldLabel("Full Name *")}
                    <input type="text" placeholder="e.g. Amira Al Dahab" value={kycForm.fullName}
                      onChange={(e) => setKycForm(f => ({ ...f, fullName: e.target.value }))}
                      style={inputStyle}
                      onFocus={(e) => (e.target.style.borderColor = C.gold)}
                      onBlur={(e) => (e.target.style.borderColor = C.border)}
                    />
                  </div>

                  {/* Country */}
                  <div>
                    {fieldLabel("Country *")}
                    <input type="text" placeholder="e.g. United Arab Emirates" value={kycForm.country}
                      onChange={(e) => setKycForm(f => ({ ...f, country: e.target.value }))}
                      style={inputStyle}
                      onFocus={(e) => (e.target.style.borderColor = C.gold)}
                      onBlur={(e) => (e.target.style.borderColor = C.border)}
                    />
                  </div>

                  {/* ID type */}
                  <div>
                    {fieldLabel("ID Document Type *")}
                    <div style={{ position: "relative" }}>
                      <select
                        value={kycForm.idType}
                        onChange={(e) => setKycForm(f => ({ ...f, idType: e.target.value }))}
                        style={{ ...inputStyle, appearance: "none" as any, paddingRight: 36, cursor: "pointer" }}
                        onFocus={(e) => (e.target.style.borderColor = C.gold)}
                        onBlur={(e) => (e.target.style.borderColor = C.border)}
                      >
                        <option value="passport">Passport</option>
                        <option value="national_id">National ID</option>
                        <option value="drivers_license">Driver's License</option>
                      </select>
                      <ChevronDown size={14} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: C.textMuted, pointerEvents: "none" }} />
                    </div>
                  </div>

                  {/* ID number */}
                  <div>
                    {fieldLabel("ID Number *")}
                    <input type="text" placeholder="e.g. A12345678" value={kycForm.idNumber}
                      onChange={(e) => setKycForm(f => ({ ...f, idNumber: e.target.value }))}
                      style={inputStyle}
                      onFocus={(e) => (e.target.style.borderColor = C.gold)}
                      onBlur={(e) => (e.target.style.borderColor = C.border)}
                    />
                  </div>

                  {/* Selfie note */}
                  <div>
                    {fieldLabel("Additional Notes (optional)")}
                    <input type="text" placeholder="e.g. Passport expires 2029, issued in UAE" value={kycForm.selfieNote}
                      onChange={(e) => setKycForm(f => ({ ...f, selfieNote: e.target.value }))}
                      style={inputStyle}
                      onFocus={(e) => (e.target.style.borderColor = C.gold)}
                      onBlur={(e) => (e.target.style.borderColor = C.border)}
                    />
                  </div>

                  <p style={{ color: C.textMuted, fontSize: 11, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.65, margin: 0 }}>
                    🔒 Your information is encrypted and reviewed manually by our compliance team within 1–2 business days.
                  </p>

                  <button
                    onClick={submitKyc}
                    disabled={kycSubmitting || !kycForm.fullName.trim() || !kycForm.country.trim() || !kycForm.idNumber.trim()}
                    style={{
                      width: "100%", padding: "13px", borderRadius: 11,
                      background: C.gold, color: C.btnTextColor,
                      border: "none", fontSize: 14, fontWeight: 600,
                      cursor: kycSubmitting || !kycForm.fullName.trim() || !kycForm.country.trim() || !kycForm.idNumber.trim() ? "not-allowed" : "pointer",
                      fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.05em",
                      opacity: kycSubmitting || !kycForm.fullName.trim() || !kycForm.country.trim() || !kycForm.idNumber.trim() ? 0.45 : 1,
                      transition: "opacity 0.2s ease",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    }}
                  >
                    <Shield size={15} />
                    {kycSubmitting ? "Submitting…" : "Submit for Verification"}
                  </button>

                                    {kycStatus === "success" && (
                    <div style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 8 }}>
                      <CheckCircle size={15} style={{ color: "#10B981", flexShrink: 0 }} />
                      <span style={{ color: "#10B981", fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>Documents submitted! We'll review within 1–2 business days.</span>
                    </div>
                  )}
                  {kycStatus === "error" && (
                    <p style={{ color: "#F87171", fontSize: 12, fontFamily: "'DM Sans', sans-serif", margin: 0 }}>Submission failed. Please try again or contact support.</p>
                  )}
                </>
              )}

              {/* Verified state */}
              {kyc.status === "verified" && (
                <div style={{ textAlign: "center", padding: "32px 20px" }}>
                  <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(16,185,129,0.1)", border: "2px solid rgba(16,185,129,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                    <CheckCircle size={32} style={{ color: "#10B981" }} />
                  </div>
                  <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 20, fontWeight: 600, color: "#10B981", margin: "0 0 8px" }}>Identity Verified</p>
                  <p style={{ color: C.textMuted, fontSize: 13, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6, margin: 0 }}>Your account is fully verified. You have access to all investment limits and features.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 24px", borderTop: `1px solid ${C.border}`, background: C.drawerBg }}>
          <p style={{ color: C.textMuted, fontSize: 11, textAlign: "center", margin: 0, fontFamily: "'DM Sans', sans-serif" }}>
            🔒 Your data is encrypted and protected by bank-level security
          </p>
        </div>
      </div>
    </>
  );
}
