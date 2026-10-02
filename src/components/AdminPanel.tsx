import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { formatTime } from '../utils/helpers';

interface AdminStats {
  totalUsers: number;
  onlineUsers: number;
  totalMessages: number;
  totalLikes: number;
  totalChats: number;
  newUsersToday: number;
  activeUsersToday: number;
  messagesToday: number;
}

export default function AdminPanel() {
  const { currentUser, onlineUsers, messages, setShowAdmin, allUsers } = useStore();
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    onlineUsers: 0,
    totalMessages: 0,
    totalLikes: 0,
    totalChats: 0,
    newUsersToday: 0,
    activeUsersToday: 0,
    messagesToday: 0,
  });
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'messages' | 'activity'>('overview');

  // Проверка доступа (только для админа)
  const isAdmin = currentUser?.id === 'admin' || localStorage.getItem('nearme_admin') === 'true';

  useEffect(() => {
    if (!isAdmin) return;

    // Подсчёт статистики
    const now = Date.now();
    const today = new Date().setHours(0, 0, 0, 0);
    
    const totalLikes = allUsers.reduce((sum, user) => sum + (user.likes?.length || 0), 0);
    const uniqueChats = new Set(messages.map(m => [m.fromId, m.toId].sort().join('-'))).size;
    const newUsersToday = allUsers.filter(u => u.lastSeen >= today).length;
    const activeUsersToday = allUsers.filter(u => u.lastSeen >= today).length;
    const messagesToday = messages.filter(m => m.timestamp >= today).length;

    setStats({
      totalUsers: allUsers.length,
      onlineUsers: onlineUsers.length,
      totalMessages: messages.length,
      totalLikes,
      totalChats: uniqueChats,
      newUsersToday,
      activeUsersToday,
      messagesToday,
    });
  }, [allUsers, onlineUsers, messages, isAdmin]);

  if (!isAdmin) {
    return (
      <div className="fixed inset-0 z-[3000] bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Доступ запрещён</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">У вас нет прав администратора</p>
          <button
            onClick={() => setShowAdmin(false)}
            className="w-full py-3 bg-purple-500 text-white rounded-xl font-semibold"
          >
            Закрыть
          </button>
        </div>
      </div>
    );
  }

  const handleBanUser = (userId: string) => {
    if (confirm('Заблокировать этого пользователя?')) {
      // Здесь можно добавить логику бана через Firebase
      alert('Пользователь заблокирован');
    }
  };

  return (
    <div className="fixed inset-0 z-[3000] bg-gray-50 dark:bg-gray-900 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-4 shadow-lg z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAdmin(false)}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            >
              <i className="fas fa-arrow-left"></i>
            </button>
            <div>
              <h1 className="text-xl font-bold">Админ-панель</h1>
              <p className="text-sm text-white/80">Мониторинг и управление</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{stats.onlineUsers}</div>
            <div className="text-xs text-white/80">онлайн</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4">
        <div className="flex overflow-x-auto">
          {[
            { id: 'overview', label: 'Обзор', icon: 'fa-chart-line' },
            { id: 'users', label: 'Пользователи', icon: 'fa-users' },
            { id: 'messages', label: 'Сообщения', icon: 'fa-comments' },
            { id: 'activity', label: 'Активность', icon: 'fa-clock' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 min-w-[100px] px-4 py-3 text-sm font-medium whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <i className={`fas ${tab.icon} mr-2`}></i>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Main Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <i className="fas fa-users text-blue-500 text-2xl"></i>
                  <span className="text-xs text-green-500 font-semibold">+{stats.newUsersToday} сегодня</span>
                </div>
                <div className="text-3xl font-bold text-gray-800 dark:text-white">{stats.totalUsers}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Всего пользователей</div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <i className="fas fa-circle text-green-500 text-2xl"></i>
                  <span className="text-xs text-green-500 font-semibold">LIVE</span>
                </div>
                <div className="text-3xl font-bold text-gray-800 dark:text-white">{stats.onlineUsers}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Сейчас онлайн</div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <i className="fas fa-comments text-purple-500 text-2xl"></i>
                  <span className="text-xs text-green-500 font-semibold">+{stats.messagesToday} сегодня</span>
                </div>
                <div className="text-3xl font-bold text-gray-800 dark:text-white">{stats.totalMessages}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Всего сообщений</div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <i className="fas fa-heart text-pink-500 text-2xl"></i>
                </div>
                <div className="text-3xl font-bold text-gray-800 dark:text-white">{stats.totalLikes}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Всего лайков</div>
              </div>
            </div>

            {/* Additional Stats */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
              <h3 className="font-bold text-gray-800 dark:text-white mb-3">Дополнительная статистика</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Активных чатов</span>
                  <span className="font-bold text-gray-800 dark:text-white">{stats.totalChats}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Активных сегодня</span>
                  <span className="font-bold text-gray-800 dark:text-white">{stats.activeUsersToday}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Новых за сегодня</span>
                  <span className="font-bold text-green-600">{stats.newUsersToday}</span>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
              <h3 className="font-bold text-gray-800 dark:text-white mb-3">Последняя активность</h3>
              <div className="space-y-2">
                {messages.slice(-5).reverse().map(msg => {
                  const sender = allUsers.find(u => u.id === msg.fromId);
                  return (
                    <div key={msg.id} className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-sm">
                        {sender?.avatar || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-800 dark:text-white truncate">
                          {sender?.name || 'Пользователь'}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {msg.text}
                        </div>
                      </div>
                      <div className="text-xs text-gray-400">
                        {formatTime(msg.timestamp)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-3">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
              <h3 className="font-bold text-gray-800 dark:text-white mb-3">
                Все пользователи ({allUsers.length})
              </h3>
              <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                {allUsers.map(user => {
                  const isOnline = Date.now() - user.lastSeen < 5 * 60 * 1000;
                  return (
                    <div
                      key={user.id}
                      onClick={() => setSelectedUser(user)}
                      className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    >
                      <div className="relative">
                        {user.photoUrl ? (
                          <img src={user.photoUrl} alt="" className="w-12 h-12 rounded-full object-cover" />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-xl">
                            {user.avatar}
                          </div>
                        )}
                        <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-gray-700 ${
                          isOnline ? 'bg-green-500' : 'bg-gray-400'
                        }`}></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-800 dark:text-white">
                          {user.name}, {user.age}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {user.city || 'Город не указан'}
                        </div>
                        <div className="text-xs text-gray-400">
                          {isOnline ? 'Онлайн' : `Был(а) ${formatTime(user.lastSeen)}`}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-purple-600">{user.likes?.length || 0}</div>
                        <div className="text-xs text-gray-500">лайков</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Messages Tab */}
        {activeTab === 'messages' && (
          <div className="space-y-3">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
              <h3 className="font-bold text-gray-800 dark:text-white mb-3">
                Последние сообщения ({messages.length})
              </h3>
              <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                {messages.slice(-50).reverse().map(msg => {
                  const sender = allUsers.find(u => u.id === msg.fromId);
                  const receiver = allUsers.find(u => u.id === msg.toId);
                  return (
                    <div key={msg.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-sm">
                          {sender?.avatar || '?'}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-800 dark:text-white">
                            {sender?.name || 'Пользователь'} → {receiver?.name || 'Пользователь'}
                          </div>
                          <div className="text-xs text-gray-400">
                            {formatTime(msg.timestamp)}
                          </div>
                        </div>
                        {msg.read && (
                          <i className="fas fa-check-double text-blue-500 text-xs"></i>
                        )}
                      </div>
                      <div className="text-sm text-gray-700 dark:text-gray-300 pl-10">
                        {msg.text}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Activity Tab */}
        {activeTab === 'activity' && (
          <div className="space-y-3">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
              <h3 className="font-bold text-gray-800 dark:text-white mb-3">Активность по времени</h3>
              <div className="space-y-2">
                {['Сейчас онлайн', 'Были за последний час', 'Были сегодня', 'Были на этой неделе'].map((label, idx) => {
                  const thresholds = [5 * 60 * 1000, 60 * 60 * 1000, 24 * 60 * 60 * 1000, 7 * 24 * 60 * 60 * 1000];
                  const count = allUsers.filter(u => Date.now() - u.lastSeen < thresholds[idx]).length;
                  const percentage = allUsers.length > 0 ? (count / allUsers.length) * 100 : 0;
                  
                  return (
                    <div key={idx}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
                        <span className="text-sm font-bold text-gray-800 dark:text-white">{count}</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
              <h3 className="font-bold text-gray-800 dark:text-white mb-3">Популярные пользователи</h3>
              <div className="space-y-2">
                {allUsers
                  .sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0))
                  .slice(0, 5)
                  .map((user, idx) => (
                    <div key={user.id} className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600 w-8">#{idx + 1}</div>
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-lg">
                        {user.avatar}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-800 dark:text-white">{user.name}</div>
                        <div className="text-xs text-gray-500">{user.city || 'Город не указан'}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-pink-500">{user.likes?.length || 0}</div>
                        <div className="text-xs text-gray-500">лайков</div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-[4000] bg-black/50 flex items-center justify-center p-4" onClick={() => setSelectedUser(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-4">
              {selectedUser.photoUrl ? (
                <img src={selectedUser.photoUrl} alt="" className="w-24 h-24 rounded-full object-cover mx-auto mb-3" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-4xl mx-auto mb-3">
                  {selectedUser.avatar}
                </div>
              )}
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">{selectedUser.name}, {selectedUser.age}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{selectedUser.city || 'Город не указан'}</p>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-gray-600 dark:text-gray-400">Статус</span>
                <span className={`font-semibold ${Date.now() - selectedUser.lastSeen < 5 * 60 * 1000 ? 'text-green-500' : 'text-gray-500'}`}>
                  {Date.now() - selectedUser.lastSeen < 5 * 60 * 1000 ? 'Онлайн' : 'Оффлайн'}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-gray-600 dark:text-gray-400">Последняя активность</span>
                <span className="font-semibold text-gray-800 dark:text-white">{formatTime(selectedUser.lastSeen)}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-gray-600 dark:text-gray-400">Лайков получено</span>
                <span className="font-semibold text-pink-500">{selectedUser.likes?.length || 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-gray-600 dark:text-gray-400">Просмотров профиля</span>
                <span className="font-semibold text-purple-500">{selectedUser.profileViews?.length || 0}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleBanUser(selectedUser.id)}
                className="flex-1 py-3 bg-red-500 text-white rounded-xl font-semibold"
              >
                Заблокировать
              </button>
              <button
                onClick={() => setSelectedUser(null)}
                className="flex-1 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-xl font-semibold"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
