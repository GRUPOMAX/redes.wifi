import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { loginWithEmailPassword } from "../lib/noco";

function getStoredUser() {
  const raw = localStorage.getItem("user");
  return raw ? JSON.parse(raw) : null;
}

export default function LoginPage() {
  const nav = useNavigate();
  const already = getStoredUser();
  if (already) {
    // já logado → manda para o destino correto
    return <Navigate to={already.is_admin ? "/admin" : "/"} replace />;
  }

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const user = await loginWithEmailPassword(email.trim(), password);
      localStorage.setItem("user", JSON.stringify(user));
      nav(user.is_admin ? "/admin" : "/", { replace: true });
    } catch (err: any) {
      setError(err.message || "Falha ao autenticar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center h-screen bg-slate-950 text-white">
      <form onSubmit={handleSubmit} className="bg-slate-900 p-6 rounded-xl shadow-lg w-[320px] space-y-4">
        <h1 className="text-xl font-semibold text-center">Login</h1>

        <label className="text-sm block">
          Email
          <input
            type="email"
            autoComplete="username"
            className="mt-1 w-full p-2 rounded bg-slate-800 border border-slate-700 focus:outline-none"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>

        <label className="text-sm block">
          Senha
          <input
            type="password"
            autoComplete="current-password"
            className="mt-1 w-full p-2 rounded bg-slate-800 border border-slate-700 focus:outline-none"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 rounded bg-blue-600 hover:bg-blue-700 transition disabled:opacity-50"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
