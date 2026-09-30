import React, { useState } from 'react';
import { useStore, District } from '../store';

export default function DistrictsPanel() {
  const { 
    districts, 
    currentUser, 
    currentDistrict, 
    invites,
    setCurrentDistrict, 
    setShowDistricts,
    createDistrict,
    joinDistrict,
    leaveDistrict,
    acceptInvite,
    rejectInvite
  } = useStore();

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newRadius, setNewRadius] = useState(500);

  if (!currentUser) return null;

  const handleCreate = async () => {
    if (!newName.trim()) return;
    
    await createDistrict(
      newName.trim(),
      newDescription.trim(),
      currentUser.lat,
      currentUser.lng,
      newRadius
    );
    
    setShowCreate(false);
    setNewName('');
    setNewDescription('');
    setNewRadius(500);
  };

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

  const myDistricts = districts.filter(d => d.memberIds.includes(currentUser.id));
  const availableDistricts = districts.filter(d => 
    !d.memberIds.includes(currentUser.id) && !d.inviteOnly
  );

  return (
    <div className="fixed inset-0 z-[2500] bg-gray-50 dark:bg-gray-900 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between z-10">
        <button
          onClick={() => setShowDistricts(false)}
          className="text-purple-600 dark:text-purple-400 font-medium"
        >
          ← Назад
        </button>
        <h2 className="font-bold text-gray-800 dark:text-white">Районы</h2>
        <button
          onClick={() => setShowCreate(true)}
          className="text-purple-600 dark:text-purple-400 font-bold"
        >
          + Создать
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Invites */}
        {invites.length > 0 && (
          <div>
            <h3 className="font-bold text-gray-800 dark:text-white mb-3">
              Приглашения ({invites.length})
            </h3>
            <div className="space-y-2">
              {invites.map(invite => {
                const district = districts.find(d => d.id === invite.districtId);
                if (!district) return null;
                
                return (
                  <div key={invite.id} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
                    <div className="font-bold text-gray-800 dark:text-white">{district.name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {district.description}
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => acceptInvite(invite.id)}
                        className="flex-1 py-2 bg-green-500 text-white rounded-lg font-medium"
                      >
                        Принять
                      </button>
                      <button
                        onClick={() => rejectInvite(invite.id)}
                        className="flex-1 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium"
                      >
                        Отклонить
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* My Districts */}
        <div>
          <h3 className="font-bold text-gray-800 dark:text-white mb-3">
            Мои районы ({myDistricts.length})
          </h3>
          {myDistricts.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <div className="text-4xl mb-2">🏘️</div>
              <p>У вас пока нет районов</p>
              <p className="text-sm mt-1">Создайте свой или примите приглашение</p>
            </div>
          ) : (
            <div className="space-y-2">
              {myDistricts.map(district => {
                const distance = Math.round(getDistance(
                  currentUser.lat, currentUser.lng,
                  district.centerLat, district.centerLng
                ));
                const isAdmin = district.adminIds.includes(currentUser.id);
                
                return (
                  <div
                    key={district.id}
                    onClick={() => {
                      setCurrentDistrict(district);
                      setShowDistricts(false);
                    }}
                    className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm cursor-pointer active:scale-98 transition-transform"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                          {district.name}
                          {isAdmin && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Админ</span>}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {district.description}
                        </div>
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                          <span>👥 {district.memberIds.length} участников</span>
                          <span>📍 {distance}м от вас</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Available Districts */}
        {availableDistricts.length > 0 && (
          <div>
            <h3 className="font-bold text-gray-800 dark:text-white mb-3">
              Доступные районы ({availableDistricts.length})
            </h3>
            <div className="space-y-2">
              {availableDistricts.map(district => {
                const distance = Math.round(getDistance(
                  currentUser.lat, currentUser.lng,
                  district.centerLat, district.centerLng
                ));
                
                return (
                  <div key={district.id} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
                    <div className="font-bold text-gray-800 dark:text-white">{district.name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {district.description}
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span>👥 {district.memberIds.length} участников</span>
                        <span>📍 {distance}м от вас</span>
                      </div>
                      <button
                        onClick={() => joinDistrict(district.id)}
                        className="px-4 py-1.5 bg-purple-500 text-white rounded-lg text-sm font-medium"
                      >
                        Вступить
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Create District Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-[3000] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
              Создать район
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Название
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="Например: Центр Москвы"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                  maxLength={30}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Описание
                </label>
                <textarea
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  placeholder="О чём этот район?"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white resize-none"
                  rows={3}
                  maxLength={100}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Радиус: {newRadius}м
                </label>
                <input
                  type="range"
                  min="100"
                  max="5000"
                  step="100"
                  value={newRadius}
                  onChange={e => setNewRadius(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowCreate(false)}
                  className="flex-1 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium"
                >
                  Отмена
                </button>
                <button
                  onClick={handleCreate}
                  className="flex-1 py-2 bg-purple-500 text-white rounded-lg font-medium"
                >
                  Создать
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
