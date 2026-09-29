import { create } from 'zustand';
import { ref as dbRef, set as fbSet, onValue, push, update, onDisconnect } from 'firebase/database';
import { db } from './firebase';
import { uploadImageToImgBB, uploadVideoToImgBB } from './imgbb';

export interface Photo {
  id: string;
  url: string;
  order: number;
}

export interface Story {
  id: string;
  url: string;
  type: 'video' | 'image';
  createdAt: number;
  expiresAt: number; // 24 часа
  views: string[]; // ID тех кто посмотрел
}

export interface User {
  id: string;
  name: string;
  age: number;
  gender: 'male' | 'female';
  bio: string;
  avatar: string;
  photos: Photo[];
  stories: Story[];
  interests: string[];
  lat: number;
  lng: number;
  isOnline: boolean;
  lastSeen: number;
  isPremium: boolean;
  premiumExpiresAt: number | null;
  isInvisible: boolean; // невидимка для premium
}

export interface Message {
  id: string;
  fromId: string;
  toId: string;
  fromName: string;
  text: string;
  timestamp: number;
  read: boolean;
}

export interface Filters {
  gender: 'all' | 'male' | 'female';
  ageMin: number;
  ageMax: number;
  distanceMax: number; // в км
}

export type ThemeMode = 'light' | 'dark' | 'system';

interface AppState {
  // Auth
  isRegistered: boolean;
  currentUser: User | null;
  
  // Users
  onlineUsers: User[];
  
  // Chat
  selectedUser: User | null;
  messages: Message[];
  showChat: boolean;
  showProfile: boolean;
  showEditProfile: boolean;
  showStories: boolean;
  showFilters: boolean;
  showPremium: boolean;
  storyViewUser: User | null;
  
  // Filters & Theme
  filters: Filters;
  theme: ThemeMode;
  
  // Geo
  userLocation: { lat: number; lng: number } | null;
  locationError: string | null;
  
  // Actions
  register: (user: Omit<User, 'id' | 'lat' | 'lng' | 'isOnline' | 'lastSeen' | 'photos' | 'stories' | 'interests' | 'isPremium' | 'premiumExpiresAt' | 'isInvisible'>) => void;
  setSelectedUser: (user: User | null) => void;
  setShowChat: (show: boolean) => void;
  setShowProfile: (show: boolean) => void;
  setShowEditProfile: (show: boolean) => void;
  setShowStories: (show: boolean) => void;
  setShowFilters: (show: boolean) => void;
  setShowPremium: (show: boolean) => void;
  setStoryViewUser: (user: User | null) => void;
  sendMessage: (text: string) => void;
  updateLocation: (lat: number, lng: number) => void;
  startLocationTracking: () => void;
  listenForUsers: () => void;
  listenForMessages: () => void;
  goOffline: () => void;
  
  // Photo actions
  uploadPhoto: (file: File) => Promise<string>;
  deletePhoto: (photoId: string) => Promise<void>;
  updateProfile: (data: Partial<User>) => void;
  
  // Story actions
  uploadStory: (file: File, type: 'video' | 'image') => Promise<string>;
  deleteStory: (storyId: string) => Promise<void>;
  viewStory: (userId: string, storyId: string) => void;
  
  // Filter actions
  setFilters: (filters: Partial<Filters>) => void;
  resetFilters: () => void;
  
  // Theme
  setTheme: (theme: ThemeMode) => void;
  
  // Premium
  activatePremium: () => void;
  toggleInvisible: () => void;
}

const DEFAULT_FILTERS: Filters = {
  gender: 'all',
  ageMin: 14,
  ageMax: 99,
  distanceMax: 50,
};

const generateUserId = () => {
  const stored = localStorage.getItem('nearme_user_id');
  if (stored) return stored;
  const id = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  localStorage.setItem('nearme_user_id', id);
  return id;
};

