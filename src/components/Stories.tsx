import React, { useState, useRef, useEffect } from 'react';
import { useStore, User } from '../store';
import { hapticFeedback } from '../telegram';

export default function StoriesBar() {
  const { onlineUsers, currentUser, setShowStories, setStoryViewUser } = useStore();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!currentUser) return null;

  // Users with active stories
  const usersWithStories = onlineUsers.filter(u => 
    u.stories && u.stories.some(s => s.expiresAt > Date.now())
  );

  const myActiveStories = (currentUser.stories || []).filter(s => s.expiresAt > Date.now());

  const handleStoryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if video is <= 5 seconds (approximate by file size)
    const isVideo = file.type.startsWith('video/');
    if (isVideo && file.size > 10 * 1024 * 1024) { // 10MB max
      alert('Видео слишком большое. Максимум 10MB');
      return;
    }

    setUploading(true);
    try {
      await useStore.getState().uploadStory(file, isVideo ? 'video' : 'image');
      hapticFeedback.success();
    } catch (error) {
      console.error('Upload error:', error);
      alert('Ошибка загрузки сторис');
    }
    setUploading(false);
  };

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 py-2 px-3">
      <div className="flex gap-3 overflow-x-auto scrollbar-hide">
        {/* My story */}
        <div className="flex flex-col items-center min-w-[60px]">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="relative"
          >
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 p-0.5">
              <div className="w-full h-full rounded-full bg-white dark:bg-gray-800 p-0.5">
                <div className="w-full h-full rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-xl relative overflow-hidden">
                  {currentUser.avatar}
                  {myActiveStories.length > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[8px] text-center py-0.5">
                      {myActiveStories.length}
                    </div>
                  )}
                </div>
              </div>
            </div>
            {myActiveStories.length === 0 && (
              <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-800">
                <i className="fas fa-plus text-white text-[8px]"></i>
              </div>
            )}
          </button>
          <span className="text-[10px] text-gray-600 dark:text-gray-400 mt-1 truncate max-w-[60px]">
            {uploading ? '...' : 'Мои'}
          </span>
        </div>

        {/* Other users' stories */}
        {usersWithStories.map(user => (
          <div key={user.id} className="flex flex-col items-center min-w-[60px]">
            <button
              onClick={() => {
                hapticFeedback.light();
                setStoryViewUser(user);
                setShowStories(true);
              }}
              className="relative"
            >
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-yellow-400 via-pink-500 to-purple-500 p-0.5">
                <div className="w-full h-full rounded-full bg-white dark:bg-gray-800 p-0.5">
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-xl">
                    {user.avatar}
                  </div>
                </div>
              </div>
            </button>
            <span className="text-[10px] text-gray-600 dark:text-gray-400 mt-1 truncate max-w-[60px]">
              {user.name}
            </span>
          </div>
        ))}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        onChange={handleStoryUpload}
        className="hidden"
      />
    </div>
  );
}

// Story Viewer Component
export function StoryViewer() {
  const { storyViewUser, setShowStories, currentUser, viewStory } = useStore();
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const activeStories = (storyViewUser?.stories || []).filter(s => s.expiresAt > Date.now());

  useEffect(() => {
    if (activeStories.length === 0) {
      setShowStories(false);
      return;
    }

    const story = activeStories[currentStoryIndex];
    if (!story) return;

    // Mark as viewed
    if (currentUser && storyViewUser) {
      viewStory(storyViewUser.id, story.id);
    }

    // Auto advance for images
    if (story.type === 'image') {
      setProgress(0);
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            nextStory();
            return 0;
          }
          return prev + 2; // 5 seconds total
        });
      }, 100);
      return () => clearInterval(interval);
    }
  }, [currentStoryIndex, storyViewUser]);

  const nextStory = () => {
    if (currentStoryIndex < activeStories.length - 1) {
      setCurrentStoryIndex(currentStoryIndex + 1);
      setProgress(0);
    } else {
      setShowStories(false);
    }
  };

  const prevStory = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1);
      setProgress(0);
    }
  };

  if (!storyViewUser || activeStories.length === 0) return null;

  const story = activeStories[currentStoryIndex];

  return (
    <div className="fixed inset-0 z-[4000] bg-black flex items-center justify-center">
      {/* Progress bars */}
      <div className="absolute top-2 left-2 right-2 flex gap-1 z-10">
        {activeStories.map((_, idx) => (
          <div key={idx} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all"
              style={{
                width: idx < currentStoryIndex ? '100%' : idx === currentStoryIndex ? `${progress}%` : '0%'
              }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-6 left-4 right-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-sm">
            {storyViewUser.avatar}
          </div>
          <span className="text-white font-semibold text-sm">{storyViewUser.name}</span>
          <span className="text-white/60 text-xs">
            {Math.round((Date.now() - story.createdAt) / 1000 / 60)}м
          </span>
        </div>
        <button
          onClick={() => setShowStories(false)}
          className="text-white p-2"
        >
          <i className="fas fa-times text-xl"></i>
        </button>
      </div>

      {/* Story content */}
      <div className="w-full h-full flex items-center justify-center">
        {story.type === 'video' ? (
          <video
            ref={videoRef}
            src={story.url}
            autoPlay
            onEnded={nextStory}
            className="max-w-full max-h-full object-contain"
          />
        ) : (
          <img
            src={story.url}
            alt=""
            className="max-w-full max-h-full object-contain"
          />
        )}
      </div>

      {/* Tap areas */}
      <div className="absolute inset-0 flex" onClick={nextStory}>
        <div className="w-1/3 h-full" onClick={(e) => { e.stopPropagation(); prevStory(); }} />
        <div className="w-1/3 h-full" />
        <div className="w-1/3 h-full" onClick={(e) => { e.stopPropagation(); nextStory(); }} />
      </div>
    </div>
  );
}
