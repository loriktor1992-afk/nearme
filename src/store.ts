import { create } from 'zustand';
import { ref, set as fbSet, onValue, push, update, onDisconnect, Unsubscribe } from 'firebase/database';
import { db } from './firebase';
import { auth } from './auth';
import { backend } from './backend';
import { compressImage, isValidImageFile } from './utils/imageCompressor';
import { logError, rateLimiter } from './utils/helpers';
import { notifyNewMessage, notifyNewLike, notifyMatch } from './utils/pushNotifications';

export interface Story {
  id: string;
  url: string;
  type: 'image' | 'video';
  createdAt: number;
  expiresAt: number;
  viewedBy?: Record<string, boolean>;
}

export interface User {
  id: string;
  name: string;
  age: number;
  birthDay: number; // день рождения (1-31)
  birthMonth: number; // месяц рождения (1-12)
  birthYear: number; // год рождения
  gender: 'male' | 'female';
  bio: string;
  avatar: string; // emoji fallback
  photoUrl: string; // реальное фото (URL)
  photos: string[]; // галерея до 6 фото
  status: string; // статус под фото
  city: string; // город
  lat: number;
  lng: number;
  isOnline: boolean;
  lastSeen: number;
  likes: string[]; // кто лайкнул
  dislikes: string[]; // антипатия
  profileViews: string[]; // кто смотрел профиль
  // Новые поля для полноценного профиля
  interests: string[]; // интересы-теги
  height: number; // рост
  zodiac: string; // знак зодиака
  languages: string[]; // языки
  socialLinks: { instagram: string; vk: string; telegram: string };
  lookingFor: string; // кого ищет
  activityTime: string; // когда обычно онлайн
  verified: boolean; // верификация
  level: number; // уровень
  xp: number; // опыт
  achievements: string[]; // достижения
  isPremium: boolean; // премиум статус
  premiumExpiresAt?: number;
  isInvisible?: boolean;
  stories?: Story[];
  telegramChatId?: string; // Telegram chat_id для push-уведомлений
  privacySettings: {
    showDistance: boolean;
    showLastSeen: boolean;
    allowMessages: boolean;
    visibilityMode: 'online' | 'hidden' | 'ghost'; // режим видимости
    visibilityRadius: number; // радиус видимости в метрах
    blockedUsers: string[]; // заблокированные пользователи
    showOnMap: boolean; // показываться на карте
    shareExactLocation?: boolean; // точные координаты только по явному opt-in
  };
}

export interface Message {
  id: string;
  fromId: string;
  toId: string;
  fromName?: string; // Имя отправителя для отображения когда пользователь оффлайн
  fromAvatar?: string; // Аватар отправителя
  fromPhotoUrl?: string; // Фото отправителя
  text: string;
  timestamp: number;
  read: boolean;
  reactions: Record<string, string[]>; // emoji -> userIds
}

export interface District {
  id: string;
  name: string;
  description: string;
  centerLat: number;
  centerLng: number;
  radius: number; // в метрах
  adminId: string;
  adminIds: string[]; // список админов
  memberIds: string[]; // список участников
  inviteOnly: boolean; // только по приглашению
  createdAt: number;
}

export interface DistrictInvite {
  id: string;
  districtId: string;
  fromUserId: string;
  toUserId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: number;
}

export interface Filters {
  gender: 'all' | 'male' | 'female';
  ageMin: number | null;
  ageMax: number | null;
  distanceMax: number;
}

interface AppState {
  isRegistered: boolean;
  currentUser: User | null;
  onlineUsers: User[];
  allUsers: User[]; // Все пользователи (для чатов)
  totalUsers: number;
  districts: District[];
  currentDistrict: District | null;
  invites: DistrictInvite[];
  selectedUser: User | null;
  messages: Message[];
  matchIds: string[];
  showChat: boolean;
  showProfile: boolean;
  showFilters: boolean;
  showFullProfile: boolean;
  showDistricts: boolean;
  showChatList: boolean;
  showAdmin: boolean;
  showPrivacySettings: boolean;
  showNotifications: boolean;
  showEditProfile: boolean;
  showPremium: boolean;
  showStories: boolean;
  storyViewUser: User | null;
  typingUsers: Record<string, number>; // userId -> timestamp
  filters: Filters;
  theme: 'light' | 'dark';
  
