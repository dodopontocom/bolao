'use client';

import { useState } from 'react';
import { X, ChevronRight, ChevronLeft, Trophy, DollarSign, Utensils, BarChart3, List } from 'lucide-react';

interface Step {
  title: string;
  description: string;
  icon: React.ReactNode;
}

interface TutorialProps {
  isOpen: boolean;
  onClose: () => void;
}

const STEPS: Step[] = [
  {
    title: "Bem-vindo à Mesa!",
    description: "Aqui a família se reúne para apostar, zoar e ganhar dinheiro. Vamos te mostrar como funciona!",
    icon: <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center text-3xl">⚽</div>
  },
  {
    title: "Fominha Levels",
    description: "Fique de olho na mesa! Comidas aparecem aleatoriamente. Clique nelas para coletar e subir seu Fominha Level.",
    icon: <Utensils className="w-12 h-12 text-yellow-400" />
  },
  {
    title: "Resgate de Grana",
    description: "A cada jogo, se você tiver 10+ Fominha Levels, um botão aparecerá no topo para trocar por N$1.000!",
    icon: <Trophy className="w-12 h-12 text-green-400" />
  },
  {
    title: "Bolão Grátis",
    description: "Na aba 'Jogos', dê seu palpite de placar exato. É grátis e você ganha N$300 ou N$1.000 se acertar!",
    icon: <List className="w-12 h-12 text-blue-400" />
  },
  {
    title: "Apostas de Risco",
    description: "Quer ganhar mais? Use seu saldo (N$) para apostar no vencedor ou empate. O lucro é baseado nas Odds!",
    icon: <DollarSign className="w-12 h-12 text-yellow-500" />
  },
  {
    title: "Ranking da Família",
    description: "Acompanhe na aba 'Ranking' quem é o Mais Rico e quem é o Mais Fominha da rodada.",
    icon: <BarChart3 className="w-12 h-12 text-purple-400" />
  }
];

export default function Tutorial({ isOpen, onClose }: TutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const step = STEPS[currentStep];
  const isLast = currentStep === STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      onClose();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    setCurrentStep(prev => Math.max(0, prev - 1));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#050816]/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm card p-8 relative overflow-hidden flex flex-col items-center text-center space-y-6 animate-scale-in">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5 text-white/40" />
        </button>

        <div className="p-4 bg-white/5 rounded-2xl mb-2">
          {step.icon}
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white tracking-tight">{step.title}</h2>
          <p className="text-white/60 text-sm leading-relaxed">
            {step.description}
          </p>
        </div>

        {/* Progress Dots */}
        <div className="flex gap-1.5">
          {STEPS.map((_, i) => (
            <div 
              key={i} 
              className={`h-1 rounded-full transition-all duration-300 ${i === currentStep ? 'w-6 bg-yellow-500' : 'w-2 bg-white/10'}`}
            />
          ))}
        </div>

        <div className="flex w-full gap-3 pt-4">
          <button
            onClick={onClose}
            className="flex-1 py-3 text-white/40 text-sm font-bold hover:text-white/60 transition-colors"
          >
            Pular
          </button>
          
          <div className="flex-[2] flex gap-2">
            {currentStep > 0 && (
              <button
                onClick={handlePrev}
                className="p-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={handleNext}
              className="flex-1 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black font-bold py-3 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              {isLast ? 'Começar!' : 'Próximo'}
              {!isLast && <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
