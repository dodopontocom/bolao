'use client';

import { useState, useEffect, useRef } from 'react';
import { IUser } from '@/models/User';
import { ALL_AVATARS } from '@/data/avatars';
import { ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';

const PREDEFINED_CITIES = ['Pilar', 'Sorocaba', 'Piedade', 'Valinhos', 'Cocais'];
const GRITOS = [
  'Bora Hexa!',
  'Agora Vem!',
  'Tô confiante!',
  'Não sei não!',
  'iiih já era!',
  'Neymar!'
];

interface LoginScreenProps {
  onLogin: (user: IUser) => void;
  existingUsers: IUser[];
}

export default function LoginScreen({ onLogin, existingUsers }: LoginScreenProps) {
  const [step, setStep] = useState(1); // 1: PIN, 2: Name, 3: City, 4: Jargon, 5: Avatar
  const [pinDigits, setPinDigits] = useState(['', '', '']);
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [jargon, setJargon] = useState('');
  const [avatar, setAvatar] = useState('');
  const [error, setError] = useState('');
  
  const pinInputs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null)
  ];
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Get first available avatar
  const getFirstAvailableAvatar = () => {
    const usedAvatars = new Set(existingUsers.map(u => u.avatar));
    return ALL_AVATARS.find(a => !usedAvatars.has(a)) || ALL_AVATARS[0];
  };

  // Initialize avatar when component mounts or existingUsers changes
  useEffect(() => {
    setAvatar(getFirstAvailableAvatar());
  }, [existingUsers]);

  // Auto-focus when step changes
  useEffect(() => {
    if (step === 1) {
      pinInputs[0].current?.focus();
    } else if (step === 2) {
      nameInputRef.current?.focus();
    }
  }, [step]);

  const handlePinDigitChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value.slice(-1);
    }
    
    const newDigits = [...pinDigits];
    newDigits[index] = value;
    setPinDigits(newDigits);

    if (value && index < 2) {
      pinInputs[index + 1].current?.focus();
    }
    
    // Auto-submit when all digits are filled
    if (value && index === 2) {
      setTimeout(() => submitPin(newDigits.join('')), 200);
    }
  };

  const submitPin = async (pin: string) => {
    setError('');

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });

      const data = await res.json();

      if (data.success) {
        setStep(2);
      } else {
        setError(data.error || 'PIN inválido');
        setPinDigits(['', '', '']);
        pinInputs[0].current?.focus();
      }
    } catch (err) {
      setError('Erro ao verificar PIN');
    }
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pin = pinDigits.join('');
    if (pin.length === 3) {
      submitPin(pin);
    }
  };

  const handleNextStep = () => {
    if (step === 2 && !name.trim()) return;
    if (step === 3 && !city) return;
    if (step === 4 && !jargon) return;
    setStep(step + 1);
  };

  const handlePrevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleComplete = async () => {
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, avatar, city, jargon }),
      });

      const user = await res.json();
      onLogin(user);
    } catch (err) {
      setError('Erro ao criar perfil');
    }
  };

  const handleSelectExistingUser = async (user: IUser) => {
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: user.name, avatar: user.avatar }),
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
          <h1 className="text-4xl font-bold text-white mb-2">⚽ Bolão 2026</h1>
          <p className="text-white/60">Venha participar da mesa da família!</p>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3, 4, 5].map((num) => (
            <div key={num} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                step > num ? 'bg-green-500 text-white' :
                step === num ? 'bg-yellow-500 text-black' : 'bg-white/10 text-white/40'
              }`}>
                {step > num ? <CheckCircle2 className="w-5 h-5" /> : num}
              </div>
              {num < 5 && (
                <div className={`w-12 h-1 ${step > num ? 'bg-green-500' : 'bg-white/10'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="card p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Step 1: PIN */}
          {step === 1 && (
            <form onSubmit={handlePinSubmit} className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white mb-2">Digite o PIN</h2>
                <p className="text-white/60">Entre com o PIN de acesso</p>
              </div>
              <div className="flex justify-center gap-4">
                {pinDigits.map((digit, index) => (
                  <input
                    key={index}
                    ref={pinInputs[index]}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handlePinDigitChange(index, e.target.value)}
                    className="w-20 h-24 bg-white/5 border border-white/10 rounded-2xl text-white text-5xl text-center font-bold focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/30"
                    placeholder="•"
                    autoFocus={index === 0}
                  />
                ))}
              </div>
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2"
              >
                Continuar
                <ArrowRight className="w-5 h-5" />
              </button>

              {existingUsers.length > 0 && (
                <div className="pt-4 border-t border-white/10">
                  <p className="text-white/60 text-sm mb-3 text-center">Ou entre com um perfil existente:</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {existingUsers.map((user) => (
                      <button
                        key={user._id}
                        onClick={() => handleSelectExistingUser(user)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                      >
                        <span className="text-2xl">{user.avatar}</span>
                        <span className="text-white font-medium">{user.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </form>
          )}

          {/* Step 2: Name */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white mb-2">Qual seu nome?</h2>
                <p className="text-white/60">Como quer ser chamado na mesa?</p>
              </div>
              <div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white text-xl focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/30"
                  placeholder="Digite seu nome"
                  ref={nameInputRef}
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handlePrevStep}
                  className="flex-1 py-4 rounded-2xl bg-white/5 text-white font-bold hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Voltar
                </button>
                <button
                  onClick={handleNextStep}
                  disabled={!name.trim()}
                  className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold transition-all flex items-center justify-center gap-2"
                >
                  Continuar
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: City */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white mb-2">Onde você mora?</h2>
                <p className="text-white/60">Escolha sua cidade</p>
              </div>
              <div className="flex flex-col gap-3">
                {PREDEFINED_CITIES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCity(c)}
                    className={`w-full py-4 rounded-2xl text-white font-bold transition-all flex items-center justify-center gap-2 ${
                      city === c ? 'bg-yellow-500/30 border-2 border-yellow-500 text-yellow-400' : 
                      'bg-white/5 border border-white/10 hover:bg-white/10'
                    }`}
                  >
                    {c}
                    {city === c && <CheckCircle2 className="w-5 h-5" />}
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handlePrevStep}
                  className="flex-1 py-4 rounded-2xl bg-white/5 text-white font-bold hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Voltar
                </button>
                <button
                  onClick={handleNextStep}
                  disabled={!city}
                  className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold transition-all flex items-center justify-center gap-2"
                >
                  Continuar
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Jargon */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white mb-2">Seu grito!</h2>
                <p className="text-white/60">Escolha sua frase preferida</p>
              </div>
              <div className="flex flex-col gap-3">
                {GRITOS.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setJargon(g)}
                    className={`w-full py-4 px-4 rounded-2xl text-white font-bold transition-all flex items-center justify-center gap-2 ${
                      jargon === g ? 'bg-yellow-500/30 border-2 border-yellow-500 text-yellow-400' : 
                      'bg-white/5 border border-white/10 hover:bg-white/10'
                    }`}
                  >
                    {g}
                    {jargon === g && <CheckCircle2 className="w-5 h-5" />}
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handlePrevStep}
                  className="flex-1 py-4 rounded-2xl bg-white/5 text-white font-bold hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Voltar
                </button>
                <button
                  onClick={handleNextStep}
                  disabled={!jargon}
                  className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold transition-all flex items-center justify-center gap-2"
                >
                  Continuar
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Step 5: Avatar */}
          {step === 5 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white mb-2">Escolha seu avatar</h2>
                <p className="text-white/60">Escolha um emoji para representar você!</p>
              </div>
              <div className="flex flex-wrap gap-3 justify-center">
                {ALL_AVATARS.map((opt, index) => {
                  const isOccupied = existingUsers.some(u => u.avatar === opt);
                  const isSelected = avatar === opt;
                  return (
                    <button
                      key={`${opt}-${index}`}
                      type="button"
                      onClick={() => !isOccupied && setAvatar(opt)}
                      disabled={isOccupied}
                      className={`w-16 h-16 text-3xl rounded-2xl flex items-center justify-center transition-all relative ${
                        isSelected ? 'bg-yellow-500/30 ring-4 ring-yellow-400 scale-110' : 
                        isOccupied ? 'bg-white/5 opacity-30 cursor-not-allowed' : 
                        'bg-white/5 hover:bg-white/10 hover:scale-105'
                      }`}
                    >
                      {opt}
                      {isOccupied && (
                        <span className="absolute inset-0 flex items-center justify-center text-[10px] text-white/60 font-bold">
                          Ocupado
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handlePrevStep}
                  className="flex-1 py-4 rounded-2xl bg-white/5 text-white font-bold hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Voltar
                </button>
                <button
                  onClick={handleComplete}
                  disabled={!avatar}
                  className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold transition-all flex items-center justify-center gap-2"
                >
                  Entrar na mesa
                  <CheckCircle2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
