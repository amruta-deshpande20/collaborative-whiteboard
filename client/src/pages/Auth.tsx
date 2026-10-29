import { useState } from "react";
import "./Auth.css";
import { API_URL } from "../config";

type AuthProps = {
  onLogin: (token: string, user: { name: string; email: string }) => void;
};

function Auth({ onLogin }: AuthProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/api/auth/${isRegister ? "register" : "login"}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            isRegister ? { name, email, password } : { email, password },
          ),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Something went wrong.");
      }

      onLogin(data.token, data.user);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to connect to the server.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <nav className="auth-nav">
        <a href="/" className="brand">
          <span className="brand-mark">w.</span>
          <span>whiteboard</span>
        </a>
        <span className="nav-caption">A SPACE FOR YOUR IDEAS</span>
      </nav>

      <section className="auth-card">
        <p className="auth-eyebrow">YOUR SPACE AWAITS</p>
        <h1>{isRegister ? "Create your account." : "Welcome back."}</h1>
        <p className="auth-description">
          {isRegister
            ? "Make space for your ideas and invite others to collaborate."
            : "Your ideas are right where you left them."}
        </p>

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <label>
              Name
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                required
                autoComplete="name"
              />
            </label>
          )}

          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              minLength={8}
              required
              autoComplete={isRegister ? "new-password" : "current-password"}
            />
          </label>

          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}

          <button className="start-button" type="submit" disabled={loading}>
            {loading
              ? "Please wait..."
              : isRegister
                ? "Create account"
                : "Log in"}
            <span aria-hidden="true">↗</span>
          </button>
        </form>

        <p className="auth-switch">
          {isRegister ? "Already have an account?" : "New to Gatherboard?"}{" "}
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError("");
            }}
          >
            {isRegister ? "Log in" : "Create an account"}
          </button>
        </p>
      </section>
    </main>
  );
}

export default Auth;
