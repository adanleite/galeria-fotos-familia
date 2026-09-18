import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Camera, Lock, User, Eye, EyeOff, ShieldCheck, Heart, AlertCircle, HelpCircle, X } from 'lucide-react';

const LoginScreen = ({ setToast }) => {
  const { login } = useAuth();
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!usernameOrEmail || !password) {
      setErrorMsg('Por favor, preencha o usuário/e-mail e a senha.');
      return;
    }

    setErrorMsg('');
    setLoading(true);

    try {
      await login(usernameOrEmail, password, rememberMe);
      setToast({ type: 'success', message: 'Bem-vindo de volta! Login realizado com sucesso.' });
    } catch (err) {
      setErrorMsg(err.message || 'Usuário ou senha incorretos.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (userType) => {
    if (userType === 'admin') {
      setUsernameOrEmail('admin@galeria.com');
      setPassword('admin123');
    } else {
      setUsernameOrEmail('familia@galeria.com');
      setPassword('user123');
    }
    setErrorMsg('');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient background decoration */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-600/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-md w-full relative z-10">
        {/* Gallery Header Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 text-white shadow-xl shadow-amber-600/20 mb-4">
            <Camera className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Acervo Digital da Família
          </h1>
          <p className="text-sm text-slate-400 mt-1 flex items-center justify-center gap-1.5">
            <Heart className="w-4 h-4 text-amber-500 fill-amber-500 inline" />
            Guarde e organize suas memórias com segurança
          </p>
        </div>

        {/* Card */}
        <div className="bg-slate-800/80 backdrop-blur-md rounded-3xl border border-slate-700/60 p-6 sm:p-8 shadow-2xl">
          {errorMsg && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-start gap-3 animate-fade-in">
              <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Usuário ou e-mail */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Usuário ou e-mail
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  placeholder="Ex: admin@galeria.com"
                  className="w-full pl-11 pr-4 py-3 bg-slate-900/70 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm transition-all"
                  required
                />
              </div>
            </div>

            {/* Senha */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Senha
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Sua senha secreta"
                  className="w-full pl-11 pr-11 py-3 bg-slate-900/70 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Lembrar de mim & Esqueci minha senha */}
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <label className="flex items-center gap-2 text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-amber-500 focus:ring-offset-slate-800"
                />
                Lembrar de mim
              </label>

              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-amber-400 hover:text-amber-300 font-medium transition-colors"
              >
                Esqueci minha senha
              </button>
            </div>

            {/* Botão Entrar */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold rounded-xl shadow-lg shadow-amber-600/20 hover:shadow-amber-600/30 transition-all transform active:scale-95 disabled:opacity-50 disabled:pointer-events-none text-sm flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5" />
                  Entrar na Galeria
                </>
              )}
            </button>
          </form>

          {/* Atalho de Contas de Demonstração */}
          <div className="mt-8 pt-6 border-t border-slate-700/60 text-center">
            <p className="text-xs text-slate-400 mb-3 font-medium">Contas de demonstração rápida:</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillDemo('admin')}
                className="px-3 py-2 bg-slate-900/50 hover:bg-slate-900 border border-slate-700 rounded-lg text-xs font-medium text-amber-400 transition-colors"
              >
                🔑 Administrador
              </button>
              <button
                type="button"
                onClick={() => fillDemo('user')}
                className="px-3 py-2 bg-slate-900/50 hover:bg-slate-900 border border-slate-700 rounded-lg text-xs font-medium text-slate-300 transition-colors"
              >
                👤 Usuário Família
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-500 mt-6">
          © {new Date().getFullYear()} Acervo Digital de Fotos de Família • Privado e Seguro
        </p>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-sm w-full p-6 text-white shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-amber-400" />
                Recuperação de Senha
              </h3>
              <button onClick={() => setShowForgotModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed mb-4">
              Por razões de segurança da galeria familiar privada, a redefinição de senha deve ser solicitada diretamente ao <strong>Administrador do Acervo</strong>.
            </p>
            <div className="p-3 bg-slate-900/80 rounded-xl text-xs text-slate-400 mb-6 border border-slate-700">
              Caso você utilize a conta de demonstração, use as credenciais:<br />
              • Admin: <span className="text-amber-400">admin@galeria.com</span> / <span className="text-amber-400">admin123</span><br />
              • Usuário: <span className="text-amber-400">familia@galeria.com</span> / <span className="text-amber-400">user123</span>
            </div>
            <button
              onClick={() => setShowForgotModal(false)}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 font-semibold rounded-xl text-slate-900 text-sm transition-colors"
            >
              Entendi
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginScreen;
