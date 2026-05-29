import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "../lib/auth";

export default function SignInPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const [, navigate] = useLocation();

  const handleSubmit = async () => {
    setError("");
    setMessage("");
    setLoading(true);
    if (isSignUp) {
      const { error } = await signUp(email, password, fullName);
      if (error) {
        setError(error.message);
      } else {
        setMessage("Check your email to confirm your account, then sign in.");
      }
    } else {
      const { error } = await signIn(email, password);
      if (error) {
        setError(error.message);
      } else {
        navigate("/");
      }
    }
    setLoading(false);
  };

  return (
    <div className="flex justify-center py-16 px-4">
      <div className="bg-stone-900 border border-stone-700 rounded-2xl p-8 w-full max-w-md">
        <h1 className="text-2xl font-serif text-gold-400 mb-2 text-center">
          {isSignUp ? "Create Account" : "Welcome Back"}
        </h1>
        <p className="text-stone-400 text-sm text-center mb-6">
          {isSignUp ? "Join Amira Al Dahab" : "Sign in to your account"}
        </p>

        {error && <div className="bg-red-900/40 border border-red-700 text-red-300 rounded-lg px-4 py-3 text-sm mb-4">{error}</div>}
        {message && <div className="bg-green-900/40 border border-green-700 text-green-300 rounded-lg px-4 py-3 text-sm mb-4">{message}</div>}

        <div className="space-y-4">
          {isSignUp && (
            <div>
              <label className="text-stone-300 text-sm block mb-1">Full Name</label>
              <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your name" className="w-full bg-stone-800 border border-stone-600 rounded-lg px-4 py-2.5 text-stone-100 placeholder-stone-500 focus:outline-none focus:border-gold-500" />
            </div>
          )}
          <div>
            <label className="text-stone-300 text-sm block mb-1">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="w-full bg-stone-800 border border-stone-600 rounded-lg px-4 py-2.5 text-stone-100 placeholder-stone-500 focus:outline-none focus:border-gold-500" />
          </div>
          <div>
            <label className="text-stone-300 text-sm block mb-1">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="w-full bg-stone-800 border border-stone-600 rounded-lg px-4 py-2.5 text-stone-100 placeholder-stone-500 focus:outline-none focus:border-gold-500" onKeyDown={e => e.key === "Enter" && handleSubmit()} />
          </div>

          <button onClick={handleSubmit} disabled={loading} className="btn-gold w-full py-3 text-sm font-semibold disabled:opacity-50">
            {loading ? "Please wait..." : isSignUp ? "Create Account" : "Sign In"}
          </button>

          <button onClick={() => signInWithGoogle()} className="w-full py-3 text-sm border border-stone-600 rounded-lg text-stone-300 hover:bg-stone-800 transition-colors flex items-center justify-center gap-2">
            <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/><path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"/><path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07z"/><path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3z"/></svg>
            Continue with Google
          </button>
        </div>

        <p className="text-center text-stone-500 text-sm mt-6">
          {isSignUp ? "Already have an account?" : "Don't have an account?"}
          <button onClick={() => { setIsSignUp(!isSignUp); setError(""); setMessage(""); }} className="text-gold-400 hover:text-gold-300 ml-1 underline">
            {isSignUp ? "Sign In" : "Sign Up"}
          </button>
        </p>
      </div>
    </div>
  );
}
