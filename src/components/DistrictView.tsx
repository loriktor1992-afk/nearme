import React, { useState } from 'react';
import { useStore, User } from '../store';

export default function DistrictView() {
  const { 
    currentDistrict, 
    currentUser, 
    onlineUsers,
    setCurrentDistrict,
    inviteToDistrict,
    removeMember,
    makeAdmin,
    leaveDistrict
  } = useStore();

  const [showInvite, setShowInvite] = useState(false);
  const [showMembers, setShowMembers] = useState(false);

  if (!currentDistrict || !currentUser) return null;

  const isAdmin = currentDistrict.adminIds.includes(currentUser.id);
  const isMainAdmin = currentDistrict.adminId === currentUser.id;

  // Получаем участников района из onlineUsers
  const districtMembers = onlineUsers.filter(u => 
    currentDistrict.memberIds.includes(u.id)
  );

  // Пользователи которых можно пригласить (не участники и не в pending invites)
  const availableToInvite = onlineUsers.filter(u => 
    !currentDistrict.memberIds.includes(u.id)
  );

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

  return (
    <div className="fixed inset-0 z-[2500] bg-gray-50 dark:bg-gray-900 overflow-y-auto">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-500 to-indigo-600 pt-8 pb-12 px-4">
        <button
          onClick={() => setCurrentDistrict(null)}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 mb-4"
        >
          <i className="fas fa-arrow-left text-white"></i>
        </button>
        
        <h1 className="text-3xl font-bold text-white">{currentDistrict.name}</h1>
        <p className="text-white/80 mt-2">{currentDistrict.description}</p>
        
        <div className="flex items-center gap-4 mt-4 text-white/90 text-sm">
          <span>👥 {currentDistrict.memberIds.length} участников</span>
          <span>📍 Радиус {currentDistrict.radius}м</span>
        </div>
      </div>

      <div className="p-4 space-y-4 -mt-6">
        {/* Members Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-800 dark:text-white">
              Участники ({districtMembers.length})
            </h3>
            {isAdmin && (
              <button
                onClick={() => setShowInvite(!showInvite)}
                className="text-purple-600 dark:text-purple-400 text-sm font-medium"
              >
                + Пригласить
              </button>
            )}
          </div>

          <div className="space-y-2">
            {districtMembers.map(user => {
              const distance = Math.round(getDistance(
                currentUser.lat, currentUser.lng,
                user.lat, user.lng
              ));
              const isMemberAdmin = currentDistrict.adminIds.includes(user.id);
              const isMainAdminUser = currentDistrict.adminId === user.id;
              
              return (
                <div key={user.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                  <div className="relative">
                    {user.photoUrl ? (
                      <img src={user.photoUrl} alt="" className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-xl">
                        {user.avatar}
                      </div>
                    )}
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                  </div>
                  
                  <div className="flex-1">
                    <div className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                      {user.name}, {user.age}
                      {isMainAdminUser && (
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                          👑 Админ
                        </span>
                      )}
                      {isMemberAdmin && !isMainAdminUser && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                          Админ
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {distance}м от вас
                    </div>
                  </div>

                  {isAdmin && !isMainAdminUser && user.id !== currentUser.id && (
                    <div className="flex gap-1">
                      {isMainAdmin && !isMemberAdmin && (
                        <button
                          onClick={() => makeAdmin(currentDistrict.id, user.id)}
                          className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                          title="Сделать админом"
                        >
                          <i className="fas fa-user-shield text-sm"></i>
                        </button>
                      )}
                      {(isMainAdmin || (isAdmin && !isMemberAdmin)) && (
                        <button
                          onClick={() => {
                            if (confirm(`Удалить ${user.name} из района?`)) {
                              removeMember(currentDistrict.id, user.id);
                            }
                          }}
                          className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                          title="Удалить из района"
                        >
                          <i className="fas fa-user-times text-sm"></i>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Invite Panel */}
        {showInvite && isAdmin && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
            <h3 className="font-bold text-gray-800 dark:text-white mb-3">
              Пригласить пользователей
            </h3>
            
            {availableToInvite.length === 0 ? (
              <p className="text-gray-400 text-center py-4">
                Нет доступных пользователей для приглашения
              </p>
            ) : (
              <div className="space-y-2">
                {availableToInvite.map(user => (
                  <div key={user.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                    <div className="relative">
                      {user.photoUrl ? (
                        <img src={user.photoUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-lg">
                          {user.avatar}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="font-semibold text-gray-800 dark:text-white text-sm">
                        {user.name}, {user.age}
                      </div>
                    </div>

                    <button
                      onClick={() => inviteToDistrict(currentDistrict.id, user.id)}
                      className="px-3 py-1 bg-purple-500 text-white rounded-lg text-sm font-medium"
                    >
                      Пригласить
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Leave Button */}
        {!isMainAdmin && (
          <button
            onClick={() => {
              if (confirm('Покинуть район?')) {
                leaveDistrict(currentDistrict.id);
                setCurrentDistrict(null);
              }
            }}
            className="w-full py-3 bg-red-500 text-white rounded-xl font-medium"
          >
            Покинуть район
          </button>
        )}
      </div>
    </div>
  );
}
