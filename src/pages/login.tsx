import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");

    async function signUp() {
        const { error } = await supabase.auth.signUp({ email, password });
        setMessage(error ? error.message : "Signed up! You can now sign in.");
    }

    async function signIn() {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        setMessage(error ? error.message : "Signed in!");
    }

    async function signOut() {
        await supabase.auth.signOut();
        setMessage("Signed out.");
    }

    return (
        <div>
            <h1>Login</h1>
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
            <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
            />
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                <button onClick={signUp}>Sign Up</button>
                <button onClick={signIn}>Sign In</button>
                <button onClick={signOut}>Sign Out</button>
            </div>
            {message && <p>{message}</p>}
        </div>
    );
}