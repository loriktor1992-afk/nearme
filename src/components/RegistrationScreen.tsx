import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { tg, getTelegramUser, hapticFeedback, mainButton } from '../telegram';

export default function RegistrationScreen() {
  const register = useStore(s => s.register);
  const [step, setStep] = useState(0); // 0 = приветствие, 1-4 = шаги
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [bio, setBio] = useState('');
  const [error, setError] = useState('');
  
  // Данные из Telegram
  const telegramUser = getTelegramUser();
  const isFromTelegram = !!telegramUser;

  useEffect(() => {
    // Если пользователь из Telegram, подставляем его имя
    if (telegramUser) {
      setName(telegramUser.firstName + (telegramUser.lastName ? ' ' + telegramUser.lastName : ''));
    }
  }, [telegramUser]);

  // Управление Main Button
  useEffect(() => {
    if (step === 0) {
      mainButton.show('Начать знакомства 🚀', () => {
        hapticFeedback.medium();
        setStep(1);
      });
    } else if (step === 4) {
      mainButton.show('Создать профиль ✨', () => {
        handleComplete();
      });
    } else {
      mainButton.hide();
    }

    return () => mainButton.hide();
  }, [step]);

  const handleNext = () => {
    setError('');
    hapticFeedback.light();

    if (step === 1) {
      if (!name.trim()) {
        setError('Введите имя');
        hapticFeedback.error();
        return;
      }
      setStep(2);
    } else if (step === 2) {
      const ageNum = parseInt(age);
      if (!age || isNaN(ageNum)) {
        setError('Введите возраст');
        hapticFeedback.error();
        return;
      }
      if (ageNum < 14) {
        setError('Минимальный возраст — 14 лет');
        hapticFeedback.warning();
        return;
      }
      if (ageNum > 99) {
        setError('Введите корректный возраст');
        hapticFeedback.error();
        return;
      }
      setStep(3);
    } else if (step === 3) {
      setStep(4);
    }
  };

  const handleComplete = () => {
    if (!name.trim()) {
      setError('Введите имя');
      return;
    }
    const ageNum = parseInt(age);
    if (!age || isNaN(ageNum) || ageNum < 14) {
      setError('Введите корректный возраст (от 14)');
      return;
    }

    hapticFeedback.success();
    mainButton.loading(true);

    const avatar = gender === 'female'
      ? ['👩', '👩‍🦰', '👩‍🦱', '💃', '🧘‍♀️'][Math.floor(Math.random() * 5)]
      : ['👨', '👨‍🦱', '🧑', '👨‍💻', '🎸'][Math.floor(Math.random() * 5)];

    register({
      name: name.trim(),
      age: parseInt(age),
      gender,
      bio: bio.trim() || 'Привет! Я новенький тут 👋',
      avatar,
    });

    mainButton.loading(false);
  };

  // Экран приветствия
  if (step === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6"
        style={{ background: 'var(--tg-bg-color, linear-gradient(135deg, #ec4899, #8b5cf6, #6366f1))' }}>
        <div className="text-center max-w-sm w-full">
          {/* Логотип */}
          <div className="mb-8">
            <div className="w-24 h-24 mx-auto bg-white/20 backdrop-blur-lg rounded-3xl flex items-center justify-center mb-4 shadow-xl">
              <span className="text-5xl">💕</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">NearMe</h1>
            <p className="text-white/80 text-lg">Знакомства рядом с тобой</p>
          </div>

          {/* Описание */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-5 mb-6 text-left">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📍</span>
                <span className="text-white/90">Находи людей рядом в реальном времени</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl">💬</span>
                <span className="text-white/90">Общайся и знакомься</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl">🔒</span>
                <span className="text-white/90">Безопасно и анонимно</span>
              </div>
            </div>
          </div>

          {/* Telegram user info */}
          {isFromTelegram && (
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 mb-6 flex items-center gap-3">
              {telegramUser?.photoUrl ? (
                <img src={telegramUser.photoUrl} alt="" className="w-12 h-12 rounded-full" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-xl">
                  👋
                </div>
              )}
              <div className="text-left">
                <div className="text-white font-semibold">Привет, {telegramUser?.firstName}!</div>
                <div className="text-white/60 text-sm">Войди через Telegram</div>
              </div>
            </div>
          )}

          {/* Возрастное ограничение */}
          <p className="text-white/50 text-xs">
            Сервис доступен с 14 лет
          </p>
        </div>
      </div>
    );
  }

  // Шаги регистрации
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--tg-bg-color, #ffffff)' }}>
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex gap-2 mb-4">
          {[1, 2, 3, 4].map(s => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                s <= step
                  ? 'bg-gradient-to-r from-pink-500 to-purple-500'
                  : 'bg-gray-200 dark:bg-gray-700'
              }`}
            />
          ))}
        </div>
        <h2 className="text-xl font-bold" style={{ color: 'var(--tg-text-color, #000)' }}>
          {step === 1 && 'Как тебя зовут?'}
          {step === 2 && 'Сколько тебе лет?'}
          {step === 3 && 'Кто ты?'}
          {step === 4 && 'Расскажи о себе'}
        </h2>
        <p className="text-sm mt-1" style={{ color: 'var(--tg-hint-color, #999)' }}>
          {step === 1 && 'Имя будет видно другим пользователям'}
          {step === 2 && 'Минимальный возраст — 14 лет'}
          {step === 3 && 'Выбери свой пол'}
          {step === 4 && 'Необязательно, но поможет найти друзей'}
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 px-5 pb-5">
        {/* Step 1: Name */}
        {step === 1 && (
          <div className="space-y-4">
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Введи имя"
              className="w-full px-4 py-3.5 rounded-xl border-2 text-lg transition-colors outline-none"
              style={{
                borderColor: error ? '#ef4444' : 'var(--tg-secondary-bg-color, #f0f0f0)',
                backgroundColor: 'var(--tg-secondary-bg-color, #f5f5f5)',
                color: 'var(--tg-text-color, #000)',
              }}
              maxLength={20}
              autoFocus
            />
          </div>
        )}

        {/* Step 2: Age */}
        {step === 2 && (
          <div className="space-y-4">
            <input
              type="number"
              value={age}
              onChange={e => setAge(e.target.value)}
              placeholder="Возраст"
              className="w-full px-4 py-3.5 rounded-xl border-2 text-lg transition-colors outline-none"
              style={{
                borderColor: error ? '#ef4444' : 'var(--tg-secondary-bg-color, #f0f0f0)',
                backgroundColor: 'var(--tg-secondary-bg-color, #f5f5f5)',
                color: 'var(--tg-text-color, #000)',
              }}
              min="14"
              max="99"
              autoFocus
            />
          </div>
        )}

        {/* Step 3: Gender */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => { setGender('male'); hapticFeedback.selection(); }}
                className="p-5 rounded-2xl border-2 transition-all active:scale-95"
                style={{
                  borderColor: gender === 'male' ? '#3b82f6' : 'var(--tg-secondary-bg-color, #f0f0f0)',
                  backgroundColor: gender === 'male' ? '#eff6ff' : 'var(--tg-secondary-bg-color, #f5f5f5)',
                }}
              >
                <div className="text-5xl mb-2">👨</div>
                <div className="font-medium" style={{ color: 'var(--tg-text-color, #000)' }}>Парень</div>
              </button>
              <button
                onClick={() => { setGender('female'); hapticFeedback.selection(); }}
                className="p-5 rounded-2xl border-2 transition-all active:scale-95"
                style={{
                  borderColor: gender === 'female' ? '#ec4899' : 'var(--tg-secondary-bg-color, #f0f0f0)',
                  backgroundColor: gender === 'female' ? '#fdf2f8' : 'var(--tg-secondary-bg-color, #f5f5f5)',
                }}
              >
                <div className="text-5xl mb-2">👩</div>
                <div className="font-medium" style={{ color: 'var(--tg-text-color, #000)' }}>Девушка</div>
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Bio */}
        {step === 4 && (
          <div className="space-y-4">
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="Чем увлекаешься? Что ищешь?"
              className="w-full px-4 py-3.5 rounded-xl border-2 text-base transition-colors resize-none h-32 outline-none"
              style={{
                borderColor: 'var(--tg-secondary-bg-color, #f0f0f0)',
                backgroundColor: 'var(--tg-secondary-bg-color, #f5f5f5)',
                color: 'var(--tg-text-color, #000)',
              }}
              maxLength={150}
              autoFocus
            />
            <p className="text-xs text-right" style={{ color: 'var(--tg-hint-color, #999)' }}>
              {bio.length}/150
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-3 p-3 rounded-xl text-sm text-center font-medium"
            style={{ backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
            ⚠️ {error}
          </div>
        )}

        {/* Next button (для шагов 1-3) */}
        {step >= 1 && step <= 3 && (
          <button
            onClick={handleNext}
            className="w-full mt-6 py-3.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-xl shadow-lg active:scale-95 transition-all text-lg"
          >
            Далее →
          </button>
        )}
      </div>
    </div>
  );
}
