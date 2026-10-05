import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet';
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

function createUserIcon(avatar: string, photoUrl: string, isMe = false, isOnline = true) {
  const size = isMe ? 54 : 46;
  const ring = isMe ? '#7c3aed' : '#ffffff';
  const content = photoUrl
    ? `<img src="${photoUrl}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;" />`
    : `<span style="font-size:${isMe ? 24 : 20}px;">${avatar}</span>`;

  return L.divIcon({
    className: 'custom-user-marker',
    html: `
      <div class="nearme-marker ${isMe ? 'nearme-marker-me' : ''}">
        <div class="nearme-marker-ring" style="width:${size}px;height:${size}px;border-color:${ring}">
          <div class="nearme-marker-avatar">${content}</div>
          <span class="nearme-marker-status" style="background:${isOnline ? '#22c55e' : '#94a3b8'}"></span>
        </div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function MapController({ lat, lng, zoom }: { lat: number; lng: number; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) map.setView([lat, lng], zoom);
  }, [map, lat, lng, zoom]);
  return null;
}

export default function MapScreen() {
  const {
    currentUser,
    onlineUsers,
    totalUsers,
    setSelectedUser,
    setShowChat,
    showChat,
    showProfile,
    showFilters,
    setShowFilters,
    showFullProfile,
    setShowFullProfile,
    showDistricts,
    setShowDistricts,
    showChatList,
    setShowChatList,
    showAdmin,
    setShowAdmin,
    showPrivacySettings,
    showNotifications,
    setShowNotifications,
    currentDistrict,
    filters,
    updateLocation,
    getUnreadCount,
    theme,
  } = useStore();

  const [centerLat, setCenterLat] = useState(currentUser?.lat || 55.751);
  const [centerLng, setCenterLng] = useState(currentUser?.lng || 37.618);
  const [mapZoom, setMapZoom] = useState(16);
  const [showNearby, setShowNearby] = useState(false);
  const [expandedMarker, setExpandedMarker] = useState<string | null>(null);

  const mapTilerKey = import.meta.env.VITE_MAPTILER_KEY as string | undefined;
  const mapTilerMapId = (import.meta.env.VITE_MAPTILER_MAP_ID as string | undefined) || 'streets-v4';
  const tileUrl = mapTilerKey
    ? `https://api.maptiler.com/maps/${mapTilerMapId}/256/{z}/{x}/{y}@2x.png?key=${mapTilerKey}`
    : 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
  const tileAttribution = mapTilerKey
    ? '&copy; MapTiler &copy; OpenStreetMap contributors'
    : '&copy; OpenStreetMap contributors';

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        updateLocation(coords.latitude, coords.longitude);
        setCenterLat(coords.latitude);
        setCenterLng(coords.longitude);
      },
      error => console.error('GPS error:', error),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  const calculateMarkerOffset = (users: User[], index: number) => {
    const user = users[index];
    let nearbyCount = 0;

    for (let i = 0; i < users.length; i += 1) {
      if (i === index) continue;
      if (getDistance(user.lat, user.lng, users[i].lat, users[i].lng) < 100) nearbyCount += 1;
    }

    if (!nearbyCount) return { lat: user.lat, lng: user.lng };

    const angle = (index * 360 / (nearbyCount + 1)) * (Math.PI / 180);
    return {
      lat: user.lat + Math.cos(angle) * 0.0003,
      lng: user.lng + Math.sin(angle) * 0.0003,
    };
  };

  const nearbyUsers = useMemo(() => {
    if (!currentUser) return [];
    return onlineUsers
      .filter(user => {
        const distance = getDistance(currentUser.lat, currentUser.lng, user.lat, user.lng);
        if (distance > filters.distanceMax * 1000) return false;
        if (filters.gender !== 'all' && user.gender !== filters.gender) return false;
        if (filters.ageMin !== null && user.age < filters.ageMin) return false;
        if (filters.ageMax !== null && user.age > filters.ageMax) return false;
        return true;
      })
      .sort((a, b) =>
        getDistance(currentUser.lat, currentUser.lng, a.lat, a.lng) -
        getDistance(currentUser.lat, currentUser.lng, b.lat, b.lng)
      );
  }, [onlineUsers, filters, currentUser]);

  const handleGoToMyLocation = () => {
    if (!navigator.geolocation) {
      if (currentUser) {
        setCenterLat(currentUser.lat);
        setCenterLng(currentUser.lng);
        setMapZoom(19);
      }
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        updateLocation(coords.latitude, coords.longitude);
        setCenterLat(coords.latitude);
        setCenterLng(coords.longitude);
        setMapZoom(19);
      },
      error => {
        console.error('GPS error:', error);
        if (currentUser) {
          setCenterLat(currentUser.lat);
          setCenterLng(currentUser.lng);
          setMapZoom(19);
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  if (!currentUser) return null;
  if (showChat) return <ChatScreen />;

  const unreadMessages = getUnreadCount();
  const unreadNotifications = getUnreadNotificationsCount();

  return (
    <div className="relative h-full w-full overflow-hidden bg-slate-100 dark:bg-slate-950">
      <MapContainer
        center={[centerLat, centerLng]}
        zoom={16}
        minZoom={3}
        maxZoom={21}
        zoomSnap={0.5}
        zoomDelta={0.5}
        wheelPxPerZoomLevel={80}
        zoomAnimation
        fadeAnimation
        markerZoomAnimation
        className="h-full w-full z-0"
        zoomControl={false}
      >
        <TileLayer
          attribution={tileAttribution}
          url={tileUrl}
          maxZoom={21}
          maxNativeZoom={mapTilerKey ? 20 : 19}
          detectRetina={Boolean(mapTilerKey)}
        />
        <MapController lat={centerLat} lng={centerLng} zoom={mapZoom} />

        <Marker
          position={[currentUser.lat, currentUser.lng]}
          icon={createUserIcon(currentUser.avatar, currentUser.photoUrl, true, true)}
        />

        {onlineUsers.map((user, index) => {
          const isOnline = Date.now() - user.lastSeen < 5 * 60 * 1000;
          const offset = calculateMarkerOffset(onlineUsers, index);

          return (
            <Marker
              key={user.id}
              position={[offset.lat, offset.lng]}
              icon={createUserIcon(user.avatar, user.photoUrl, false, isOnline)}
              eventHandlers={{ click: () => setExpandedMarker(user.id) }}
            />
          );
        })}
      </MapContainer>

      <div className="absolute right-3 top-[154px] z-[1080] flex flex-col overflow-hidden rounded-2xl border border-white/70 bg-white/90 shadow-lg backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/90">
        <button
          onClick={() => setMapZoom(zoom => Math.min(21, zoom + 1))}
          className="flex h-11 w-11 items-center justify-center text-slate-700 transition active:scale-95 dark:text-slate-200"
          aria-label="Приблизить карту"
        >
          <i className="fas fa-plus text-sm" />
        </button>
        <div className="h-px bg-slate-200/70 dark:bg-slate-700" />
        <button
          onClick={() => setMapZoom(zoom => Math.max(3, zoom - 1))}
          className="flex h-11 w-11 items-center justify-center text-slate-700 transition active:scale-95 dark:text-slate-200"
          aria-label="Отдалить карту"
        >
          <i className="fas fa-minus text-sm" />
        </button>
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 z-[1000] h-32 bg-gradient-to-b from-slate-950/25 to-transparent" />

      <div className="absolute inset-x-0 top-0 z-[1100] px-3 pt-[max(12px,env(safe-area-inset-top))] sm:px-4">
        <div className="nearme-glass flex items-center gap-3 rounded-[26px] px-3 py-2.5">
          <button
            onClick={() => setShowFullProfile(true)}
            className="relative h-11 w-11 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 p-[2px] active:scale-95"
          >
            <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-[14px] bg-white dark:bg-slate-900">
              {currentUser.photoUrl ? (
                <img src={currentUser.photoUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="text-xl">{currentUser.avatar}</span>
              )}
            </div>
          </button>

          <button onClick={() => setShowFullProfile(true)} className="min-w-0 flex-1 text-left">
            <div className="truncate text-sm font-bold text-slate-900 dark:text-white">{currentUser.name}</div>
            <div className="mt-0.5 flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgba(34,197,94,0.12)]" />
              В сети · {onlineUsers.length} рядом
            </div>
          </button>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowChatList(true)}
              className="nearme-icon-btn relative"
              aria-label="Чаты"
            >
              <i className="fas fa-comment-dots" />
              {unreadMessages > 0 && <span className="nearme-badge">{Math.min(unreadMessages, 9)}</span>}
            </button>

            <button
              onClick={() => setShowNotifications(true)}
              className="nearme-icon-btn relative"
              aria-label="Уведомления"
            >
              <i className="fas fa-bell" />
              {unreadNotifications > 0 && <span className="nearme-badge">{Math.min(unreadNotifications, 9)}</span>}
            </button>

            <ThemeToggle />

            <button
              onClick={() => setShowAdmin(true)}
              className="nearme-icon-btn"
              aria-label="Админ-панель"
            >
              <i className="fas fa-shield-alt" />
            </button>
          </div>
        </div>
      </div>

      <div className="absolute right-3 top-24 z-[1050] rounded-full bg-slate-950/70 px-3 py-1.5 text-[11px] font-semibold text-white shadow-lg backdrop-blur-md">
        {totalUsers} пользователей
      </div>

      <div className="absolute inset-x-0 bottom-[max(14px,env(safe-area-inset-bottom))] z-[1100] px-3">
        <div className="nearme-dock mx-auto grid max-w-md grid-cols-5 items-center rounded-[28px] px-2 py-2">
          <button onClick={() => setShowNearby(true)} className="nearme-dock-item">
            <i className="fas fa-users" />
            <span>Рядом</span>
          </button>

          <button onClick={() => setShowFilters(true)} className="nearme-dock-item">
            <i className="fas fa-sliders" />
            <span>Фильтры</span>
          </button>

          <button
            onClick={handleGoToMyLocation}
            className="mx-auto -mt-7 flex h-15 w-15 items-center justify-center rounded-[22px] bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-500 text-xl text-white shadow-[0_14px_34px_rgba(124,58,237,0.38)] transition-transform active:scale-95"
            aria-label="Моё местоположение"
          >
            <i className="fas fa-location-arrow" />
          </button>

          <button onClick={() => setShowDistricts(true)} className="nearme-dock-item">
            <i className="fas fa-layer-group" />
            <span>Районы</span>
          </button>

          <button onClick={() => setShowFullProfile(true)} className="nearme-dock-item">
            <i className="fas fa-user" />
            <span>Профиль</span>
          </button>
        </div>
      </div>

      {showNearby && (
        <div className="fixed inset-0 z-[2500] flex items-end bg-slate-950/35 backdrop-blur-[2px]" onClick={() => setShowNearby(false)}>
          <div
            className="animate-slide-up w-full rounded-t-[32px] bg-white px-4 pb-[max(22px,env(safe-area-inset-bottom))] pt-3 shadow-2xl dark:bg-slate-950"
            onClick={event => event.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1.5 w-11 rounded-full bg-slate-200 dark:bg-slate-700" />
            <div className="mb-4 flex items-end justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-500">NearMe</div>
                <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950 dark:text-white">Люди рядом</h2>
              </div>
              <div className="rounded-full bg-violet-50 px-3 py-1.5 text-sm font-bold text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">
                {nearbyUsers.length}
              </div>
            </div>

            <div className="max-h-[56vh] space-y-2 overflow-y-auto pb-2">
              {nearbyUsers.map(user => {
                const distance = getDistance(currentUser.lat, currentUser.lng, user.lat, user.lng);
                const isOnline = Date.now() - user.lastSeen < 5 * 60 * 1000;

                return (
                  <button
                    key={user.id}
                    onClick={() => {
                      setExpandedMarker(user.id);
                      setShowNearby(false);
                    }}
                    className="flex w-full items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-3 text-left transition active:scale-[0.99] dark:border-slate-800 dark:bg-slate-900/70"
                  >
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500">
                      {user.photoUrl ? (
                        <img src={user.photoUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-2xl">{user.avatar}</div>
                      )}
                      <span className={`absolute bottom-1 right-1 h-2.5 w-2.5 rounded-full border-2 border-white ${isOnline ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-bold text-slate-900 dark:text-white">{user.name}, {user.age}</span>
                        {user.verified && <i className="fas fa-check-circle text-[12px] text-blue-500" />}
                      </div>
                      <div className="mt-0.5 truncate text-sm text-slate-500 dark:text-slate-400">
                        {user.status || user.bio || 'Рядом с вами'}
                      </div>
                      <div className="mt-1 text-xs font-semibold text-violet-600 dark:text-violet-400">
                        {formatDistance(distance)}
                      </div>
                    </div>

                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm dark:bg-slate-800">
                      <i className="fas fa-chevron-right text-xs" />
                    </div>
                  </button>
                );
              })}

              {nearbyUsers.length === 0 && (
                <div className="py-12 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-violet-50 text-2xl text-violet-500 dark:bg-violet-500/10">
                    <i className="fas fa-location-dot" />
                  </div>
                  <h3 className="mt-4 font-bold text-slate-900 dark:text-white">Пока никого рядом</h3>
                  <p className="mt-1 text-sm text-slate-500">Попробуй увеличить радиус в фильтрах.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {expandedMarker && (() => {
        const user = onlineUsers.find(item => item.id === expandedMarker);
        if (!user) return null;

        const distance = getDistance(currentUser.lat, currentUser.lng, user.lat, user.lng);
        const isOnline = Date.now() - user.lastSeen < 5 * 60 * 1000;

        return (
          <div className="fixed inset-0 z-[3000] flex items-end justify-center bg-slate-950/55 p-3 backdrop-blur-sm sm:items-center" onClick={() => setExpandedMarker(null)}>
            <div
              className="animate-slide-up w-full max-w-sm overflow-hidden rounded-[30px] bg-white shadow-2xl dark:bg-slate-950"
              onClick={event => event.stopPropagation()}
            >
              <div className="relative h-[360px] bg-gradient-to-br from-violet-500 to-fuchsia-500">
                {user.photoUrl ? (
                  <img src={user.photoUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-9xl">{user.avatar}</div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/10 to-transparent" />

                <button
                  onClick={() => setExpandedMarker(null)}
                  className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-slate-950/35 text-white backdrop-blur-md"
                >
                  <i className="fas fa-times" />
                </button>

                <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                  <div className="mb-2 flex items-center gap-2 text-xs font-semibold">
                    <span className={`h-2 w-2 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-slate-400'}`} />
                    {isOnline ? 'Сейчас онлайн' : 'Недавно был(а)'}
                    <span className="text-white/45">•</span>
                    <span>{formatDistance(distance)}</span>
                  </div>
                  <h3 className="text-3xl font-black tracking-tight">
                    {user.name}, {user.age}
                    {user.verified && <i className="fas fa-check-circle ml-2 text-base text-blue-400" />}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-sm leading-5 text-white/75">
                    {user.status || user.bio || 'Открыт(а) для новых знакомств'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-[1fr_auto] gap-3 p-4">
                <button
                  onClick={() => {
                    setExpandedMarker(null);
                    setSelectedUser(user);
                  }}
                  className="h-13 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-5 font-bold text-white shadow-[0_12px_28px_rgba(124,58,237,0.24)] active:scale-[0.98]"
                >
                  Открыть профиль
                </button>
                <button
                  onClick={() => {
                    setSelectedUser(user);
                    setExpandedMarker(null);
                    setShowChat(true);
                  }}
                  className="flex h-13 w-13 items-center justify-center rounded-2xl bg-slate-100 text-violet-600 active:scale-95 dark:bg-slate-900 dark:text-violet-400"
                  aria-label="Написать"
                >
                  <i className="fas fa-comment-dots" />
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {showProfile && <UserProfile />}
      {showFilters && <FiltersPanel />}
      {showFullProfile && <FullProfile />}
      {showDistricts && !currentDistrict && <DistrictsPanel />}
      {currentDistrict && <DistrictView />}
      {showChatList && <ChatList />}
      {showAdmin && <AdminPanel />}
      {showPrivacySettings && <PrivacySettings />}
      {showNotifications && <NotificationsPanel />}
      <Toast />
    </div>
  );
}
