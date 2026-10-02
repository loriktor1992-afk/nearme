import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useStore, User } from '../store';
import UserProfile from './UserProfile';
import ChatScreen from './ChatScreen';
import FiltersPanel from './FiltersPanel';
import FullProfile from './FullProfile';
import DistrictsPanel from './DistrictsPanel';
import DistrictView from './DistrictView';
import ChatList from './ChatList';
import Toast from './Toast';
import ThemeToggle from './ThemeToggle';
import AdminPanel from './AdminPanel';
import PrivacySettings from './PrivacySettings';
import NotificationsPanel from './NotificationsPanel';
import { getDistance, formatDistance } from '../utils/helpers';
import { getUnreadNotificationsCount } from '../utils/pushNotifications';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function createUserIcon(avatar: string, photoUrl: string, isMe: boolean = false, isOnline: boolean = true) {
  const size = isMe ? 44 : 38;
  const border = isMe ? '3px solid #8b5cf6' : '2px solid #fff';
  const shadow = isMe ? '0 0 12px rgba(139,92,246,0.6)' : '0 2px 8px rgba(0,0,0,0.3)';
  
  const content = photoUrl 
    ? `<img src="${photoUrl}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;" />`
    : `<span style="font-size:${isMe ? '22px' : '18px'};">${avatar}</span>`;
  
  const statusColor = isOnline ? '#22c55e' : '#9ca3af';
  
  return L.divIcon({
    className: 'custom-user-marker',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        background: linear-gradient(135deg, #ec4899, #8b5cf6);
        border: ${border};
        box-shadow: ${shadow};
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        position: relative;
        overflow: hidden;
      ">
        ${content}
        <div style="
          position: absolute;
          bottom: -1px;
          right: -1px;
          width: 10px;
          height: 10px;
          background: ${statusColor};
          border-radius: 50%;
          border: 2px solid white;
        "></div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

// Убираем авто-возврат карты
// function MapController({ lat, lng }: { lat: number; lng: number }) {
//   const map = useMap();
//   useEffect(() => {
//     map.setView([lat, lng], 15);
//   }, [map, lat, lng]);
//   return null;
// }

export default function MapScreen() {
  const { currentUser, onlineUsers, totalUsers, setSelectedUser, setShowChat, showChat, showProfile, showFilters, setShowFilters, showFullProfile, setShowFullProfile, showDistricts, setShowDistricts, showChatList, setShowChatList, showAdmin, setShowAdmin, showPrivacySettings, showNotifications, setShowNotifications, currentDistrict, filters, updateLocation, toastMessage, getUnreadCount } = useStore();
  const [centerLat, setCenterLat] = useState(currentUser?.lat || 55.751);
  const [centerLng, setCenterLng] = useState(currentUser?.lng || 37.618);
  const [showNearby, setShowNearby] = useState(false);
  const [expandedMarker, setExpandedMarker] = useState<string | null>(null);

  // Получаем GPS координаты при загрузке
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          updateLocation(latitude, longitude);
          setCenterLat(latitude);
          setCenterLng(longitude);
        },
        (error) => {
          console.error('GPS error:', error);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }
  }, []);

  const handleUserClick = (user: User) => {
    setExpandedMarker(user.id);
  };

  const handleCloseExpanded = () => {
    setExpandedMarker(null);
  };

  // Функция для расчета смещения маркеров чтобы они не слипались
  const calculateMarkerOffset = (users: User[], index: number): { lat: number; lng: number } => {
    const user = users[index];
    let offsetLat = 0;
    let offsetLng = 0;
    
    // Проверяем близость к другим пользователям
    for (let i = 0; i < users.length; i++) {
      if (i === index) continue;
      
      const otherUser = users[i];
      const distance = getDistance(user.lat, user.lng, otherUser.lat, otherUser.lng);
      
      // Если расстояние меньше 50 метров, добавляем смещение
      if (distance < 50) {
        // Создаем смещение по кругу
        const angle = (index * 137.5) % 360; // Золотой угол для равномерного распределения
        const offsetDistance = 0.0002; // Примерно 20 метров
        
        offsetLat = Math.cos(angle * Math.PI / 180) * offsetDistance;
        offsetLng = Math.sin(angle * Math.PI / 180) * offsetDistance;
        
        break;
      }
    }
    
    return {
      lat: user.lat + offsetLat,
      lng: user.lng + offsetLng,
    };
  };

  const nearbyUsers = useMemo(() => {
    return onlineUsers
      .filter(u => {
        if (!currentUser) return false;
        
        // Distance filter
        const dist = getDistance(currentUser.lat, currentUser.lng, u.lat, u.lng);
        if (dist > filters.distanceMax * 1000) return false;
        
        // Gender filter
        if (filters.gender !== 'all' && u.gender !== filters.gender) return false;
        
        // Age filter
        if (u.age < filters.ageMin || u.age > filters.ageMax) return false;
        
        return true;
      })
      .sort((a, b) => {
        if (!currentUser) return 0;
        const distA = getDistance(currentUser.lat, currentUser.lng, a.lat, a.lng);
        const distB = getDistance(currentUser.lat, currentUser.lng, b.lat, b.lng);
        return distA - distB;
      });
  }, [onlineUsers, filters, currentUser]);

  // Функция возврата к текущему местоположению
  const handleGoToMyLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          updateLocation(latitude, longitude);
          setCenterLat(latitude);
          setCenterLng(longitude);
        },
        (error) => {
          console.error('GPS error:', error);
          alert('Не удалось получить местоположение');
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }
  };

  if (!currentUser) return null;

  if (showChat) {
    return <ChatScreen />;
  }

  return (
    <div className="w-full h-full relative">
      <MapContainer
        center={[centerLat, centerLng]}
        zoom={15}
        className="w-full h-full z-0"
        zoomControl={false}
      >
        <TileLayer
          attribution=''
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <Marker
          position={[currentUser.lat, currentUser.lng]}
          icon={createUserIcon(currentUser.avatar, currentUser.photoUrl, true, true)}
        >
          <Popup>
            <div className="text-center">
              <span className="text-lg">Это ты!</span>
            </div>
          </Popup>
        </Marker>

        {onlineUsers.map((user, index) => {
          const isOnline = Date.now() - user.lastSeen < 5 * 60 * 1000;
          const offset = calculateMarkerOffset(onlineUsers, index);
          return (
          <Marker
            key={user.id}
            position={[offset.lat, offset.lng]}
            icon={createUserIcon(user.avatar, user.photoUrl, false, isOnline)}
            eventHandlers={{
              click: () => handleUserClick(user),
            }}
          >
            <Popup>
              <div className="text-center p-1">
                {user.photoUrl ? (
                  <img src={user.photoUrl} alt="" className="w-12 h-12 rounded-full mx-auto mb-1 object-cover" />
                ) : (
                  <div className="text-2xl mb-1">{user.avatar}</div>
                )}
                <div className="font-bold flex items-center justify-center gap-1">
                  {user.name}, {user.age}
                  {Date.now() - user.lastSeen < 5 * 60 * 1000 ? (
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  ) : (
                    <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                  )}
                </div>
                {user.status && <div className="text-xs text-gray-500 mt-0.5 italic">"{user.status}"</div>}
                <div className="text-xs text-gray-500 mt-1">
                  {formatDistance(getDistance(currentUser.lat, currentUser.lng, user.lat, user.lng))} от тебя
                </div>
                <div className="text-xs text-gray-400 mt-0.5">
                  {Date.now() - user.lastSeen < 5 * 60 * 1000 
                    ? 'Онлайн' 
                    : `Был(а) ${Math.round((Date.now() - user.lastSeen) / 60000)} мин назад`}
                </div>
                <button
                  onClick={() => handleUserClick(user)}
                  className="mt-2 px-3 py-1 bg-purple-500 text-white rounded-full text-xs font-medium"
                >
                  Открыть профиль
                </button>
              </div>
            </Popup>
          </Marker>
          );
        })}
      </MapContainer>

      <div className="absolute top-0 left-0 right-0 z-[1000] p-3">
        <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-lg px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => setShowFullProfile(true)} className="relative">
              {currentUser.photoUrl ? (
                <img src={currentUser.photoUrl} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-purple-400" />
              ) : (
                <span className="text-2xl">{currentUser.avatar}</span>
              )}
            </button>
            <div>
              <button onClick={() => setShowFullProfile(true)} className="font-bold text-sm text-gray-800 text-left">{currentUser.name}</button>
              <div className="text-xs text-green-600 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block"></span>
                Онлайн
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowFullProfile(true)} className="bg-purple-100 dark:bg-purple-900/30 px-3 py-1.5 rounded-full active:scale-95 transition-transform">
              <i className="fas fa-user text-purple-600 dark:text-purple-400 text-sm"></i>
            </button>
            <button onClick={() => setShowChatList(true)} className="bg-pink-100 dark:bg-pink-900/30 px-3 py-1.5 rounded-full active:scale-95 transition-transform relative">
              <i className="fas fa-comment-dots text-pink-600 dark:text-pink-400 text-sm"></i>
              {getUnreadCount() > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {getUnreadCount()}
                </span>
              )}
            </button>
            <button onClick={() => setShowNotifications(true)} className="bg-yellow-100 dark:bg-yellow-900/30 px-3 py-1.5 rounded-full active:scale-95 transition-transform relative">
              <i className="fas fa-bell text-yellow-600 dark:text-yellow-400 text-sm"></i>
              {getUnreadNotificationsCount() > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {getUnreadNotificationsCount()}
                </span>
              )}
            </button>
            <div className="bg-blue-100 dark:bg-blue-900/30 px-3 py-1 rounded-full">
              <span className="text-blue-700 dark:text-blue-400 font-bold text-sm">{totalUsers}</span>
              <span className="text-blue-500 dark:text-blue-400 text-xs ml-1">всего</span>
            </div>
            <ThemeToggle />
            <button 
              onClick={() => setShowAdmin(true)} 
              className="bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-full active:scale-95 transition-transform"
              title="Админ-панель"
            >
              <i className="fas fa-shield-alt text-gray-600 dark:text-gray-400 text-sm"></i>
            </button>
          </div>
        </div>
      </div>

      <div className="absolute bottom-24 left-4 z-[1000] flex flex-col gap-2">
        <button
          onClick={() => setShowNearby(!showNearby)}
          className="bg-white shadow-lg rounded-full p-3 active:scale-95 transition-transform"
        >
          <i className="fas fa-list text-purple-600 text-lg"></i>
        </button>
        <button
          onClick={() => setShowFilters(true)}
          className="bg-white shadow-lg rounded-full p-3 active:scale-95 transition-transform"
        >
          <i className="fas fa-sliders text-purple-600 text-lg"></i>
        </button>
        <button
          onClick={() => {
            if (currentUser) {
              setCenterLat(currentUser.lat);
              setCenterLng(currentUser.lng);
            }
          }}
          className="bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg rounded-xl px-4 py-3 active:scale-95 transition-transform flex items-center gap-2"
        >
          <i className="fas fa-map-marked-alt text-white"></i>
          <span className="text-white font-bold text-sm">НА КАРТУ</span>
        </button>
      </div>

      <button
        onClick={handleGoToMyLocation}
        className="absolute bottom-24 right-4 z-[1000] bg-white shadow-lg rounded-full p-3 active:scale-95 transition-transform"
      >
        <i className="fas fa-crosshairs text-purple-600 text-lg"></i>
      </button>

      {showNearby && (
        <div className="absolute bottom-0 left-0 right-0 z-[1000] bg-white rounded-t-3xl shadow-2xl max-h-[60vh] overflow-hidden">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg text-gray-800">Люди рядом</h3>
              <button onClick={() => setShowNearby(false)} className="text-gray-400 p-1">
                <i className="fas fa-times text-lg"></i>
              </button>
            </div>
          </div>
          <div className="overflow-y-auto max-h-[50vh]">
            {nearbyUsers.map(user => (
              <div
                key={user.id}
                onClick={() => { handleUserClick(user); setShowNearby(false); }}
                className="flex items-center gap-3 p-4 border-b border-gray-50 active:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-xl overflow-hidden">
                    {user.photoUrl ? (
                      <img src={user.photoUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      user.avatar
                    )}
                  </div>
                  <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                    Date.now() - user.lastSeen < 5 * 60 * 1000 ? 'bg-green-500' : 'bg-gray-400'
                  }`}></div>
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-800 flex items-center gap-2">
                    {user.name}, {user.age}
                    {Date.now() - user.lastSeen < 5 * 60 * 1000 ? (
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    ) : (
                      <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                    )}
                  </div>
                  {user.status && <div className="text-xs text-gray-400 italic">"{user.status}"</div>}
                  <div className="text-sm text-gray-500">{user.bio}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {Date.now() - user.lastSeen < 5 * 60 * 1000 
                      ? 'Онлайн' 
                      : Date.now() - user.lastSeen < 30 * 60 * 1000
                      ? `Был(а) ${Math.round((Date.now() - user.lastSeen) / 60000)} мин назад`
                      : 'Давно не заходил(а)'}
                  </div>
                </div>
                <div className="text-xs text-purple-600 font-medium">
                  {Math.round(getDistance(currentUser.lat, currentUser.lng, user.lat, user.lng))}м
                </div>
              </div>
            ))}
            {nearbyUsers.length === 0 && (
              <div className="p-8 text-center text-gray-400">
                <div className="text-4xl mb-2">🔍</div>
                <p>Пока никого нет рядом</p>
              </div>
            )}
          </div>
        </div>
      )}

      {showProfile && <UserProfile />}
      {showFilters && <FiltersPanel />}
      {showFullProfile && <FullProfile />}
      {showDistricts && !currentDistrict && <DistrictsPanel />}
      {currentDistrict && <DistrictView />}
      
      {/* Увеличенный маркер */}
      {expandedMarker && (() => {
        const user = onlineUsers.find(u => u.id === expandedMarker);
        if (!user) return null;
        return (
          <div className="fixed inset-0 z-[3000] bg-black/80 flex items-center justify-center p-4" onClick={handleCloseExpanded}>
            <div className="bg-white rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
              {user.photoUrl ? (
                <img src={user.photoUrl} alt="" className="w-full h-80 object-cover" />
              ) : (
                <div className="w-full h-80 bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-9xl">
                  {user.avatar}
                </div>
              )}
              <div className="p-5">
                <h3 className="text-2xl font-bold text-gray-800">{user.name}, {user.age}</h3>
                {user.status && <p className="text-gray-500 italic mt-1">"{user.status}"</p>}
                <p className="text-gray-600 mt-2">{user.bio}</p>
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => {
                      handleCloseExpanded();
                      setSelectedUser(user);
                    }}
                    className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-xl shadow-lg active:scale-95 transition-all"
                  >
                    Открыть профиль
                  </button>
                  <button
                    onClick={handleCloseExpanded}
                    className="px-5 py-3 bg-gray-100 text-gray-600 font-semibold rounded-xl active:scale-95 transition-all"
                  >
                    Закрыть
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
      
      {showChatList && <ChatList />}
      {showAdmin && <AdminPanel />}
      {showPrivacySettings && <PrivacySettings />}
      {showNotifications && <NotificationsPanel />}
      <Toast />
    </div>
  );
}
