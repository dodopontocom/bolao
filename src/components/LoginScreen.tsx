import { useState } from 'react';
import { Trophy, Users, ChevronRight } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (name: string) => void;
  existingUsers: string[];
}

export default function LoginScreen({ onLogin, existingUsers }: LoginScreenProps) {
  const [name, setName] = useState('');
  const [showExisting, setShowExisting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length >= 2) {
      onLogin(trimmed);
    }
  };

  const selectUser = (userName: string) => {
    onLogin(userName);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-pitch-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-gold-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-navy-800/30 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-sm animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 mb-4 animate-bounce-in shadow-lg shadow-gold-500/30">
            <Trophy className="w-10 h-10 text-navy-950" />
          </div>
          <h1 className="font-display text-4xl font-bold text-white tracking-tight">
            BOLAO
          </h1>
          <h2 className="font-display text-2xl font-bold bg-gradient-to-r from-gold-300 to-gold-500 bg-clip-text text-transparent tracking-tight">
            COPA 2026
          </h2>
          <p className="text-white/50 text-sm mt-2">
            Palpites da familia para a Copa do Mundo
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="card p-5">
            <label className="block text-white/70 text-sm font-medium mb-2">
              Qual e o seu nome?
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Digite seu nome..."
              className="w-full px-4 py-3.5 bg-white/10 border border-white/20 rounded-xl
                text-white text-lg placeholder:text-white/30
                focus:border-gold-400 focus:outline-none focus:bg-white/15
                transition-all duration-200"
              autoFocus
              minLength={2}
              maxLength={30}
            />
          </div>

          <button
            type="submit"
            disabled={name.trim().length < 2}
            className="btn-primary flex items-center justify-center gap-2"
          >
            Entrar no Bolao
            <ChevronRight className="w-5 h-5" />
          </button>
        </form>

        {existingUsers.length > 0 && (
          <div className="mt-6">
            <button
              onClick={() => setShowExisting(!showExisting)}
              className="w-full flex items-center justify-center gap-2 text-white/40 text-sm hover:text-white/60 transition-colors py-2"
            >
              <Users className="w-4 h-4" />
              {showExisting ? 'Esconder familiares' : 'Entrar como familiar existente'}
            </button>

            {showExisting && (
              <div className="mt-3 space-y-2 animate-slide-down">
                {existingUsers.map((user) => (
                  <button
                    key={user}
                    onClick={() => selectUser(user)}
                    className="w-full card p-3 text-left hover:bg-white/10 transition-colors flex items-center gap-3"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pitch-500 to-pitch-700 flex items-center justify-center font-display font-bold text-sm">
                      {user.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium">{user}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