  register: (user: Omit<User, 'id' | 'lat' | 'lng' | 'isOnline' | 'lastSeen'>) => void;
  setSelectedUser: (user: User | null) => void;
  setShowChat: (show: boolean) => void;
  setShowProfile: (show: boolean) => void;
  setShowFilters: (show: boolean) => void;
  setShowFullProfile: (show: boolean) => void;
  setShowChatList: (show: boolean) => void;
  setShowAdmin: (show: boolean) => void;
  setShowPrivacySettings: (show: boolean) => void;
  setShowNotifications: (show: boolean) => void;
  setShowEditProfile: (show: boolean) => void;
  setShowPremium: (show: boolean) => void;
  setShowStories: (show: boolean) => void;
  setStoryViewUser: (user: User | null) => void;
  activatePremium: () => void;
  toggleInvisible: () => void;
  uploadStory: (file: File, type: 'image' | 'video') => Promise<void>;
  viewStory: (userId: string, storyId: string) => void;
  setFilters: (filters: Partial<Filters>) => void;
  resetFilters: () => void;
  sendMessage: (text: string) => Promise<void>;
  updateLocation: (lat: number, lng: number) => void;
  startLocationTracking: () => void;
  listenForUsers: () => void;
  listenForMessages: () => void;
  listenForMatches: () => void;
  setTyping: (userId: string) => void;
  addReaction: (messageId: string, emoji: string) => void;
  markAsRead: (messageId: string) => void;
  deleteChat: (userId: string) => Promise<void>;
  uploadAvatar: (file: File) => Promise<string>;
  uploadPhoto: (file: File) => Promise<string>;
  deletePhoto: (photoIndex: number) => void;
  updateStatus: (status: string) => void;
  updateProfile: (data: Partial<User>) => void;
  addDemoUsersIfNeeded: () => void;
  
  // Likes and views
  likeUser: (userId: string) => void;
  unlikeUser: (userId: string) => void;
  dislikeUser: (userId: string) => void;
  viewProfile: (userId: string) => void;
  getChatCount: () => number;
  getMatches: () => User[];
  getUnreadCount: () => number;
  showToast: (message: string) => void;
  toastMessage: string | null;
  
  // District methods
  createDistrict: (name: string, description: string, centerLat: number, centerLng: number, radius: number) => Promise<void>;
  joinDistrict: (districtId: string) => Promise<void>;
  leaveDistrict: (districtId: string) => Promise<void>;
  inviteToDistrict: (districtId: string, userId: string) => Promise<void>;
  acceptInvite: (inviteId: string) => Promise<void>;
  rejectInvite: (inviteId: string) => Promise<void>;
  removeMember: (districtId: string, userId: string) => Promise<void>;
  makeAdmin: (districtId: string, userId: string) => Promise<void>;
  setCurrentDistrict: (district: District | null) => void;
  setShowDistricts: (show: boolean) => void;
  listenForDistricts: () => void;
  listenForInvites: () => void;
  
  // Theme
  setTheme: (theme: 'light' | 'dark') => void;
}

const conversationIdFor = (a: string, b: string) => [a, b].sort().join('__');

let locationWatchId: number | null = null;
let usersUnsubscribe: Unsubscribe | null = null;
let messageIndexUnsubscribe: Unsubscribe | null = null;
let matchesUnsubscribe: Unsubscribe | null = null;
const conversationUnsubscribes = new Map<string, Unsubscribe>();

const generateUserId = () => {
  // Verified Telegram/Firebase users always use their authenticated UID.
  if (auth.currentUser?.uid) {
    localStorage.setItem('nearme_user_id', auth.currentUser.uid);
    return auth.currentUser.uid;
  }

  // Legacy fallback is kept temporarily for browser development and migration.
  const stored = localStorage.getItem('nearme_user_id');
  if (stored) return stored;
  const id = 'user_' + Date.now() + '_' + Math.random().toString(36).slice(2, 11);
  localStorage.setItem('nearme_user_id', id);
  return id;
};

