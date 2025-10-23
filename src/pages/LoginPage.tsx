import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { loginWithEmailPassword } from '../lib/noco';
import { Wifi, Lock } from 'lucide-react'; // ⬅️ ícones minimalistas

function getStoredUser() {
  const raw = localStorage.getItem('user');
  return raw ? JSON.parse(raw) : null;
}

export default function LoginPage() {
  const nav = useNavigate();
  const already = getStoredUser();
  if (already) {
    return <Navigate to={already.is_admin ? '/admin' : '/'} replace />;
  }

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const user = await loginWithEmailPassword(email.trim(), password);
      localStorage.setItem('user', JSON.stringify(user));
      nav(user.is_admin ? '/admin' : '/', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Falha ao autenticar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex items-center justify-center min-h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white">
      {/* brilho de fundo */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_#2563eb33,_transparent_60%)] animate-pulse blur-3xl" />

      <form
        onSubmit={handleSubmit}
        className="relative z-10 w-[340px] bg-slate-900/80 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-slate-700/40"
      >
        {/* Logo animada */}
        <div className="flex justify-center items-center mb-6 relative">
          <div className="relative w-16 h-16 flex items-center justify-center">
            <Wifi className="absolute text-blue-500 size-12 animate-pulse" />
            <Lock className="absolute text-sky-400 size-5 animate-bounce top-8 right-1 drop-shadow-[0_0_4px_rgba(56,189,248,0.8)]" />
            <div className="absolute inset-0 rounded-full bg-blue-500/10 blur-xl animate-ping" />
          </div>
        </div>

        <h1 className="text-2xl font-semibold text-center mb-6 tracking-tight">Acesso ao Painel</h1>

        <label className="block mb-4">
          <span className="text-sm text-slate-300">Email</span>
          <input
            type="email"
            autoComplete="username"
            required
            className="mt-1 w-full p-2.5 rounded-lg bg-slate-800/70 border border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40 outline-none text-white placeholder-slate-500 transition"
            placeholder="exemplo@dominio.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>

        <label className="block mb-6">
          <span className="text-sm text-slate-300">Senha</span>
          <input
            type="password"
            autoComplete="current-password"
            required
            className="mt-1 w-full p-2.5 rounded-lg bg-slate-800/70 border border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40 outline-none text-white placeholder-slate-500 transition"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        {error && <p className="text-red-400 text-sm text-center mb-3">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 active:scale-[0.98] transition-transform shadow-lg shadow-blue-600/20 disabled:opacity-50"
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}
