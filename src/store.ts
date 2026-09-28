import { create } from 'zustand';
import { ref, set as fbSet, onValue, push, update, remove, onDisconnect, serverTimestamp } from 'firebase/database';
import { db } from './firebase';

export interface User {
  id: string;
  name: string;
  age: number;
  gender: 'male' | 'female';
  bio: string;
  avatar: string;
  lat: number;
  lng: number;
  isOnline: boolean;
  lastSeen: number;
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
  
  // Geo
  userLocation: { lat: number; lng: number } | null;
  locationError: string | null;
  
  // Actions
  register: (user: Omit<User, 'id' | 'lat' | 'lng' | 'isOnline' | 'lastSeen'>) => void;
  setSelectedUser: (user: User | null) => void;
  setShowChat: (show: boolean) => void;
  setShowProfile: (show: boolean) => void;
  sendMessage: (text: string) => void;
  updateLocation: (lat: number, lng: number) => void;
  startLocationTracking: () => void;
  listenForUsers: () => void;
  listenForMessages: () => void;
  goOffline: () => void;
}

// Generate unique user ID
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
  userLocation: null,
  locationError: null,

  register: (userData) => {
    const { userLocation } = get();
    
    const lat = userLocation?.lat || 55.751 + (Math.random() - 0.5) * 0.02;
    const lng = userLocation?.lng || 37.618 + (Math.random() - 0.5) * 0.02;

    // Используем Telegram ID если доступен
    const telegramUser = (window as any).Telegram?.WebApp?.initDataUnsafe?.user;
    const userId = telegramUser?.id?.toString() || generateUserId();

    const user: User = {
      ...userData,
      id: userId,
      lat,
      lng,
      isOnline: true,
      lastSeen: Date.now(),
    };

    // Save to Firebase
    const userRef = ref(db, `users/${userId}`);
    fbSet(userRef, user);

    // Set offline on disconnect
    onDisconnect(userRef).update({
      isOnline: false,
      lastSeen: Date.now(),
    });

    // Update presence
    const connectedRef = ref(db, '.info/connected');
    onValue(connectedRef, (snap) => {
      if (snap.val() === true) {
        update(userRef, { isOnline: true, lastSeen: Date.now() });
      }
    });

    // Save to localStorage for persistence
    localStorage.setItem('nearme_registered', 'true');
    localStorage.setItem('nearme_user', JSON.stringify(user));

    set({ isRegistered: true, currentUser: user });

    // Start listening for other users
    get().listenForUsers();
    get().startLocationTracking();
  },

  setSelectedUser: (user) => set({ selectedUser: user, showProfile: !!user }),
  setShowChat: (show) => {
    set({ showChat: show });
    if (show) {
      get().listenForMessages();
    }
  },
  setShowProfile: (show) => set({ showProfile: show }),

  sendMessage: (text) => {
    const { currentUser, selectedUser } = get();
    if (!currentUser || !selectedUser) return;

    const messagesRef = ref(db, 'messages');
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

    const userRef = ref(db, `users/${currentUser.id}`);
    update(userRef, { lat, lng, lastSeen: Date.now() });
    
    set({ 
      currentUser: { ...currentUser, lat, lng },
      userLocation: { lat, lng }
    });
  },

  startLocationTracking: () => {
    if (!navigator.geolocation) {
      set({ locationError: 'Геолокация не поддерживается браузером' });
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
            errorMsg = 'Доступ к геолокации запрещён. Разрешите в настройках браузера.';
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
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
      }
    );
  },

  listenForUsers: () => {
    const usersRef = ref(db, 'users');
    onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        set({ onlineUsers: [] });
        return;
      }

      const users: User[] = Object.entries(data)
        .map(([id, userData]) => ({
          ...(userData as User),
          id,
        }))
        .filter(u => u.isOnline && u.id !== get().currentUser?.id)
        .filter(u => {
          // Only show users seen in last 5 minutes
          return Date.now() - u.lastSeen < 5 * 60 * 1000;
        });

      set({ onlineUsers: users });
    });
  },

  listenForMessages: () => {
    const { currentUser, selectedUser } = get();
    if (!currentUser || !selectedUser) return;

    const messagesRef = ref(db, 'messages');
    onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        set({ messages: [] });
        return;
      }

      const allMessages: Message[] = Object.entries(data)
        .map(([id, msgData]) => ({
          ...(msgData as Message),
          id,
        }))
        .filter(m => 
          (m.fromId === currentUser.id && m.toId === selectedUser.id) ||
          (m.fromId === selectedUser.id && m.toId === currentUser.id)
        )
        .sort((a, b) => a.timestamp - b.timestamp);

      set({ messages: allMessages });

      // Mark messages as read
      Object.entries(data).forEach(([id, msgData]) => {
        const msg = msgData as Message;
        if (msg.fromId === selectedUser.id && msg.toId === currentUser.id && !msg.read) {
          update(ref(db, `messages/${id}`), { read: true });
        }
      });
    });
  },

  goOffline: () => {
    const { currentUser } = get();
    if (!currentUser) return;
    const userRef = ref(db, `users/${currentUser.id}`);
    update(userRef, { isOnline: false, lastSeen: Date.now() });
  },
}));

// Restore session on load
const storedRegistered = localStorage.getItem('nearme_registered');
const storedUser = localStorage.getItem('nearme_user');
if (storedRegistered === 'true' && storedUser) {
  try {
    const user = JSON.parse(storedUser) as User;
    // Re-register in Firebase
    const userRef = ref(db, `users/${user.id}`);
    fbSet(userRef, { ...user, isOnline: true, lastSeen: Date.now() });
    
    onDisconnect(userRef).update({
      isOnline: false,
      lastSeen: Date.now(),
    });

    useStore.setState({ 
      isRegistered: true, 
      currentUser: user 
    });
    
    // Start listening
    setTimeout(() => {
      useStore.getState().listenForUsers();
      useStore.getState().startLocationTracking();
    }, 100);
  } catch (e) {
    localStorage.removeItem('nearme_registered');
    localStorage.removeItem('nearme_user');
  }
}