export const useStore = create<AppState>((set, get) => ({
  isRegistered: false,
  currentUser: null,
  onlineUsers: [],
  allUsers: [],
  totalUsers: 0,
  districts: [],
  currentDistrict: null,
  invites: [],
  selectedUser: null,
  messages: [],
  matchIds: [],
  showChat: false,
  showProfile: false,
  showFilters: false,
  showFullProfile: false,
  showDistricts: false,
  showChatList: false,
  showAdmin: false,
  showPrivacySettings: false,
  showNotifications: false,
  showEditProfile: false,
  showPremium: false,
  showStories: false,
  storyViewUser: null,
  typingUsers: {},
  toastMessage: null,
  filters: { gender: 'all', ageMin: null, ageMax: null, distanceMax: 50 },
  theme: (localStorage.getItem('nearme_theme') as 'light' | 'dark') || 'light',
  
  register: (userData) => {    const userId = generateUserId();
    const lat = 55.751 + (Math.random() - 0.5) * 0.02;
    const lng = 37.618 + (Math.random() - 0.5) * 0.02;


    const user: User = {
      ...userData,
      id: userId,
      lat,
      lng,
      isOnline: true,
      lastSeen: Date.now(),
    };

    const userRef = ref(db, `users/${userId}`);
    const { blockedUsers = [], ...publicPrivacySettings } = user.privacySettings;
    fbSet(userRef, { ...user, privacySettings: publicPrivacySettings });
    fbSet(ref(db, `privateSettings/${userId}/blockedUsers`), blockedUsers);

    const presenceRef = ref(db, `presence/${userId}`);
    update(presenceRef, { isOnline: true, lastSeen: Date.now() });
    onDisconnect(presenceRef).update({ isOnline: false, lastSeen: Date.now() });

    localStorage.setItem('nearme_registered', 'true');
    localStorage.setItem('nearme_user', JSON.stringify(user));

    set({ isRegistered: true, currentUser: user });
    
    // Demo profiles must never be injected into production data.
    if (import.meta.env.DEV && import.meta.env.VITE_ENABLE_DEMO_USERS === 'true') get().addDemoUsersIfNeeded();
    
    get().listenForUsers();
    get().listenForMessages();
    get().listenForMatches();
    get().listenForDistricts();
    get().listenForInvites();
    get().startLocationTracking();
  },

  addDemoUsersIfNeeded: () => {
    if (usersUnsubscribe) usersUnsubscribe();
    const usersRef = ref(db, 'users');
    usersUnsubscribe = onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      const usersCount = data ? Object.keys(data).length : 0;
      
      // Если мало пользователей, добавляем демо
      if (usersCount < 3) {
        const demoUsers = [
          {
            id: 'demo_alina',
            name: 'Алина',
            age: 22,
            birthDay: 15,
            birthMonth: 8,
            birthYear: 2002,
            gender: 'female',
            bio: 'Люблю кофе и прогулки ☕',
            avatar: '👩‍🦰',
            photoUrl: '',
            photos: [],
            status: 'Ищу компанию',
            city: 'Москва',
            lat: 55.755 + (Math.random() - 0.5) * 0.01,
            lng: 37.620 + (Math.random() - 0.5) * 0.01,
            isOnline: true,
            lastSeen: Date.now(),
            likes: [],
            dislikes: [],
            profileViews: [],
            interests: ['кофе', 'прогулки', 'кино'],
            height: 168,
            zodiac: 'Лев',
            languages: ['Русский', 'English'],
            socialLinks: { instagram: '', vk: '', telegram: '' },
            lookingFor: 'Дружба и общение',
            activityTime: 'Вечером 19:00-22:00',
            verified: false,
            level: 3,
            xp: 150,
            achievements: ['first_chat', '10_likes'],
            isPremium: false,
            privacySettings: { 
              showDistance: true, 
              showLastSeen: true, 
              allowMessages: true,
              visibilityMode: 'online',
              visibilityRadius: 5000,
              blockedUsers: [],
              showOnMap: true,
            },
          },
          {
            id: 'demo_maxim',
            name: 'Максим',
            age: 25,
            birthDay: 3,
            birthMonth: 10,
            birthYear: 1999,
            gender: 'male',
            bio: 'Фотограф 📸',
            avatar: '👨‍🦱',
            photoUrl: '',
            photos: [],
            status: 'На связи',
            city: 'Москва',
            lat: 55.748 + (Math.random() - 0.5) * 0.01,
            lng: 37.615 + (Math.random() - 0.5) * 0.01,
            isOnline: true,
            lastSeen: Date.now(),
            likes: [],
            dislikes: [],
            profileViews: [],
            interests: ['фото', 'путешествия', 'спорт'],
            height: 182,
            zodiac: 'Весы',
            languages: ['Русский'],
            socialLinks: { instagram: '', vk: '', telegram: '' },
            lookingFor: 'Общение',
            activityTime: 'Днём 12:00-15:00',
            verified: false,
            level: 5,
            xp: 320,
            achievements: ['first_chat', '10_likes', 'verified'],
            isPremium: false,
            privacySettings: { 
              showDistance: true, 
              showLastSeen: true, 
              allowMessages: true,
              visibilityMode: 'online',
              visibilityRadius: 5000,
              blockedUsers: [],
              showOnMap: true,
            },
          },
          {
            id: 'demo_darya',
            name: 'Дарья',
            age: 20,
            birthDay: 21,
            birthMonth: 6,
            birthYear: 2004,
            gender: 'female',
            bio: 'Студентка, люблю музыку 🎵',
            avatar: '👩',
            photoUrl: '',
            photos: [],
            status: 'Свободна',
            city: 'Москва',
            lat: 55.760 + (Math.random() - 0.5) * 0.01,
            lng: 37.625 + (Math.random() - 0.5) * 0.01,
            isOnline: true,
            lastSeen: Date.now(),
            likes: [],
            dislikes: [],
            profileViews: [],
            interests: ['музыка', 'танцы', 'искусство'],
            height: 165,
            zodiac: 'Близнецы',
            languages: ['Русский', 'Deutsch'],
            socialLinks: { instagram: '', vk: '', telegram: '' },
            lookingFor: 'Новые знакомства',
            activityTime: 'Вечером 20:00-23:00',
            verified: false,
            level: 2,
            xp: 80,
            achievements: ['first_chat'],
            isPremium: false,
            privacySettings: { 
              showDistance: true, 
              showLastSeen: true, 
              allowMessages: true,
              visibilityMode: 'online',
              visibilityRadius: 5000,
              blockedUsers: [],
              showOnMap: true,
            },
          },
        ];

        demoUsers.forEach(user => {
          const userRef = ref(db, `users/${user.id}`);
          fbSet(userRef, user);
        });
      }
    }, { onlyOnce: true });
  },

  setSelectedUser: (user) => set({ selectedUser: user, showProfile: !!user }),
  setShowChat: (show) => {
    set({ showChat: show });
    if (show) get().listenForMessages();
  },
  setShowProfile: (show) => set({ showProfile: show }),
  setShowFilters: (show) => set({ showFilters: show }),
  setShowFullProfile: (show) => set({ showFullProfile: show }),
  setShowChatList: (show) => set({ showChatList: show }),
  setShowAdmin: (show) => set({ showAdmin: show }),
  setShowPrivacySettings: (show) => set({ showPrivacySettings: show }),
  setShowNotifications: (show) => set({ showNotifications: show }),
  setShowEditProfile: (show) => set({ showEditProfile: show }),
  setShowPremium: (show) => set({ showPremium: show }),
  setShowStories: (show) => set({ showStories: show }),
  setStoryViewUser: (user) => set({ storyViewUser: user }),
  activatePremium: () => {
    const { currentUser } = get();
    if (!currentUser || !import.meta.env.DEV) return;
    const premiumExpiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
    update(ref(db, `users/${currentUser.id}`), { isPremium: true, premiumExpiresAt });
    set({ currentUser: { ...currentUser, isPremium: true, premiumExpiresAt } });
  },
  toggleInvisible: () => {
    const { currentUser } = get();
    if (!currentUser || !currentUser.isPremium) return;
    const isInvisible = !currentUser.isInvisible;
    update(ref(db, `users/${currentUser.id}`), { isInvisible });
    set({ currentUser: { ...currentUser, isInvisible } });
  },
  uploadStory: async (file, type) => {
    const { currentUser } = get();
    if (!currentUser) throw new Error('No user');
    if (type === 'video') throw new Error('Video stories are not enabled yet');
    if (!isValidImageFile(file)) throw new Error('Invalid image');
    const url = await compressImage(file, { maxWidth: 1080, maxHeight: 1920, quality: 0.85, maxSizeMB: 3 });
    const story: Story = {
      id: `story_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      url,
      type,
      createdAt: Date.now(),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      viewedBy: {},
    };
    const stories = [...(currentUser.stories || []).filter(s => s.expiresAt > Date.now()), story];
    await fbSet(ref(db, `users/${currentUser.id}/stories`), stories);
    set({ currentUser: { ...currentUser, stories } });
  },
  viewStory: (userId, storyId) => {
    const { currentUser } = get();
    if (!currentUser || userId === currentUser.id) return;
    fbSet(ref(db, `storyViews/${userId}/${storyId}/${currentUser.id}`), true);
  },

  setFilters: (newFilters) => {
    const current = get().filters;
    set({ filters: { ...current, ...newFilters } });
  },

  resetFilters: () => {
    set({ filters: { gender: 'all', ageMin: null, ageMax: null, distanceMax: 50 } });
  },

  uploadAvatar: async (file: File) => {
    const { currentUser } = get();
    if (!currentUser) throw new Error('No user');

    // Проверяем тип файла
    if (!isValidImageFile(file)) {
      throw new Error('Недопустимый тип файла. Используйте JPEG, PNG, GIF или WebP');
    }

    try {
      // Сжимаем изображение - увеличенные лимиты для лучшего качества
      const compressed = await compressImage(file, {
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 0.85,
        maxSizeMB: 3,
      });

      // Сохраняем в Firebase
      const userRef = ref(db, `users/${currentUser.id}/photoUrl`);
      fbSet(userRef, compressed);

      set({ currentUser: { ...currentUser, photoUrl: compressed } });
      return compressed;
    } catch (error) {
      logError(error, 'uploadAvatar');
      throw new Error('Ошибка при загрузке фото');
    }
  },

  uploadPhoto: async (file: File) => {
    const { currentUser } = get();
    if (!currentUser) throw new Error('No user');
    
    // Rate limiting: максимум 10 загрузок в минуту
    if (!rateLimiter.canPerform('uploadPhoto', 10, 60000)) {
      throw new Error('Слишком много загрузок. Подождите минуту');
    }
    
    if (currentUser.photos && currentUser.photos.length >= 30) {
      throw new Error('Максимум 30 фотографий');
    }

    // Проверяем тип файла
    if (!isValidImageFile(file)) {
      throw new Error('Недопустимый тип файла. Используйте JPEG, PNG, GIF или WebP');
    }

    try {
      // Сжимаем изображение - увеличенные лимиты для лучшего качества
      const compressed = await compressImage(file, {
        maxWidth: 1920,
        maxHeight: 1920,
        quality: 0.9,
        maxSizeMB: 5,
      });

      // Добавляем в массив photos
      const photos = currentUser.photos || [];
      const newPhotos = [...photos, compressed];
      
      const userRef = ref(db, `users/${currentUser.id}/photos`);
      fbSet(userRef, newPhotos);

      // Записываем попытку
      rateLimiter.record('uploadPhoto');

      set({ currentUser: { ...currentUser, photos: newPhotos } });
      return compressed;
    } catch (error) {
      logError(error, 'uploadPhoto');
      throw new Error('Ошибка при загрузке фото');
    }
  },

  deletePhoto: (photoIndex: number) => {
    const { currentUser } = get();
    if (!currentUser) return;

    const photos = currentUser.photos || [];
    const newPhotos = photos.filter((_, idx) => idx !== photoIndex);
    
    const userRef = ref(db, `users/${currentUser.id}/photos`);
    fbSet(userRef, newPhotos);

    set({ currentUser: { ...currentUser, photos: newPhotos } });
  },

  updateStatus: (status: string) => {
    const { currentUser } = get();
    if (!currentUser) return;

    const userRef = ref(db, `users/${currentUser.id}/status`);
    fbSet(userRef, status);

    set({ currentUser: { ...currentUser, status } });
  },

  updateProfile: (data) => {
    const { currentUser } = get();
    if (!currentUser) return;

    const updated = { ...currentUser, ...data };
    const userRef = ref(db, `users/${currentUser.id}`);

    if (data.privacySettings) {
      const { blockedUsers = [], ...publicPrivacySettings } = data.privacySettings;
      update(userRef, { ...data, privacySettings: publicPrivacySettings });
      fbSet(ref(db, `privateSettings/${currentUser.id}/blockedUsers`), blockedUsers);
      fbSet(ref(db, `users/${currentUser.id}/privacySettings/blockedUsers`), null);
    } else {
      update(userRef, data);
    }
    set({ currentUser: updated });

    const previousExact = currentUser.privacySettings?.shareExactLocation === true;
    const nextExact = updated.privacySettings?.shareExactLocation === true;
    if (previousExact !== nextExact) {
      onValue(ref(db, `privateLocations/${currentUser.id}`), snapshot => {
        const exact = snapshot.val() as { lat?: number; lng?: number } | null;
        if (!exact || typeof exact.lat !== 'number' || typeof exact.lng !== 'number') return;
        update(userRef, {
          lat: nextExact ? exact.lat : Math.round(exact.lat * 100) / 100,
          lng: nextExact ? exact.lng : Math.round(exact.lng * 100) / 100,
          locationPrecision: nextExact ? 'exact' : 'coarse',
        });
      }, { onlyOnce: true });
    }
  },

  likeUser: (userId) => {
    const { currentUser, allUsers } = get();
    if (!currentUser || userId === currentUser.id) return;

    // Relationship edges are UID-keyed and private from the public profile document.
    fbSet(ref(db, `likes/${userId}/${currentUser.id}`), true);
    fbSet(ref(db, `outgoingLikes/${currentUser.id}/${userId}`), true);

    const targetUser = allUsers.find(u => u.id === userId);
    if (targetUser) console.log(`[Like] ${currentUser.name} → ${targetUser.name}`);
  },

  unlikeUser: (userId) => {
    const { currentUser } = get();
    if (!currentUser) return;
    update(ref(db), {
      [`likes/${userId}/${currentUser.id}`]: null,
      [`outgoingLikes/${currentUser.id}/${userId}`]: null,
    });
  },

  dislikeUser: (userId) => {
    const { currentUser } = get();
    if (!currentUser || userId === currentUser.id) return;
    fbSet(ref(db, `dislikes/${currentUser.id}/${userId}`), true);
  },

  getMatches: () => {
    const { matchIds, allUsers } = get();
    const ids = new Set(matchIds);
    return allUsers.filter(user => ids.has(user.id));
  },

  listenForMatches: () => {
    const { currentUser } = get();
    if (!currentUser) return;
    if (matchesUnsubscribe) matchesUnsubscribe();
    matchesUnsubscribe = onValue(ref(db, `matches/${currentUser.id}`), snapshot => {
      const data = snapshot.val() || {};
      set({ matchIds: Object.keys(data).filter(uid => data[uid] === true) });
    }, error => logError(error, 'listenForMatches'));
  },

  getUnreadCount: () => {
    const { currentUser, messages } = get();
    if (!currentUser) return 0;

    return messages.filter(m => 
      m.toId === currentUser.id && !m.read
    ).length;
  },

  showToast: (message) => {
    set({ toastMessage: message });
    setTimeout(() => {
      set({ toastMessage: null });
    }, 3000);
  },

  viewProfile: (userId) => {
    const { currentUser } = get();
    if (!currentUser || userId === currentUser.id) return;
    fbSet(ref(db, `profileViews/${userId}/${currentUser.id}`), Date.now());
  },

  getChatCount: () => {
    const { currentUser, messages } = get();
    if (!currentUser) return 0;

    // Подсчитываем уникальные чаты
    const chatPartners = new Set<string>();
    messages.forEach(msg => {
      if (msg.fromId === currentUser.id) {
        chatPartners.add(msg.toId);
      } else if (msg.toId === currentUser.id) {
        chatPartners.add(msg.fromId);
      }
    });

    return chatPartners.size;
  },

  // District methods
  createDistrict: async (name, description, centerLat, centerLng, radius) => {
    const { currentUser } = get();
    if (!currentUser) return;

    const districtId = 'district_' + Date.now();
    const district: District = {
      id: districtId,
      name,
      description,
      centerLat,
      centerLng,
      radius,
      adminId: currentUser.id,
      adminIds: [currentUser.id],
      memberIds: [currentUser.id],
      inviteOnly: true,
      createdAt: Date.now(),
    };

    const districtRef = ref(db, `districts/${districtId}`);
    await fbSet(districtRef, district);
  },

  joinDistrict: async (districtId) => {
    const { currentUser, districts } = get();
    if (!currentUser) return;

    const district = districts.find(d => d.id === districtId);
    if (!district) return;

    if (district.inviteOnly && !district.memberIds.includes(currentUser.id)) {
      return; // Нельзя вступить без приглашения
    }

    const memberRef = ref(db, `districts/${districtId}/memberIds`);
    const newMembers = [...district.memberIds, currentUser.id];
    await fbSet(memberRef, newMembers);
  },

  leaveDistrict: async (districtId) => {
    const { currentUser, districts } = get();
    if (!currentUser) return;

    const district = districts.find(d => d.id === districtId);
    if (!district) return;

    if (district.adminId === currentUser.id) {
      return; // Админ не может покинуть свой район
    }

    const memberRef = ref(db, `districts/${districtId}/memberIds`);
    const newMembers = district.memberIds.filter(id => id !== currentUser.id);
    await fbSet(memberRef, newMembers);
  },

  inviteToDistrict: async (districtId, userId) => {
    const { currentUser, districts } = get();
    if (!currentUser) return;

    const district = districts.find(d => d.id === districtId);
    if (!district) return;

    if (!district.adminIds.includes(currentUser.id)) {
      return; // Только админы могут приглашать
    }

    const inviteId = 'invite_' + Date.now();
    const invite: DistrictInvite = {
      id: inviteId,
      districtId,
      fromUserId: currentUser.id,
      toUserId: userId,
      status: 'pending',
      createdAt: Date.now(),
    };

    const inviteRef = ref(db, `invites/${inviteId}`);
    await fbSet(inviteRef, invite);
  },

  acceptInvite: async (inviteId) => {
    const { currentUser, invites, districts } = get();
    if (!currentUser) return;

    const invite = invites.find(i => i.id === inviteId);
    if (!invite || invite.toUserId !== currentUser.id) return;

    const district = districts.find(d => d.id === invite.districtId);
    if (!district) return;

    // Добавляем в участники
    const memberRef = ref(db, `districts/${invite.districtId}/memberIds`);
    const newMembers = [...district.memberIds, currentUser.id];
    await fbSet(memberRef, newMembers);

    // Обновляем статус приглашения
    const inviteRef = ref(db, `invites/${inviteId}/status`);
    await fbSet(inviteRef, 'accepted');
  },

  rejectInvite: async (inviteId) => {
    const { currentUser, invites } = get();
    if (!currentUser) return;

    const invite = invites.find(i => i.id === inviteId);
    if (!invite || invite.toUserId !== currentUser.id) return;

    const inviteRef = ref(db, `invites/${inviteId}/status`);
    await fbSet(inviteRef, 'rejected');
  },

  removeMember: async (districtId, userId) => {
    const { currentUser, districts } = get();
    if (!currentUser) return;

    const district = districts.find(d => d.id === districtId);
    if (!district) return;

    if (!district.adminIds.includes(currentUser.id)) {
      return; // Только админы могут удалять
    }

    if (district.adminId === userId) {
      return; // Нельзя удалить главного админа
    }

    const memberRef = ref(db, `districts/${districtId}/memberIds`);
    const newMembers = district.memberIds.filter(id => id !== userId);
    await fbSet(memberRef, newMembers);

    // Если удаляемый был админом, убираем его из списка админов
    if (district.adminIds.includes(userId)) {
      const adminRef = ref(db, `districts/${districtId}/adminIds`);
      const newAdmins = district.adminIds.filter(id => id !== userId);
      await fbSet(adminRef, newAdmins);
    }
  },

  makeAdmin: async (districtId, userId) => {
    const { currentUser, districts } = get();
    if (!currentUser) return;

    const district = districts.find(d => d.id === districtId);
    if (!district) return;

    if (district.adminId !== currentUser.id) {
      return; // Только главный админ может назначать админов
    }

    if (!district.memberIds.includes(userId)) {
      return; // Можно назначить админом только участника
    }

    const adminRef = ref(db, `districts/${districtId}/adminIds`);
    const newAdmins = [...district.adminIds, userId];
    await fbSet(adminRef, newAdmins);
  },

  setCurrentDistrict: (district) => set({ currentDistrict: district }),
  setShowDistricts: (show) => set({ showDistricts: show }),

  listenForDistricts: () => {
    const districtsRef = ref(db, 'districts');
    onValue(districtsRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        set({ districts: [] });
        return;
      }

      const districts: District[] = Object.entries(data)
        .map(([id, districtData]) => ({ ...(districtData as District), id }));

      set({ districts });
    });
  },

  listenForInvites: () => {
    const { currentUser } = get();
    if (!currentUser) return;

    const invitesRef = ref(db, 'invites');
    onValue(invitesRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        set({ invites: [] });
        return;
      }

      const invites: DistrictInvite[] = Object.entries(data)
        .map(([id, inviteData]) => ({ ...(inviteData as DistrictInvite), id }))
        .filter(invite => invite.toUserId === currentUser.id && invite.status === 'pending');

      set({ invites });
    });
  },

  sendMessage: async (text) => {
    const { currentUser, selectedUser } = get();
    const trimmed = text.trim();
    if (!currentUser || !selectedUser || !trimmed) return;

    const endpoint = backend.createConversation;
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) {
      throw new Error('Conversation service is not configured');
    }

    const idToken = await firebaseUser.getIdToken();
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ targetUid: selectedUser.id }),
    });
    if (!response.ok) throw new Error(`Conversation creation failed: ${response.status}`);

    const payload = await response.json() as { conversationId?: string };
    const expectedConversationId = conversationIdFor(currentUser.id, selectedUser.id);
    if (payload.conversationId !== expectedConversationId) {
      throw new Error('Conversation service returned an invalid conversation');
    }

    const newMessageRef = push(ref(db, `conversations/${expectedConversationId}/messages`));
    if (!newMessageRef.key) return;

    await fbSet(newMessageRef, {
      fromId: currentUser.id,
      toId: selectedUser.id,
      fromName: currentUser.name,
      fromAvatar: currentUser.avatar,
      fromPhotoUrl: currentUser.photoUrl || '',
      text: trimmed,
      timestamp: Date.now(),
      read: false,
      reactions: {},
    });
  },

  setTyping: (userId) => {
    const { typingUsers } = get();
    const updated = { ...typingUsers, [userId]: Date.now() };
    set({ typingUsers: updated });
    
    // Убираем статус через 3 секунды
    setTimeout(() => {
      const current = get().typingUsers;
      if (current[userId] && Date.now() - current[userId] >= 3000) {
        const newTyping = { ...current };
        delete newTyping[userId];
        set({ typingUsers: newTyping });
      }
    }, 3500);
  },

  addReaction: (messageId, emoji) => {
    const { currentUser, messages } = get();
    if (!currentUser) return;
    const message = messages.find(m => m.id === messageId);
    if (!message) return;
    const conversationId = conversationIdFor(message.fromId, message.toId);
    const reactionRef = ref(db, `conversations/${conversationId}/messages/${messageId}/reactions/${emoji}/${currentUser.id}`);
    onValue(reactionRef, snapshot => fbSet(reactionRef, snapshot.exists() ? null : true), { onlyOnce: true });
  },

  markAsRead: (messageId) => {
    const { currentUser, messages } = get();
    if (!currentUser) return;
    const message = messages.find(m => m.id === messageId);
    if (!message || message.toId !== currentUser.id) return;
    const conversationId = conversationIdFor(message.fromId, message.toId);
    fbSet(ref(db, `conversations/${conversationId}/messages/${messageId}/read`), true);
  },

  deleteChat: async (userId) => {
    const { currentUser, messages } = get();
    if (!currentUser) return;
    const conversationId = conversationIdFor(currentUser.id, userId);

    // Hide the conversation only for the current user; never erase the other participant's history.
    await fbSet(ref(db, `userConversations/${currentUser.id}/${conversationId}`), null);
    const updatedMessages = messages.filter(m =>
      !((m.fromId === currentUser.id && m.toId === userId) ||
        (m.fromId === userId && m.toId === currentUser.id))
    );
    set({ messages: updatedMessages });
  },

  updateLocation: (lat, lng) => {
    const { currentUser } = get();
    if (!currentUser) return;

    // Exact coordinates are owner-only. Public map gets deliberately coarse coordinates (~1 km grid).
    const exactLocationRef = ref(db, `privateLocations/${currentUser.id}`);
    update(exactLocationRef, { lat, lng, updatedAt: Date.now() });
    const shareExactLocation = currentUser.privacySettings?.shareExactLocation === true;
    const publicLat = shareExactLocation ? lat : Math.round(lat * 100) / 100;
    const publicLng = shareExactLocation ? lng : Math.round(lng * 100) / 100;
    update(ref(db, `users/${currentUser.id}`), {
      lat: publicLat,
      lng: publicLng,
      locationPrecision: shareExactLocation ? 'exact' : 'coarse',
    });
    update(ref(db, `presence/${currentUser.id}`), { isOnline: true, lastSeen: Date.now() });
    
    set({ 
      currentUser: { ...currentUser, lat, lng },
    });
  },

  startLocationTracking: () => {
    if (!navigator.geolocation) return;

    if (locationWatchId !== null) navigator.geolocation.clearWatch(locationWatchId);
    locationWatchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        get().updateLocation(latitude, longitude);
      },
      () => {},
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );
  },

  listenForUsers: () => {
    if (usersUnsubscribe) usersUnsubscribe();
    const usersRef = ref(db, 'users');
    const presenceRef = ref(db, 'presence');

    usersUnsubscribe = onValue(usersRef, (snapshot) => {
      const data = snapshot.val() || {};
      onValue(presenceRef, (presenceSnapshot) => {
        try {
          const presence = presenceSnapshot.val() || {};
          const allUsers: User[] = Object.entries(data).map(([id, userData]) => {
            const state = presence[id] || {};
            return {
              ...(userData as User),
              id,
              isOnline: state.isOnline === true,
              lastSeen: Number(state.lastSeen || 0),
            };
          });

          const onlineUsers = allUsers
            .filter(u => u.id !== get().currentUser?.id)
            .filter(u => u.isOnline && Date.now() - u.lastSeen < 30 * 60 * 1000)
            .filter(u => (u.privacySettings?.visibilityMode || 'online') === 'online')
            .filter(u => u.privacySettings?.showOnMap !== false);

          set({ onlineUsers, allUsers, totalUsers: allUsers.length });
        } catch (error) {
          logError(error, 'listenForUsers/presence');
        }
      }, error => logError(error, 'listenForPresence'), { onlyOnce: true });
    }, error => logError(error, 'listenForUsers'));
  },

  listenForMessages: () => {
    const { currentUser } = get();
    if (!currentUser) return;

    if (messageIndexUnsubscribe) messageIndexUnsubscribe();
    conversationUnsubscribes.forEach(unsubscribe => unsubscribe());
    conversationUnsubscribes.clear();

    const indexRef = ref(db, `userConversations/${currentUser.id}`);
    let previousMessages: Message[] = [];
    let isFirstLoad = true;
    const conversationMessages = new Map<string, Message[]>();

    messageIndexUnsubscribe = onValue(indexRef, (indexSnapshot) => {
      const conversationIds = Object.keys(indexSnapshot.val() || {});
      const activeIds = new Set(conversationIds);
      conversationUnsubscribes.forEach((unsubscribe, id) => {
        if (!activeIds.has(id)) {
          unsubscribe();
          conversationUnsubscribes.delete(id);
          conversationMessages.delete(id);
        }
      });
      if (conversationIds.length === 0) {
        set({ messages: [] });
        return;
      }

      conversationIds.forEach((conversationId) => {
        if (conversationUnsubscribes.has(conversationId)) return;
        const messagesRef = ref(db, `conversations/${conversationId}/messages`);
        const unsubscribe = onValue(messagesRef, (snapshot) => {
          const data = snapshot.val() || {};
          const items: Message[] = Object.entries(data)
            .map(([id, msgData]) => ({ ...(msgData as Message), id }))
            .filter(m => m.fromId === currentUser.id || m.toId === currentUser.id);
          conversationMessages.set(conversationId, items);

          const allMessages = Array.from(conversationMessages.values())
            .flat()
            .sort((a, b) => a.timestamp - b.timestamp);

          if (!isFirstLoad) {
            allMessages
              .filter(m => !previousMessages.some(pm => pm.id === m.id) && m.toId === currentUser.id && !m.read)
              .forEach(msg => {
                const sender = get().allUsers.find(u => u.id === msg.fromId);
                if (sender) notifyNewMessage(sender.name, msg.text, sender.id);
              });
          }

          isFirstLoad = false;
          previousMessages = allMessages;
          set({ messages: allMessages });
        }, error => logError(error, 'listenForConversationMessages'));
        conversationUnsubscribes.set(conversationId, unsubscribe);
      });
    }, error => logError(error, 'listenForConversationIndex'));
  },

  setTheme: (theme) => {
    localStorage.setItem('nearme_theme', theme);
    set({ theme });
  },
}));

// Restore the local UI profile only when it belongs to the verified Firebase session.
// Firebase Auth persistence is authoritative; localStorage is never an identity credential.
auth.onAuthStateChanged((firebaseUser) => {
  const storedRegistered = localStorage.getItem('nearme_registered');
  const storedUser = localStorage.getItem('nearme_user');
  if (!firebaseUser || storedRegistered !== 'true' || !storedUser) return;

  try {
    const cachedUser = JSON.parse(storedUser) as User;
    if (cachedUser.id !== firebaseUser.uid) {
      localStorage.removeItem('nearme_registered');
      localStorage.removeItem('nearme_user');
      return;
    }

    const userRef = ref(db, `users/${firebaseUser.uid}`);
    onValue(userRef, (snapshot) => {
      const firebaseProfile = snapshot.val();
      if (!firebaseProfile) return;

      onValue(ref(db, `privateSettings/${firebaseUser.uid}/blockedUsers`), privateSnapshot => {
        const privateBlocked = privateSnapshot.val();
        const legacyBlocked = firebaseProfile.privacySettings?.blockedUsers;
        const blockedUsers = Array.isArray(privateBlocked)
          ? privateBlocked
          : Array.isArray(legacyBlocked)
            ? legacyBlocked
            : [];

        const now = Date.now();
        const updatedUser = {
          ...cachedUser,
          ...firebaseProfile,
          id: firebaseUser.uid,
          isOnline: true,
          lastSeen: now,
          privacySettings: {
            ...cachedUser.privacySettings,
            ...firebaseProfile.privacySettings,
            blockedUsers,
          },
        };
        const presenceRef = ref(db, `presence/${firebaseUser.uid}`);
        update(presenceRef, { isOnline: true, lastSeen: now });
        useStore.setState({ currentUser: updatedUser, isRegistered: true });
        localStorage.setItem('nearme_user', JSON.stringify(updatedUser));

        if (Array.isArray(legacyBlocked)) {
          fbSet(ref(db, `privateSettings/${firebaseUser.uid}/blockedUsers`), legacyBlocked);
          fbSet(ref(db, `users/${firebaseUser.uid}/privacySettings/blockedUsers`), null);
        }

        onDisconnect(presenceRef).update({ isOnline: false, lastSeen: Date.now() });
        useStore.getState().listenForUsers();
        useStore.getState().listenForMessages();
        useStore.getState().listenForMatches();
        useStore.getState().listenForDistricts();
        useStore.getState().listenForInvites();
        useStore.getState().startLocationTracking();
      }, { onlyOnce: true });
    }, { onlyOnce: true });
  } catch {
    localStorage.removeItem('nearme_registered');
    localStorage.removeItem('nearme_user');
  }
});
