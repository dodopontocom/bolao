'use client';

import { useState, useRef, useEffect } from 'react';
import { IUser } from '@/models/User';
import { ALL_AVATARS } from '@/data/avatars';
import { MapPin, User as UserIcon, Lock } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (user: IUser) => void;
  existingUsers: IUser[];
}

const CITIES = ['Pilar', 'Sorocaba', 'Piedade', 'Valinhos', 'Cocais'];

export default function LoginScreen({ onLogin, existingUsers }: LoginScreenProps) {
  const [name, setName] = useState('');
  const [pinDigits, setPinDigits] = useState(['', '', '']);
  const [selectedCity, setSelectedCity] = useState(CITIES[0]);
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [showExisting, setShowExisting] = useState(false);
  
  const nameInputRef = useRef<HTMLInputElement>(null);
  const pinRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  // Get first available avatar
  const getFirstAvailableAvatar = () => {
    const usedAvatars = new Set(existingUsers.map(u => u.avatar));
    return ALL_AVATARS.find(a => !usedAvatars.has(a)) || ALL_AVATARS[0];
  };
  
  const [avatar, setAvatar] = useState(getFirstAvailableAvatar());

  // Auto focus on name input on mount
  useEffect(() => {
    if (nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, []);

  const verifyFullPin = async (fullPin: string) => {
    if (!name.trim()) {
      setError('Preencha seu nome primeiro');
      setPinDigits(['', '', '']);
      nameInputRef.current?.focus();
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      // 1. Verify PIN
      const authRes = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: fullPin }),
      });
      const authData = await authRes.json();

      if (!authData.success) {
        setError('PIN inválido');
        setPinDigits(['', '', '']);
        pinRefs[0].current?.focus();
        setIsVerifying(false);
        return;
      }

      // 2. Create or Update user
      const userRes = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: name.trim(), 
          avatar, 
          city: selectedCity 
        }),
      });

      const user = await userRes.json();
      if (user.error) {
        setError(user.error);
        setPinDigits(['', '', '']);
        pinRefs[0].current?.focus();
        setIsVerifying(false);
      } else {
        onLogin(user);
      }
    } catch (err) {
      setError('Erro ao entrar na mesa');
      setPinDigits(['', '', '']);
      pinRefs[0].current?.focus();
      setIsVerifying(false);
    }
  };

  const handlePinChange = (index: number, value: string) => {
    const cleanValue = value.replace(/[^0-9]/g, '').slice(-1);
    if (!cleanValue && value !== '') return;

    const newDigits = [...pinDigits];
    newDigits[index] = cleanValue;
    setPinDigits(newDigits);

    if (cleanValue) {
      if (index < 2) {
        pinRefs[index + 1].current?.focus();
      } else {
        const fullPin = newDigits.join('');
        if (fullPin.length === 3) {
          verifyFullPin(fullPin);
        }
      }
    }
  };

  const handlePinKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pinDigits[index] && index > 0) {
      pinRefs[index - 1].current?.focus();
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fullPin = pinDigits.join('');
    if (fullPin.length === 3) {
      verifyFullPin(fullPin);
    }
  };

  const handleSelectExistingUserWithPin = async (user: IUser) => {
    const fullPin = pinDigits.join('');
    if (fullPin.length < 3) {
      setError('Digite o PIN primeiro');
      pinRefs[0].current?.focus();
      return;
    }
    
    setIsVerifying(true);
    setError('');

    try {
      // 1. Verify PIN
      const authRes = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: fullPin }),
      });
      const authData = await authRes.json();

      if (!authData.success) {
        setError('PIN inválido');
        setPinDigits(['', '', '']);
        pinRefs[0].current?.focus();
        setIsVerifying(false);
        return;
      }

      // 2. Login
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: user.name, avatar: user.avatar, city: user.city }),
      });

      const updatedUser = await res.json();
      onLogin(updatedUser);
    } catch (err) {
      setError('Erro ao entrar');
      setPinDigits(['', '', '']);
      pinRefs[0].current?.focus();
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050816] flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">⚽ Bolão 2026</h1>
          <p className="text-white/40 text-sm uppercase tracking-[0.2em] font-bold">Mesa da Família</p>
        </div>

        <div className="card p-6 space-y-8">
          {/* Section: Existing Users or Mode Toggle */}
          {existingUsers.length > 0 && (
            <div className="flex justify-center">
              <button 
                onClick={() => setShowExisting(!showExisting)}
                className="text-yellow-400/60 hover:text-yellow-400 text-xs font-bold uppercase tracking-widest transition-colors"
              >
                {showExisting ? 'Criar Novo Perfil' : `Já está na mesa? (${existingUsers.length} membros)`}
              </button>
            </div>
          )}

          {showExisting ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-3">
                {existingUsers.map((user) => (
                  <button
                    key={user._id}
                    onClick={() => handleSelectExistingUserWithPin(user)}
                    className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-yellow-500/30 hover:bg-white/10 transition-all group"
                  >
                    <span className="text-2xl group-hover:scale-110 transition-transform">{user.avatar}</span>
                    <div className="text-left">
                      <p className="text-white font-medium text-sm truncate">{user.name}</p>
                      <p className="text-[10px] text-white/40">{user.city}</p>
                    </div>
                  </button>
                ))}
              </div>
              <div className="space-y-4 pt-4 border-t border-white/5">
                <label className="block text-white/60 text-[10px] font-bold uppercase tracking-wider text-center">Digite o PIN para entrar</label>
                <div className="flex justify-center gap-3">
                  {pinDigits.map((digit, index) => (
                    <input
                      key={index}
                      ref={pinRefs[index]}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handlePinChange(index, e.target.value)}
                      onKeyDown={(e) => handlePinKeyDown(index, e)}
                      disabled={isVerifying}
                      className={`w-12 h-14 bg-white/5 border-2 rounded-xl text-white text-center text-2xl font-bold focus:outline-none transition-all
                        ${error ? 'border-red-500/50 bg-red-500/5' : 'border-white/10 focus:border-yellow-400 focus:bg-white/10'}
                      `}
                      placeholder="•"
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleLoginSubmit} className="space-y-6">
              {/* Name */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-white/60 text-[10px] font-bold uppercase tracking-wider">
                  <UserIcon className="w-3 h-3" /> Seu Nome
                </label>
                <input
                  ref={nameInputRef}
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-lg focus:outline-none focus:border-yellow-400"
                  placeholder="Ex: Tio João"
                />
              </div>

              {/* City Selection */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-white/60 text-[10px] font-bold uppercase tracking-wider">
                  <MapPin className="w-3 h-3" /> Sua Cidade
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {CITIES.map((city) => (
                    <button
                      key={city}
                      type="button"
                      onClick={() => setSelectedCity(city)}
                      className={`py-2 px-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border
                        ${selectedCity === city 
                          ? 'bg-yellow-500 text-black border-yellow-500 shadow-lg shadow-yellow-500/20' 
                          : 'bg-white/5 text-white/40 border-white/10 hover:border-white/20'}`}
                    >
                      {city}
                    </button>
                  ))}
                </div>
              </div>

              {/* Avatar Grid */}
              <div className="space-y-3">
                <label className="block text-white/60 text-[10px] font-bold uppercase tracking-wider">Escolha seu Avatar</label>
                <div className="flex flex-wrap gap-2 justify-center">
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
                          isSelected ? 'bg-yellow-500/30 ring-2 ring-yellow-400 scale-110 z-10' : 
                          isOccupied ? 'bg-white/5 opacity-20 cursor-not-allowed' : 
                          'bg-white/5 hover:bg-white/10'
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* PIN Modern */}
              <div className="space-y-3 pt-4 border-t border-white/5">
                <label className="flex items-center gap-2 text-white/60 text-[10px] font-bold uppercase tracking-wider">
                  <Lock className="w-3 h-3" /> PIN de Acesso
                </label>
                <div className="flex justify-center gap-4">
                  {pinDigits.map((digit, index) => (
                    <input
                      key={index}
                      ref={pinRefs[index]}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handlePinChange(index, e.target.value)}
                      onKeyDown={(e) => handlePinKeyDown(index, e)}
                      disabled={isVerifying}
                      className={`w-14 h-16 bg-white/5 border-2 rounded-2xl text-white text-center text-3xl font-bold focus:outline-none transition-all
                        ${error ? 'border-red-500/50 bg-red-500/5' : 'border-white/10 focus:border-yellow-400 focus:bg-white/10'}
                        ${isVerifying ? 'opacity-50' : 'opacity-100'}
                      `}
                      placeholder="•"
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={!name.trim() || pinDigits.join('').length < 3 || isVerifying}
                className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed text-black font-extrabold py-4 rounded-xl transition-all shadow-xl shadow-yellow-500/10 uppercase tracking-widest text-sm active:scale-95"
              >
                {isVerifying ? 'Entrando...' : 'Entrar na Mesa'}
              </button>
            </form>
          )}

          {error && (
            <p className="text-red-400 text-sm text-center font-medium animate-shake">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
}
