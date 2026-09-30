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
  city: string; // город
  lat: number;
  lng: number;
  isOnline: boolean;
  lastSeen: number;
  likes: string[]; // кто лайкнул
  dislikes: string[]; // антипатия
  profileViews: string[]; // кто смотрел профиль
}

export interface Message {
  id: string;
  fromId: string;
  toId: string;
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
  ageMin: number;
  ageMax: number;
  distanceMax: number;
}

interface AppState {
  isRegistered: boolean;
  currentUser: User | null;
  onlineUsers: User[];
  totalUsers: number;
  districts: District[];
  currentDistrict: District | null;
  invites: DistrictInvite[];
  selectedUser: User | null;
  messages: Message[];
  showChat: boolean;
  showProfile: boolean;
  showFilters: boolean;
  showFullProfile: boolean;
  showDistricts: boolean;
  typingUsers: Record<string, number>; // userId -> timestamp
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
  setTyping: (userId: string) => void;
  addReaction: (messageId: string, emoji: string) => void;
  markAsRead: (messageId: string) => void;
  uploadAvatar: (file: File) => Promise<string>;
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
  totalUsers: 0,
  districts: [],
  currentDistrict: null,
  invites: [],
  selectedUser: null,
  messages: [],
  showChat: false,
  showProfile: false,
  showFilters: false,
  showFullProfile: false,
  showDistricts: false,
  typingUsers: {},
  toastMessage: null,
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
    
    // Добавляем демо-пользователей если это первый пользователь
    get().addDemoUsersIfNeeded();
    
