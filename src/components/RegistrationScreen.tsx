import React, { useState } from 'react';
import { useStore } from '../store';

export default function RegistrationScreen() {
  const register = useStore(s => s.register);
  
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
    } else if (step === 2) {
      const ageNum = parseInt(age);
      if (!age || isNaN(ageNum)) {
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
    } else if (step === 3) {
      setStep(4);
    } else if (step === 4) {
      const avatar = gender === 'female' 
        ? ['👩', '👩‍🦰', '👩‍🦱', '💃', '🧘‍♀️'][Math.floor(Math.random() * 5)]
        : ['👨', '👨‍🦱', '🧑', '👨‍💻', '🎸'][Math.floor(Math.random() * 5)];
      
      register({
        name: name.trim(),
        age: parseInt(age),
        gender,
        bio: bio.trim() || 'Привет! Я новенький тут 👋',
        avatar,
        photoUrl: '',
        status: '',
        city: '',
        likes: [],
        dislikes: [],
        profileViews: [],
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-600 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">💕</div>
          <h1 className="text-3xl font-bold text-white">NearMe</h1>
          <p className="text-white/80 mt-1">Знакомства рядом с тобой</p>
        </div>

        <div className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl p-6">
          <div className="flex gap-2 mb-6">
            {[1, 2, 3, 4].map(s => (
              <div
                key={s}
                className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                  s <= step ? 'bg-gradient-to-r from-pink-500 to-purple-500' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>

          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-800">Как тебя зовут?</h2>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Введи имя"
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-400 focus:outline-none text-lg transition-colors"
                maxLength={20}
                autoFocus
              />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-800">Сколько тебе лет?</h2>
              <p className="text-sm text-gray-500">Минимальный возраст — 14 лет</p>
              <input
                type="number"
                value={age}
                onChange={e => setAge(e.target.value)}
                placeholder="Возраст"
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-400 focus:outline-none text-lg transition-colors"
                min="14"
                max="99"
                autoFocus
              />
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-800">Кто ты?</h2>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setGender('male')}
                  className={`p-4 rounded-2xl border-2 transition-all ${
                    gender === 'male'
                      ? 'border-blue-500 bg-blue-50 shadow-lg scale-105'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-4xl mb-2">👨</div>
                  <div className="font-medium text-gray-700">Парень</div>
                </button>
                <button
                  onClick={() => setGender('female')}
                  className={`p-4 rounded-2xl border-2 transition-all ${
                    gender === 'female'
                      ? 'border-pink-500 bg-pink-50 shadow-lg scale-105'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-4xl mb-2">👩</div>
                  <div className="font-medium text-gray-700">Девушка</div>
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-800">Расскажи о себе</h2>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder="Чем увлекаешься? Что ищешь?"
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-400 focus:outline-none text-base transition-colors resize-none h-28"
                maxLength={150}
                autoFocus
              />
              <p className="text-xs text-gray-400 text-right">{bio.length}/150</p>
            </div>
          )}

          {error && (
            <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm text-center">
              {error}
            </div>
          )}

          <button
            onClick={handleNext}
            className="w-full mt-5 py-3.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl active:scale-95 transition-all text-lg"
          >
            {step === 4 ? '🚀 Начать знакомства' : 'Далее →'}
          </button>
          
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="w-full mt-2 py-2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              ← Назад
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
