'use client';

import { useState } from 'react';
import { IUser } from '@/models/User';
import { ALL_AVATARS } from '@/data/avatars';

interface LoginScreenProps {
  onLogin: (user: IUser) => void;
  existingUsers: IUser[];
}

export default function LoginScreen({ onLogin, existingUsers }: LoginScreenProps) {
  const [step, setStep] = useState<'pin' | 'name' | 'existing'>('pin');
  const [pin, setPin] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  
  // Get first available avatar
  const getFirstAvailableAvatar = () => {
    const usedAvatars = new Set(existingUsers.map(u => u.avatar));
    return ALL_AVATARS.find(a => !usedAvatars.has(a)) || ALL_AVATARS[0];
  };
  
  const [avatar, setAvatar] = useState(getFirstAvailableAvatar());
  const [city, setCity] = useState<string | undefined>();

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });

      const data = await res.json();

      if (data.success) {
        if (pin === '199') setCity('Pilar');
        if (pin === '455') setCity('Sorocaba');
        
        if (existingUsers.length > 0) {
          setStep('existing');
        } else {
          setStep('name');
        }
      } else {
        setError(data.error || 'PIN inválido');
      }
    } catch (err) {
      setError('Erro ao verificar PIN');
    }
  };

  const handleUserCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), avatar, city }),
      });

      const user = await res.json();
      onLogin(user);
    } catch (err) {
      setError('Erro ao criar usuário');
    }
  };

  const handleSelectExistingUser = async (user: IUser) => {
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: user.name, avatar: user.avatar, city }),
      });

      const updatedUser = await res.json();
      onLogin(updatedUser);
    } catch (err) {
      setError('Erro ao entrar');
    }
  };

  return (
    <div className="min-h-screen bg-[#050816] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">⚽ Bolão 2026</h1>
          <p className="text-white/60">
            {city ? `Bem-vinda família de ${city}!` : 'Venha participar da mesa da família!'}
          </p>
        </div>

        <div className="card p-6">
          {step === 'pin' && (
            <form onSubmit={handlePinSubmit} className="space-y-4">
              <div>
                <label className="block text-white/80 mb-2 text-sm">Digite o PIN de acesso</label>
                <input
                  type="text"
                  maxLength={3}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-center text-2xl tracking-widest focus:outline-none focus:border-yellow-400"
                  placeholder="•••"
                />
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button
                type="submit"
                className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 rounded-xl transition-colors"
              >
                Entrar
              </button>
            </form>
          )}

          {step === 'existing' && (
            <div className="space-y-4">
              <p className="text-white/80 text-center">Escolha seu nome ou crie um novo</p>
              <div className="space-y-2">
                {existingUsers.map((user) => (
                  <button
                    key={user._id}
                    onClick={() => handleSelectExistingUser(user)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <span className="text-3xl">{user.avatar}</span>
                    <span className="text-white font-medium">{user.name}</span>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setStep('name')}
                className="w-full border border-white/20 text-white py-3 rounded-xl hover:bg-white/5 transition-colors"
              >
                Criar novo perfil
              </button>
            </div>
          )}

          {step === 'name' && (
            <form onSubmit={handleUserCreate} className="space-y-4">
              <div>
                <label className="block text-white/80 mb-2 text-sm">Seu nome</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-400"
                  placeholder="Digite seu nome"
                />
              </div>
              <div>
                <label className="block text-white/80 mb-2 text-sm">Escolha seu avatar</label>
                <div className="flex flex-wrap gap-2">
                  {ALL_AVATARS.map((opt, index) => {
                    const isOccupied = existingUsers.some(u => u.avatar === opt);
                    const isSelected = avatar === opt;
                    return (
                      <button
                        key={`${opt}-${index}`}
                        type="button"
                        onClick={() => !isOccupied && setAvatar(opt)}
                        disabled={isOccupied}
                        className={`text-3xl p-2 rounded-xl transition-all relative ${
                          isSelected ? 'bg-yellow-500/30 ring-2 ring-yellow-400' : 
                          isOccupied ? 'bg-white/5 opacity-30 cursor-not-allowed' : 
                          'bg-white/5 hover:bg-white/10'
                        }`}
                      >
                        {opt}
                        {isOccupied && (
                          <span className="absolute inset-0 flex items-center justify-center text-xs text-white/60 font-bold">
                            Ocupado
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button
                type="submit"
                disabled={!name.trim()}
                className="w-full bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold py-3 rounded-xl transition-colors"
              >
                Entrar na mesa
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
