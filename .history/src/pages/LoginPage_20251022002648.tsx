import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUserByEmail } from "../lib/noco";

export default function LoginPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const user = await getUserByEmail(email.trim());
      if (!user) throw new Error("Usuário não encontrado");
      if (user.password !== password) throw new Error("Senha incorreta");
      if (!user.ativo) throw new Error("Usuário inativo");

      localStorage.setItem("user", JSON.stringify(user));

      // Redireciona conforme tipo
      if (user.is_admin) {
        nav("/admin");
      } else {
        nav("/");
      }
    } catch (err: any) {
      setError(err.message || "Erro ao autenticar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center h-screen bg-slate-950 text-white">
      <form
        onSubmit={handleLogin}
        className="bg-slate-900 p-6 rounded-xl shadow-lg w-[320px] space-y-4"
      >
        <h1 className="text-xl font-semibold text-center">Login</h1>
        <div>
          <label className="text-sm block mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 rounded bg-slate-800 border border-slate-700 focus:outline-none"
          />
        </div>
        <div>
          <label className="text-sm block mb-1">Senha</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 rounded bg-slate-800 border border-slate-700 focus:outline-none"
          />
        </div>
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