export const useStore = create<AppState>((set, get) => ({
  isRegistered: false,
  currentUser: null,
  onlineUsers: [],
  selectedUser: null,
  messages: [],
  showChat: false,
  showProfile: false,
  showEditProfile: false,
  showStories: false,
  showFilters: false,
  showPremium: false,
  storyViewUser: null,
  filters: DEFAULT_FILTERS,
  theme: (localStorage.getItem('nearme_theme') as ThemeMode) || 'system',
  userLocation: null,
  locationError: null,

  register: (userData) => {
    const userId = generateUserId();
    const { userLocation } = get();
    
    const lat = userLocation?.lat || 55.751 + (Math.random() - 0.5) * 0.02;
    const lng = userLocation?.lng || 37.618 + (Math.random() - 0.5) * 0.02;

    const user: User = {
      ...userData,
      id: userId,
      lat,
      lng,
      isOnline: true,
      lastSeen: Date.now(),
      photos: [],
      stories: [],
      interests: [],
      isPremium: false,
      premiumExpiresAt: null,
      isInvisible: false,
    };

    const userDbRef = dbRef(db, `users/${userId}`);
    fbSet(userDbRef, user);

    onDisconnect(userDbRef).update({
      isOnline: false,
      lastSeen: Date.now(),
    });

    const connectedRef = dbRef(db, '.info/connected');
    onValue(connectedRef, (snap) => {
      if (snap.val() === true) {
        update(userDbRef, { isOnline: true, lastSeen: Date.now() });
      }
    });

    localStorage.setItem('nearme_registered', 'true');
    localStorage.setItem('nearme_user', JSON.stringify(user));

    set({ isRegistered: true, currentUser: user });
    get().listenForUsers();
    get().startLocationTracking();
  },

  setSelectedUser: (user) => set({ selectedUser: user, showProfile: !!user }),
  setShowChat: (show) => {
    set({ showChat: show });
    if (show) get().listenForMessages();
  },
  setShowProfile: (show) => set({ showProfile: show }),
  setShowEditProfile: (show) => set({ showEditProfile: show }),
  setShowStories: (show) => set({ showStories: show }),
  setShowFilters: (show) => set({ showFilters: show }),
  setShowPremium: (show) => set({ showPremium: show }),
  setStoryViewUser: (user) => set({ storyViewUser: user }),

  sendMessage: (text) => {
    const { currentUser, selectedUser } = get();
    if (!currentUser || !selectedUser) return;

    const messagesRef = dbRef(db, 'messages');
    const newMessageRef = push(messagesRef);
    
    fbSet(newMessageRef, {
      fromId: currentUser.id,
      toId: selectedUser.id,
      fromName: currentUser.name,
      text,
      timestamp: Date.now(),
      read: false,
    });
  },

  updateLocation: (lat, lng) => {
    const { currentUser } = get();
    if (!currentUser) return;

    const userDbRef = dbRef(db, `users/${currentUser.id}`);
    update(userDbRef, { lat, lng, lastSeen: Date.now() });
    
    set({ 
      currentUser: { ...currentUser, lat, lng },
      userLocation: { lat, lng }
    });
  },

  startLocationTracking: () => {
    if (!navigator.geolocation) {
      set({ locationError: 'Геолокация не поддерживается' });
      return;
    }

    navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        get().updateLocation(latitude, longitude);
        set({ locationError: null });
      },
      (error) => {
        let errorMsg = 'Не удалось получить местоположение';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMsg = 'Доступ к геолокации запрещён';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMsg = 'Информация о местоположении недоступна';
            break;
          case error.TIMEOUT:
            errorMsg = 'Превышено время ожидания';
            break;
        }
        set({ locationError: errorMsg });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );
  },

  listenForUsers: () => {
    const usersRef = dbRef(db, 'users');
    onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        set({ onlineUsers: [] });
        return;
      }

      const users: User[] = Object.entries(data)
        .map(([id, userData]) => ({ ...(userData as User), id }))
        .filter(u => u.isOnline && u.id !== get().currentUser?.id)
        .filter(u => Date.now() - u.lastSeen < 5 * 60 * 1000);

      set({ onlineUsers: users });
    });
  },

  listenForMessages: () => {
    const { currentUser, selectedUser } = get();
    if (!currentUser || !selectedUser) return;

    const messagesRef = dbRef(db, 'messages');
    onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        set({ messages: [] });
        return;
      }

      const allMessages: Message[] = Object.entries(data)
        .map(([id, msgData]) => ({ ...(msgData as Message), id }))
        .filter(m => 
          (m.fromId === currentUser.id && m.toId === selectedUser.id) ||
          (m.fromId === selectedUser.id && m.toId === currentUser.id)
        )
        .sort((a, b) => a.timestamp - b.timestamp);

      set({ messages: allMessages });

      Object.entries(data).forEach(([id, msgData]) => {
        const msg = msgData as Message;
        if (msg.fromId === selectedUser.id && msg.toId === currentUser.id && !msg.read) {
          update(dbRef(db, `messages/${id}`), { read: true });
        }
      });
    });
  },

  goOffline: () => {
    const { currentUser } = get();
    if (!currentUser) return;
    const userDbRef = dbRef(db, `users/${currentUser.id}`);
    update(userDbRef, { isOnline: false, lastSeen: Date.now() });
  },

  // Photo actions - используем ImgBB
  uploadPhoto: async (file: File) => {
    const { currentUser } = get();
    if (!currentUser) throw new Error('No user');

    // Загружаем на ImgBB
    const url = await uploadImageToImgBB(file);
    const photoId = 'photo_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

    const newPhoto: Photo = {
      id: photoId,
      url,
      order: currentUser.photos.length,
    };

    const updatedPhotos = [...currentUser.photos, newPhoto];
    const userDbRef = dbRef(db, `users/${currentUser.id}`);
    update(userDbRef, { photos: updatedPhotos });
    
    set({ currentUser: { ...currentUser, photos: updatedPhotos } });
    return url;
  },

  deletePhoto: async (photoId: string) => {
    const { currentUser } = get();
    if (!currentUser) return;

    const updatedPhotos = currentUser.photos.filter(p => p.id !== photoId);
    const userDbRef = dbRef(db, `users/${currentUser.id}`);
    update(userDbRef, { photos: updatedPhotos });
    
    set({ currentUser: { ...currentUser, photos: updatedPhotos } });
  },

  updateProfile: (data) => {
    const { currentUser } = get();
    if (!currentUser) return;

    const updated = { ...currentUser, ...data };
    const userDbRef = dbRef(db, `users/${currentUser.id}`);
    update(userDbRef, data);
    
    set({ currentUser: updated });
    localStorage.setItem('nearme_user', JSON.stringify(updated));
  },

  // Story actions - используем ImgBB для изображений, base64 для видео
  uploadStory: async (file: File, type: 'video' | 'image') => {
    const { currentUser } = get();
    if (!currentUser) throw new Error('No user');

    let url: string;
    
    if (type === 'image') {
      // Изображения загружаем на ImgBB
      url = await uploadImageToImgBB(file);
    } else {
      // Видео хранятся как base64 (ограничение 5MB)
      url = await uploadVideoToImgBB(file);
    }

    const storyId = 'story_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

    const newStory: Story = {
      id: storyId,
      url,
      type,
      createdAt: Date.now(),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 часа
      views: [],
    };

    const updatedStories = [...currentUser.stories, newStory];
    const userDbRef = dbRef(db, `users/${currentUser.id}`);
    update(userDbRef, { stories: updatedStories });
    
    set({ currentUser: { ...currentUser, stories: updatedStories } });
    return url;
  },

  deleteStory: async (storyId: string) => {
    const { currentUser } = get();
    if (!currentUser) return;

    const updatedStories = currentUser.stories.filter(s => s.id !== storyId);
    const userDbRef = dbRef(db, `users/${currentUser.id}`);
    update(userDbRef, { stories: updatedStories });
    
    set({ currentUser: { ...currentUser, stories: updatedStories } });
  },

  viewStory: (userId: string, storyId: string) => {
    const { currentUser, onlineUsers } = get();
    if (!currentUser) return;

    const user = onlineUsers.find(u => u.id === userId);
    if (!user) return;

    const story = user.stories.find(s => s.id === storyId);
    if (!story) return;

    if (!story.views.includes(currentUser.id)) {
      const updatedViews = [...story.views, currentUser.id];
      update(dbRef(db, `users/${userId}/stories`), {
        [storyId]: { ...story, views: updatedViews }
      });
    }
  },

  // Filter actions
  setFilters: (filters) => {
    const current = get().filters;
    const updated = { ...current, ...filters };
    set({ filters: updated });
    localStorage.setItem('nearme_filters', JSON.stringify(updated));
  },

  resetFilters: () => {
    set({ filters: DEFAULT_FILTERS });
    localStorage.removeItem('nearme_filters');
  },

  // Theme
  setTheme: (theme) => {
    set({ theme });
    localStorage.setItem('nearme_theme', theme);
    
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    
    if (theme === 'system') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.add(isDark ? 'dark' : 'light');
    } else {
      root.classList.add(theme);
    }
  },

  // Premium
  activatePremium: () => {
    const { currentUser } = get();
    if (!currentUser) return;

    const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 дней
    const userDbRef = dbRef(db, `users/${currentUser.id}`);
    update(userDbRef, { isPremium: true, premiumExpiresAt: expiresAt });
    
    set({ currentUser: { ...currentUser, isPremium: true, premiumExpiresAt: expiresAt } });
  },

  toggleInvisible: () => {
    const { currentUser } = get();
    if (!currentUser || !currentUser.isPremium) return;

    const newInvisible = !currentUser.isInvisible;
    const userDbRef = dbRef(db, `users/${currentUser.id}`);
    update(userDbRef, { isInvisible: newInvisible });
    
    set({ currentUser: { ...currentUser, isInvisible: newInvisible } });
  },
}));