    get().listenForUsers();
    get().listenForDistricts();
    get().listenForInvites();
    get().startLocationTracking();
  },

  addDemoUsersIfNeeded: () => {
    const usersRef = ref(db, 'users');
    onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      const usersCount = data ? Object.keys(data).length : 0;
      
      // Если мало пользователей, добавляем демо
      if (usersCount < 3) {
        const demoUsers = [
          {
            id: 'demo_alina',
            name: 'Алина',
            age: 22,
            gender: 'female',
            bio: 'Люблю кофе и прогулки ☕',
            avatar: '👩‍🦰',
            photoUrl: '',
            status: 'Ищу компанию',
            city: 'Москва',
            lat: 55.755 + (Math.random() - 0.5) * 0.01,
            lng: 37.620 + (Math.random() - 0.5) * 0.01,
            isOnline: true,
            lastSeen: Date.now(),
            likes: [],
            dislikes: [],
            profileViews: [],
          },
          {
            id: 'demo_maxim',
            name: 'Максим',
            age: 25,
            gender: 'male',
            bio: 'Фотограф 📸',
            avatar: '👨‍🦱',
            photoUrl: '',
            status: 'На связи',
            city: 'Москва',
            lat: 55.748 + (Math.random() - 0.5) * 0.01,
            lng: 37.615 + (Math.random() - 0.5) * 0.01,
            isOnline: true,
            lastSeen: Date.now(),
            likes: [],
            dislikes: [],
            profileViews: [],
          },
          {
            id: 'demo_darya',
            name: 'Дарья',
            age: 20,
            gender: 'female',
            bio: 'Студентка, люблю музыку 🎵',
            avatar: '👩',
            photoUrl: '',
            status: 'Свободна',
            city: 'Москва',
            lat: 55.760 + (Math.random() - 0.5) * 0.01,
            lng: 37.625 + (Math.random() - 0.5) * 0.01,
            isOnline: true,
            lastSeen: Date.now(),
            likes: [],
            dislikes: [],
            profileViews: [],
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

  likeUser: (userId) => {
    const { currentUser, onlineUsers } = get();
    if (!currentUser || userId === currentUser.id) return;

    const userRef = ref(db, `users/${userId}/likes`);
    onValue(userRef, (snapshot) => {
      const likes = snapshot.val() || [];
      if (!likes.includes(currentUser.id)) {
        const newLikes = [...likes, currentUser.id];
        fbSet(userRef, newLikes);
        
        // Проверяем взаимность
        const targetUser = onlineUsers.find(u => u.id === userId);
        if (targetUser && targetUser.likes?.includes(currentUser.id)) {
          // Взаимный лайк!
          get().showToast(`💕 У вас взаимная симпатия с ${targetUser.name}!`);
        }
      }
    }, { onlyOnce: true });
  },

  unlikeUser: (userId) => {
    const { currentUser } = get();
    if (!currentUser) return;

    const userRef = ref(db, `users/${userId}/likes`);
    onValue(userRef, (snapshot) => {
      const likes = snapshot.val() || [];
      const newLikes = likes.filter((id: string) => id !== currentUser.id);
      fbSet(userRef, newLikes);
    }, { onlyOnce: true });
  },

  dislikeUser: (userId) => {
    const { currentUser } = get();
    if (!currentUser || userId === currentUser.id) return;

    const userRef = ref(db, `users/${userId}/dislikes`);
    onValue(userRef, (snapshot) => {
      const dislikes = snapshot.val() || [];
      if (!dislikes.includes(currentUser.id)) {
        const newDislikes = [...dislikes, currentUser.id];
        fbSet(userRef, newDislikes);
      }
    }, { onlyOnce: true });
  },

  getMatches: () => {
    const { currentUser, onlineUsers } = get();
    if (!currentUser) return [];

    return onlineUsers.filter(user => {
      // Взаимный лайк
      const iLiked = user.likes?.includes(currentUser.id);
      const likedMe = currentUser.likes?.includes(user.id);
      return iLiked && likedMe;
    });
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

    const userRef = ref(db, `users/${userId}/profileViews`);
    onValue(userRef, (snapshot) => {
      const views = snapshot.val() || [];
      if (!views.includes(currentUser.id)) {
        const newViews = [...views, currentUser.id];
        fbSet(userRef, newViews);
      }
    }, { onlyOnce: true });
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
    const { currentUser } = get();
    if (!currentUser) return;

    const messageRef = ref(db, `messages/${messageId}/reactions/${emoji}`);
    onValue(messageRef, (snapshot) => {
      const reactions = snapshot.val() || [];
      if (reactions.includes(currentUser.id)) {
        // Убираем реакцию
        const newReactions = reactions.filter((id: string) => id !== currentUser.id);
        fbSet(messageRef, newReactions);
      } else {
        // Добавляем реакцию
        fbSet(messageRef, [...reactions, currentUser.id]);
      }
    }, { onlyOnce: true });
  },

  markAsRead: (messageId) => {
    const messageRef = ref(db, `messages/${messageId}/read`);
    fbSet(messageRef, true);
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
        set({ onlineUsers: [], totalUsers: 0 });
        return;
      }

      const allUsers: User[] = Object.entries(data)
        .map(([id, userData]) => ({ ...(userData as User), id }));

      const onlineUsers: User[] = allUsers
        .filter(u => u.id !== get().currentUser?.id)
        .filter(u => Date.now() - u.lastSeen < 30 * 60 * 1000); // 30 минут

      set({ onlineUsers: onlineUsers, totalUsers: allUsers.length });
    });
  },

  listenForMessages: () => {
    const { currentUser } = get();
    if (!currentUser) return;

    const messagesRef = ref(db, 'messages');
    onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        set({ messages: [] });
        return;
      }

      const allMessages: Message[] = Object.entries(data)
        .map(([id, msgData]) => ({ ...(msgData as Message), id }))
        .filter(m => m.fromId === currentUser.id || m.toId === currentUser.id)
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
    
    // Загружаем актуальные данные из Firebase (включая фото)
    onValue(userRef, (snapshot) => {
      const firebaseUser = snapshot.val();
      if (firebaseUser) {
        const updatedUser = { ...user, ...firebaseUser, isOnline: true, lastSeen: Date.now() };
        fbSet(userRef, updatedUser);
        useStore.setState({ currentUser: updatedUser });
        localStorage.setItem('nearme_user', JSON.stringify(updatedUser));
      }
    }, { onlyOnce: true });
    
    onDisconnect(userRef).update({
      isOnline: false,
      lastSeen: Date.now(),
    });

    useStore.setState({ isRegistered: true });
    
    setTimeout(() => {
      useStore.getState().listenForUsers();
      useStore.getState().listenForDistricts();
      useStore.getState().listenForInvites();
      useStore.getState().startLocationTracking();
    }, 100);
  } catch (e) {
    localStorage.removeItem('nearme_registered');
    localStorage.removeItem('nearme_user');
  }
}
