import { create } from 'zustand';
import { ref, set as fbSet, onValue, push, update, onDisconnect } from 'firebase/database';
import { db } from './firebase';

export interface User {
  id: string;
  name: string;
  age: number;
  gender: 'male' | 'female';
  bio: string;
  avatar: string; // emoji fallback
  photoUrl: string; // реальное фото (URL)
  status: string; // статус под фото
  lat: number;
  lng: number;
  isOnline: boolean;
  lastSeen: number;
}

export interface Message {
  id: string;
  fromId: string;
  toId: string;
  text: string;
  timestamp: number;
}

export interface Filters {
  gender: 'all' | 'male' | 'female';
  ageMin: number;
  ageMax: number;
  distanceMax: number;
}

interface AppState {
  isRegistered: boolean;
  currentUser: User | null;
  onlineUsers: User[];
  selectedUser: User | null;
  messages: Message[];
  showChat: boolean;
  showProfile: boolean;
  showFilters: boolean;
  showFullProfile: boolean;
  filters: Filters;
  
  register: (user: Omit<User, 'id' | 'lat' | 'lng' | 'isOnline' | 'lastSeen'>) => void;
  setSelectedUser: (user: User | null) => void;
  setShowChat: (show: boolean) => void;
  setShowProfile: (show: boolean) => void;
  setShowFilters: (show: boolean) => void;
  setShowFullProfile: (show: boolean) => void;
  setFilters: (filters: Partial<Filters>) => void;
  resetFilters: () => void;
  sendMessage: (text: string) => void;
  updateLocation: (lat: number, lng: number) => void;
  startLocationTracking: () => void;
  listenForUsers: () => void;
  listenForMessages: () => void;
  uploadAvatar: (file: File) => Promise<string>;
  updateStatus: (status: string) => void;
  updateProfile: (data: Partial<User>) => void;
}

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
  showFilters: false,
  showFullProfile: false,
  filters: { gender: 'all', ageMin: 14, ageMax: 99, distanceMax: 50 },

  register: (userData) => {
    const userId = generateUserId();
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
    fbSet(userRef, user);

    onDisconnect(userRef).update({
      isOnline: false,
      lastSeen: Date.now(),
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
  setShowFilters: (show) => set({ showFilters: show }),
  setShowFullProfile: (show) => set({ showFullProfile: show }),

  setFilters: (newFilters) => {
    const current = get().filters;
    set({ filters: { ...current, ...newFilters } });
  },

  resetFilters: () => {
    set({ filters: { gender: 'all', ageMin: 14, ageMax: 99, distanceMax: 50 } });
  },

  uploadAvatar: async (file: File) => {
    const { currentUser } = get();
    if (!currentUser) throw new Error('No user');

    // Конвертируем файл в base64
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });

    // Сохраняем в Firebase
    const userRef = ref(db, `users/${currentUser.id}/photoUrl`);
    fbSet(userRef, base64);

    set({ currentUser: { ...currentUser, photoUrl: base64 } });
    return base64;
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
    update(userRef, data);

    set({ currentUser: updated });
  },

  sendMessage: (text) => {
    const { currentUser, selectedUser } = get();
    if (!currentUser || !selectedUser) return;

    const messagesRef = ref(db, 'messages');
    const newMessageRef = push(messagesRef);
    
    fbSet(newMessageRef, {
      fromId: currentUser.id,
      toId: selectedUser.id,
      text,
      timestamp: Date.now(),
    });
  },

  updateLocation: (lat, lng) => {
    const { currentUser } = get();
    if (!currentUser) return;

    const userRef = ref(db, `users/${currentUser.id}`);
    update(userRef, { lat, lng, lastSeen: Date.now() });
    
    set({ 
      currentUser: { ...currentUser, lat, lng },
    });
  },

  startLocationTracking: () => {
    if (!navigator.geolocation) return;

    navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        get().updateLocation(latitude, longitude);
      },
      () => {},
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
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
        .map(([id, userData]) => ({ ...(userData as User), id }))
        .filter(u => u.isOnline && u.id !== get().currentUser?.id)
        .filter(u => Date.now() - u.lastSeen < 5 * 60 * 1000);

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
        .map(([id, msgData]) => ({ ...(msgData as Message), id }))
        .filter(m => 
          (m.fromId === currentUser.id && m.toId === selectedUser.id) ||
          (m.fromId === selectedUser.id && m.toId === currentUser.id)
        )
        .sort((a, b) => a.timestamp - b.timestamp);

      set({ messages: allMessages });
    });
  },
}));

// Restore session
const storedRegistered = localStorage.getItem('nearme_registered');
const storedUser = localStorage.getItem('nearme_user');

if (storedRegistered === 'true' && storedUser) {
  try {
    const user = JSON.parse(storedUser) as User;
    const userRef = ref(db, `users/${user.id}`);
    fbSet(userRef, { ...user, isOnline: true, lastSeen: Date.now() });
    
    onDisconnect(userRef).update({
      isOnline: false,
      lastSeen: Date.now(),
    });

    useStore.setState({ isRegistered: true, currentUser: user });
    
    setTimeout(() => {
      useStore.getState().listenForUsers();
      useStore.getState().startLocationTracking();
    }, 100);
  } catch (e) {
    localStorage.removeItem('nearme_registered');
    localStorage.removeItem('nearme_user');
  }
}
