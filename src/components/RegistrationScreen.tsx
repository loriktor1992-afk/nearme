import React, { useState } from 'react';
import { useStore } from '../store';

export default function RegistrationScreen() {
  const register = useStore(state => state.register);

  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [bio, setBio] = useState('');
  const [error, setError] = useState('');

  const handleNext = () => {
    setError('');

    if (step === 1) {
      if (!name.trim()) {
        setError('Введите имя');
        return;
      }
      setStep(2);
      return;
    }

    if (step === 2) {
      const ageNum = parseInt(age, 10);
      if (!age || Number.isNaN(ageNum)) {
        setError('Введите возраст');
        return;
      }
      if (ageNum < 14) {
        setError('Минимальный возраст — 14 лет');
        return;
      }
      if (ageNum > 99) {
        setError('Введите корректный возраст');
        return;
      }
      setStep(3);
      return;
    }

    if (step === 3) {
      setStep(4);
      return;
    }

    const avatar = gender === 'female'
      ? ['👩', '👩‍🦰', '👩‍🦱', '💃', '🧘‍♀️'][Math.floor(Math.random() * 5)]
      : ['👨', '👨‍🦱', '🧑', '👨‍💻', '🎸'][Math.floor(Math.random() * 5)];

    register({
      name: name.trim(),
      age: parseInt(age, 10),
      birthDay: 1,
      birthMonth: 1,
      birthYear: new Date().getFullYear() - parseInt(age, 10),
      gender,
      bio: bio.trim() || 'Привет! Я новенький тут 👋',
      avatar,
      photoUrl: '',
      photos: [],
      status: '',
      city: '',
      likes: [],
      dislikes: [],
      profileViews: [],
      interests: [],
      height: 0,
      zodiac: '',
      languages: [],
      socialLinks: { instagram: '', vk: '', telegram: '' },
      lookingFor: '',
      activityTime: '',
      verified: false,
      level: 1,
      xp: 0,
      achievements: [],
      isPremium: false,
      privacySettings: {
        showDistance: true,
        showLastSeen: true,
        allowMessages: true,
        visibilityMode: 'online',
        visibilityRadius: 5000,
        blockedUsers: [],
        showOnMap: true,
        shareExactLocation: false,
      },
    });
  };

  const title = ['Как тебя зовут?', 'Сколько тебе лет?', 'Кто ты?', 'Пара слов о себе'][step - 1];
  const subtitle = [
    'Имя увидят люди рядом.',
    'Возраст помогает сделать рекомендации точнее.',
    'Это можно изменить позже в профиле.',
    'Коротко и по-человечески — без анкеты на работу.',
  ][step - 1];

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 px-4 pb-[max(20px,env(safe-area-inset-bottom))] pt-[max(24px,env(safe-area-inset-top))] text-white">
      <div className="pointer-events-none absolute -left-20 top-[-90px] h-72 w-72 rounded-full bg-violet-600/35 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-[-70px] h-72 w-72 rounded-full bg-fuchsia-500/25 blur-3xl" />

      <div className="relative mx-auto flex min-h-[calc(100vh-44px)] w-full max-w-md flex-col">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.24em] text-violet-300">NearMe</div>
            <div className="mt-1 text-sm text-white/55">Знакомства в реальном времени</div>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-xl backdrop-blur-xl">
            <i className="fas fa-location-dot" />
          </div>
        </div>

        <div className="mt-10">
          <div className="mb-5 flex gap-2">
            {[1, 2, 3, 4].map(item => (
              <div
                key={item}
                className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${item <= step ? 'bg-gradient-to-r from-violet-500 to-fuchsia-400' : 'bg-white/10'}`}
              />
            ))}
          </div>

          <div className="text-sm font-semibold text-violet-300">Шаг {step} из 4</div>
          <h1 className="mt-2 text-4xl font-black tracking-[-0.04em]">{title}</h1>
          <p className="mt-3 max-w-sm text-[15px] leading-6 text-white/55">{subtitle}</p>
        </div>

        <div className="mt-8 flex-1">
          {step === 1 && (
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-[0.14em] text-white/45">Имя</label>
              <input
                type="text"
                value={name}
                onChange={event => setName(event.target.value)}
                placeholder="Например, Алексей"
                className="h-16 w-full rounded-[22px] border border-white/10 bg-white/[0.07] px-5 text-xl font-semibold text-white outline-none backdrop-blur-xl placeholder:text-white/25 focus:border-violet-400/60 focus:bg-white/[0.1]"
                maxLength={20}
                autoFocus
              />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-[0.14em] text-white/45">Возраст</label>
              <input
                type="number"
                value={age}
                onChange={event => setAge(event.target.value)}
                placeholder="25"
                className="h-20 w-full rounded-[24px] border border-white/10 bg-white/[0.07] px-5 text-center text-4xl font-black text-white outline-none backdrop-blur-xl placeholder:text-white/20 focus:border-violet-400/60"
                min="14"
                max="99"
                autoFocus
              />
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm leading-6 text-white/45">
                В NearMe минимальный возраст — 14 лет.
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'male' as const, icon: '👨', label: 'Парень' },
                { id: 'female' as const, icon: '👩', label: 'Девушка' },
              ].map(option => {
                const active = gender === option.id;
                return (
                  <button
                    key={option.id}
                    onClick={() => setGender(option.id)}
                    className={`rounded-[28px] border p-6 text-left transition active:scale-[0.98] ${active
                      ? 'border-violet-400/70 bg-violet-500/15 shadow-[0_20px_50px_rgba(124,58,237,.18)]'
                      : 'border-white/10 bg-white/[0.05]'}`}
                  >
                    <div className="text-5xl">{option.icon}</div>
                    <div className="mt-7 text-lg font-black">{option.label}</div>
                    <div className={`mt-1 text-xs font-semibold ${active ? 'text-violet-300' : 'text-white/35'}`}>
                      {active ? 'Выбрано' : 'Нажми, чтобы выбрать'}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {step === 4 && (
            <div>
              <textarea
                value={bio}
                onChange={event => setBio(event.target.value)}
                placeholder="Люблю вечерние прогулки, хороший кофе и путешествия…"
                className="h-44 w-full resize-none rounded-[24px] border border-white/10 bg-white/[0.07] p-5 text-[16px] leading-6 text-white outline-none backdrop-blur-xl placeholder:text-white/25 focus:border-violet-400/60"
                maxLength={150}
                autoFocus
              />
              <div className="mt-2 text-right text-xs font-semibold text-white/30">{bio.length}/150</div>
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-200">
              {error}
            </div>
          )}
        </div>

        <div className="mt-8">
          <button
            onClick={handleNext}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-[20px] bg-gradient-to-r from-violet-600 to-fuchsia-500 text-[15px] font-black text-white shadow-[0_18px_40px_rgba(124,58,237,.32)] transition active:scale-[0.98]"
          >
            <span>{step === 4 ? 'Открыть NearMe' : 'Продолжить'}</span>
            <i className={`fas ${step === 4 ? 'fa-location-arrow' : 'fa-arrow-right'} text-sm`} />
          </button>

          {step > 1 && (
            <button
              onClick={() => setStep(current => current - 1)}
              className="mt-2 h-11 w-full text-sm font-semibold text-white/45 transition active:scale-95"
            >
              Назад
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