// Restore session
try {
  const storedRegistered = localStorage.getItem('nearme_registered');
  const storedUser = localStorage.getItem('nearme_user');
  const storedFilters = localStorage.getItem('nearme_filters');

  if (storedFilters) {
    try {
      useStore.setState({ filters: JSON.parse(storedFilters) });
    } catch (e) {}
  }

  if (storedRegistered === 'true' && storedUser && db) {
    try {
      const user = JSON.parse(storedUser) as User;
      const userDbRef = dbRef(db, `users/${user.id}`);
      fbSet(userDbRef, { ...user, isOnline: true, lastSeen: Date.now() });
      
      onDisconnect(userDbRef).update({
        isOnline: false,
        lastSeen: Date.now(),
      });

      useStore.setState({ isRegistered: true, currentUser: user });
      
      setTimeout(() => {
        useStore.getState().listenForUsers();
        useStore.getState().startLocationTracking();
      }, 100);
    } catch (e) {
      console.error('Session restore error:', e);
      // Если Firebase не отвечает — просто покажем экран регистрации
      localStorage.removeItem('nearme_registered');
      localStorage.removeItem('nearme_user');
    }
  } else if (storedRegistered === 'true' && storedUser && !db) {
    // Firebase не инициализирован — сбрасываем сессию
    localStorage.removeItem('nearme_registered');
    localStorage.removeItem('nearme_user');
  }
} catch (e) {
  console.error('Restore error:', e);
}
