import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useStore, User } from '../store';
import UserProfile from './UserProfile';
import ChatScreen from './ChatScreen';
import FiltersPanel from './FiltersPanel';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function createUserIcon(avatar: string, photoUrl: string, isMe: boolean = false) {
  const size = isMe ? 44 : 38;
  const border = isMe ? '3px solid #8b5cf6' : '2px solid #fff';
  const shadow = isMe ? '0 0 12px rgba(139,92,246,0.6)' : '0 2px 8px rgba(0,0,0,0.3)';
  
  const content = photoUrl 
    ? `<img src="${photoUrl}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;" />`
    : `<span style="font-size:${isMe ? '22px' : '18px'};">${avatar}</span>`;
  
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
          background: #22c55e;
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
  const { currentUser, onlineUsers, setSelectedUser, setShowChat, showChat, showProfile, showFilters, setShowFilters, filters } = useStore();
  const [centerLat, setCenterLat] = useState(currentUser?.lat || 55.751);
  const [centerLng, setCenterLng] = useState(currentUser?.lng || 37.618);
  const [showNearby, setShowNearby] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setCenterLat(currentUser.lat);
      setCenterLng(currentUser.lng);
    }
  }, [currentUser?.lat, currentUser?.lng]);

  const handleUserClick = (user: User) => {
    setSelectedUser(user);
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
          attribution='© <a href="https://www.mapbox.com/">Mapbox</a> © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoibG9yaWt0b3IiLCJhIjoiY211bWdiMjc3MDF5YjJ6cGI2NzRtZ2pteiJ9.XmTxQNRxrkPcRybNDEDN9w"
          tileSize={512}
          zoomOffset={-1}
        />
        
        <Marker
          position={[currentUser.lat, currentUser.lng]}
          icon={createUserIcon(currentUser.avatar, currentUser.photoUrl, true)}
        >
          <Popup>
            <div className="text-center">
              <span className="text-lg">Это ты!</span>
            </div>
          </Popup>
        </Marker>

        {onlineUsers.map(user => (
          <Marker
            key={user.id}
            position={[user.lat, user.lng]}
            icon={createUserIcon(user.avatar, user.photoUrl)}
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
                <div className="font-bold">{user.name}, {user.age}</div>
                {user.status && <div className="text-xs text-gray-500 mt-0.5 italic">"{user.status}"</div>}
                <div className="text-xs text-gray-500 mt-1">
                  {Math.round(getDistance(currentUser.lat, currentUser.lng, user.lat, user.lng))}м от тебя
                </div>
                <button
                  onClick={() => handleUserClick(user)}
                  className="mt-2 px-3 py-1 bg-purple-500 text-white rounded-full text-xs font-medium"
                >
                  Написать
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <div className="absolute top-0 left-0 right-0 z-[1000] p-3">
        <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-lg px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{currentUser.avatar}</span>
            <div>
              <div className="font-bold text-sm text-gray-800">{currentUser.name}</div>
              <div className="text-xs text-green-600 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block"></span>
                Онлайн
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 px-3 py-1 rounded-full">
              <span className="text-purple-700 font-bold text-sm">{onlineUsers.length}</span>
              <span className="text-purple-500 text-xs ml-1">рядом</span>
            </div>
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
      </div>

      <button
        onClick={() => {
          if (currentUser) {
            setCenterLat(currentUser.lat);
            setCenterLng(currentUser.lng);
          }
        }}
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
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-800">{user.name}, {user.age}</div>
                  {user.status && <div className="text-xs text-gray-400 italic">"{user.status}"</div>}
                  <div className="text-sm text-gray-500">{user.bio}</div>
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
    </div>
  );
}
