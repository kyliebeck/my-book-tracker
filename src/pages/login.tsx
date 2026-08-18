import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import useDocumentTitle from "../hooks/useDocumentTitle";

type Mode = "signin" | "signup";

export default function Login() {
    const [mode, setMode] = useState<Mode>("signin");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const [isError, setIsError] = useState(false);
    const [busy, setBusy] = useState(false);
    const navigate = useNavigate();

    useDocumentTitle(mode === "signin" ? "Sign in" : "Create an account");

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!email.trim() || !password) return;
        setBusy(true);
        setMessage("");
        // Navigating unmounts this component, so skip the trailing setBusy.
        let leaving = false;
        try {
            const { data, error } =
                mode === "signup"
                    ? await supabase.auth.signUp({ email, password })
                    : await supabase.auth.signInWithPassword({ email, password });

            if (error) {
                setIsError(true);
                setMessage(error.message);
                return;
            }

            // Signing up only returns a session when email confirmation is
            // disabled; with it on, there's nothing to redirect into yet.
            if (data.session) {
                leaving = true;
                // replace, so Back doesn't return to the sign-in form.
                navigate("/", { replace: true });
                return;
            }

            setIsError(false);
            setMessage("Account made. Check your email, then sign in.");
            setMode("signin");
        } catch (err) {
            console.error(err);
            setIsError(true);
            setMessage("That didn't work. Try again.");
        } finally {
            if (!leaving) setBusy(false);
        }
    }

    const isSignUp = mode === "signup";

    return (
        <div className="auth-wrap">
            <div className="auth-card">
                <p className="eyebrow">{isSignUp ? "Join" : "Welcome back"}</p>
                <h1>{isSignUp ? "Create an account" : "Sign in"}</h1>
                <p className="auth-lede">
                    {isSignUp
                        ? "For the books you're reading, and the ones you keep meaning to start."
                        : "Your shelves are where you left them."}
                </p>

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="auth-field">
                        <label htmlFor="auth-email">Email</label>
                        <input
                            id="auth-email"
                            type="email"
                            autoComplete="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                        />
                    </div>

                    <div className="auth-field">
                        <label htmlFor="auth-password">Password</label>
                        <input
                            id="auth-password"
                            type="password"
                            autoComplete={isSignUp ? "new-password" : "current-password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                        />
                    </div>

                    <button className="btn-primary auth-submit" type="submit" disabled={busy}>
                        {busy ? "Working…" : isSignUp ? "Create account" : "Sign in"}
                    </button>
                </form>

                {message && (
                    <p className={`auth-message${isError ? " error" : ""}`} role="status">
                        {message}
                    </p>
                )}

                <p className="auth-switch">
                    {isSignUp ? "Already have an account?" : "New here?"}
                    <button
                        type="button"
                        onClick={() => {
                            setMode(isSignUp ? "signin" : "signup");
                            setMessage("");
                        }}
                    >
                        {isSignUp ? "Sign in" : "Create an account"}
                    </button>
                </p>
            </div>
        </div>
    );
}
