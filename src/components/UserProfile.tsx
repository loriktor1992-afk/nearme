import React from 'react';
import { useStore } from '../store';

export default function UserProfile() {
  const { selectedUser, currentUser, setShowProfile, setShowChat } = useStore();
  
  if (!selectedUser || !currentUser) return null;

  const getDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const distance = Math.round(getDistance(currentUser.lat, currentUser.lng, selectedUser.lat, selectedUser.lng));

  return (
    <div className="absolute inset-0 z-[2000] flex items-end">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setShowProfile(false)}
      />
      
      <div className="relative w-full bg-white rounded-t-3xl shadow-2xl animate-slide-up overflow-hidden max-h-[85vh] overflow-y-auto">
        <div className="bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-600 pt-8 pb-16 px-6 relative">
          <button
            onClick={() => setShowProfile(false)}
            className="absolute top-4 right-4 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center"
          >
            <i className="fas fa-times text-white"></i>
          </button>
          <div className="text-center">
            <div className="text-6xl mb-2">{selectedUser.avatar}</div>
            <h2 className="text-2xl font-bold text-white">{selectedUser.name}, {selectedUser.age}</h2>
            <div className="flex items-center justify-center gap-2 mt-2">
              <span className="w-2 h-2 bg-green-400 rounded-full"></span>
              <span className="text-white/80 text-sm">Онлайн</span>
            </div>
          </div>
        </div>

        <div className="px-6 -mt-8">
          <div className="bg-white rounded-2xl shadow-lg p-4 space-y-4">
            <div className="flex items-center justify-center gap-2">
              <i className="fas fa-location-dot text-purple-500"></i>
              <span className="text-gray-600">{distance}м от тебя</span>
            </div>

            <div className="text-center">
              <p className="text-gray-700 text-base">{selectedUser.bio}</p>
            </div>

            <div className="flex justify-center gap-6 py-2">
              <div className="text-center">
                <div className="text-lg font-bold text-purple-600">{selectedUser.age}</div>
                <div className="text-xs text-gray-500">возраст</div>
              </div>
              <div className="w-px bg-gray-200"></div>
              <div className="text-center">
                <div className="text-lg font-bold text-purple-600">
                  {distance < 500 ? '🔥' : '📍'}
                </div>
                <div className="text-xs text-gray-500">
                  {distance < 500 ? 'очень близко' : 'рядом'}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 pt-4 pb-8 flex gap-3">
          <button
            onClick={() => { setShowProfile(false); setShowChat(true); }}
            className="flex-1 py-3.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <i className="fas fa-comment-dots"></i>
            Написать
          </button>
          <button
            onClick={() => setShowProfile(false)}
            className="px-6 py-3.5 bg-gray-100 text-gray-600 font-semibold rounded-xl active:scale-95 transition-all"
          >
            <i className="fas fa-heart text-pink-500"></i>
          </button>
        </div>
      </div>
    </div>
  );
}
