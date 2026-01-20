// IndexedDB Database System
const Database = {
    dbName: 'AnimeFlixDB',
    dbVersion: 1,
    db: null,
    
    // Initialize database
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onerror = (event) => {
                console.error('Database error:', event.target.error);
                reject(event.target.error);
            };
            
            request.onsuccess = (event) => {
                this.db = event.target.result;
                
                // Check if we need to create default data
                this.checkDefaultData();
                
                resolve(this.db);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Create object stores
                if (!db.objectStoreNames.contains('users')) {
                    const usersStore = db.createObjectStore('users', { keyPath: 'id' });
                    usersStore.createIndex('email', 'email', { unique: true });
                    usersStore.createIndex('username', 'username', { unique: true });
                    
                    // Add default admin user
                    setTimeout(() => {
                        this.createDefaultUsers();
                    }, 100);
                }
                
                if (!db.objectStoreNames.contains('anime')) {
                    const animeStore = db.createObjectStore('anime', { keyPath: 'id' });
                    animeStore.createIndex('title', 'title', { unique: false });
                    animeStore.createIndex('genre', 'genre', { unique: false });
                    
                    // Add default anime data
                    setTimeout(() => {
                        this.createDefaultAnime();
                    }, 100);
                }
                
                if (!db.objectStoreNames.contains('episodes')) {
                    db.createObjectStore('episodes', { keyPath: 'id' });
                }
                
                if (!db.objectStoreNames.contains('watch_history')) {
                    db.createObjectStore('watch_history', { keyPath: 'id' });
                }
                
                if (!db.objectStoreNames.contains('favorites')) {
                    db.createObjectStore('favorites', { keyPath: 'id' });
                }
                
                if (!db.objectStoreNames.contains('activities')) {
                    db.createObjectStore('activities', { keyPath: 'id' });
                }
                
                if (!db.objectStoreNames.contains('settings')) {
                    db.createObjectStore('settings', { keyPath: 'key' });
                }
            };
        });
    },
    
    // Check and create default data
    async checkDefaultData() {
        try {
            const users = await this.getAll('users');
            if (users.length === 0) {
                await this.createDefaultUsers();
            }
            
            const anime = await this.getAll('anime');
            if (anime.length === 0) {
                await this.createDefaultAnime();
            }
        } catch (error) {
            console.error('Error checking default data:', error);
        }
    },
    
    // Create default users
    async createDefaultUsers() {
        const defaultUsers = [
            {
                id: 'user_1',
                firstName: 'Admin',
                lastName: 'AnimeFlix',
                email: 'admin@animeflix.com',
                username: 'admin',
                password: 'admin123',
                avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
                joinDate: new Date().toISOString(),
                subscription: 'premium',
                preferences: {
                    notifications: true,
                    newsletter: true,
                    language: 'id',
                    quality: '1080p',
                    autoplay: true,
                    subtitle: true
                },
                watchHistory: [
                    {
                        animeId: 1,
                        title: "Solo Leveling",
                        episode: 3,
                        progress: 85,
                        timestamp: Date.now() - 3600000,
                        duration: 1425
                    }
                ],
                favorites: [1, 2, 3],
                createdAt: Date.now() - 86400000,
                lastLogin: Date.now(),
                isActive: true,
                role: 'admin'
            },
            {
                id: 'user_2',
                firstName: 'User',
                lastName: 'Demo',
                email: 'user@animeflix.com',
                username: 'userdemo',
                password: 'user123',
                avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user',
                joinDate: new Date().toISOString(),
                subscription: 'free',
                preferences: {
                    notifications: true,
                    newsletter: false,
                    language: 'id',
                    quality: '720p',
                    autoplay: false,
                    subtitle: true
                },
                watchHistory: [],
                favorites: [],
                createdAt: Date.now(),
                lastLogin: null,
                isActive: true,
                role: 'user'
            }
        ];
        
        for (const user of defaultUsers) {
            await this.add('users', user);
        }
        
        console.log('Default users created');
    },
    
    // Create default anime data
    async createDefaultAnime() {
        const defaultAnime = [
            {
                id: 1,
                title: "Solo Leveling",
                altTitle: "Only I Level Up",
                description: "Sung Jin-Woo bangkit sebagai hunter terkuat setelah peristiwa di double dungeon.",
                poster: "https://images.unsplash.com/photo-1639322537228-f710d846310a?w=400&h=600&fit=crop",
                banner: "https://images.unsplash.com/photo-1639322537508-6b4b5c6c5c5c?w=1200&h=400&fit=crop",
                rating: 9.1,
                year: 2024,
                status: "Ongoing",
                studio: "A-1 Pictures",
                totalEpisodes: 12,
                duration: "23 min",
                genres: ["Action", "Adventure", "Fantasy", "Supernatural"],
                episodes: [
                    { number: 1, title: "I'm Used to It", duration: "23:45" },
                    { number: 2, title: "If I Had One More Chance", duration: "24:10" },
                    { number: 3, title: "It's Like a Dream", duration: "23:30" }
                ],
                sources: [
                    {
                        server: "Server 1",
                        url: "https://bitdash-a.akamaihd.net/s/content/media/Manifest.m3u8",
                        quality: "1080p"
                    }
                ],
                createdAt: Date.now()
            },
            {
                id: 2,
                title: "Jujutsu Kaisen",
                altTitle: "Sorcery Fight",
                description: "Yuji Itadori menelan jari terkutuk dan bergabung dengan sekolah sihir jujutsu.",
                poster: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop",
                banner: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1200&h=400&fit=crop",
                rating: 9.0,
                year: 2023,
                status: "Season 2 Complete",
                studio: "MAPPA",
                totalEpisodes: 47,
                duration: "23 min",
                genres: ["Action", "Supernatural", "Horror", "School"],
                episodes: [
                    { number: 1, title: "Ryomen Sukuna", duration: "23:50" },
                    { number: 2, title: "For Myself", duration: "24:05" }
                ],
                sources: [
                    {
                        server: "Server 1",
                        url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
                        quality: "1080p"
                    }
                ],
                createdAt: Date.now()
            }
        ];
        
        for (const anime of defaultAnime) {
            await this.add('anime', anime);
        }
        
        console.log('Default anime created');
    },
    
    // Add data
    async add(storeName, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.add(data);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },
    
    // Get data by ID
    async get(storeName, id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(id);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },
    
    // Get all data
    async getAll(storeName, indexName, range) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const target = indexName ? store.index(indexName) : store;
            const request = target.getAll(range);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },
    
    // Update data
    async update(storeName, id, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put({ ...data, id });
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },
    
    // Delete data
    async delete(storeName, id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(id);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },
    
    // Clear all data in store
    async clear(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.clear();
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    },
    
    // Search data
    async search(storeName, query, field) {
        const allData = await this.getAll(storeName);
        return allData.filter(item => 
            item[field]?.toLowerCase().includes(query.toLowerCase())
        );
    },
    
    // Get user by email
    async getUserByEmail(email) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['users'], 'readonly');
            const store = transaction.objectStore('users');
            const index = store.index('email');
            const request = index.get(email);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },
    
    // Get user by username
    async getUserByUsername(username) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['users'], 'readonly');
            const store = transaction.objectStore('users');
            const index = store.index('username');
            const request = index.get(username);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },
    
    // Add to watch history
    async addWatchHistory(userId, animeId, episode, progress, duration) {
        const historyId = `history_${userId}_${animeId}_${episode}`;
        
        const history = {
            id: historyId,
            userId,
            animeId,
            episode,
            progress,
            duration,
            timestamp: Date.now(),
            completed: progress >= 95
        };
        
        await this.add('watch_history', history);
        
        // Update user's watch history
        const user = await this.get('users', userId);
        if (user) {
            const existingIndex = user.watchHistory.findIndex(h => 
                h.animeId === animeId && h.episode === episode
            );
            
            if (existingIndex > -1) {
                user.watchHistory[existingIndex] = {
                    animeId,
                    title: history.title || `Anime ${animeId}`,
                    episode,
                    progress,
                    timestamp: Date.now(),
                    duration
                };
            } else {
                user.watchHistory.push({
                    animeId,
                    title: history.title || `Anime ${animeId}`,
                    episode,
                    progress,
                    timestamp: Date.now(),
                    duration
                });
            }
            
            await this.update('users', userId, user);
        }
    },
    
    // Toggle favorite
    async toggleFavorite(userId, animeId) {
        const favoriteId = `fav_${userId}_${animeId}`;
        
        try {
            // Check if already favorited
            const existing = await this.get('favorites', favoriteId);
            
            if (existing) {
                // Remove from favorites
                await this.delete('favorites', favoriteId);
                
                // Update user's favorites list
                const user = await this.get('users', userId);
                if (user) {
                    user.favorites = user.favorites.filter(id => id !== animeId);
                    await this.update('users', userId, user);
                }
                
                return { success: true, action: 'removed' };
            } else {
                // Add to favorites
                const favorite = {
                    id: favoriteId,
                    userId,
                    animeId,
                    addedAt: Date.now()
                };
                
                await this.add('favorites', favorite);
                
                // Update user's favorites list
                const user = await this.get('users', userId);
                if (user) {
                    user.favorites.push(animeId);
                    await this.update('users', userId, user);
                }
                
                return { success: true, action: 'added' };
            }
        } catch (error) {
            console.error('Toggle favorite error:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Get user's watch history
    async getUserWatchHistory(userId, limit = 10) {
        const history = await this.getAll('watch_history');
        return history
            .filter(h => h.userId === userId)
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, limit);
    },
    
    // Get user's favorites
    async getUserFavorites(userId) {
        const user = await this.get('users', userId);
        if (!user) return [];
        
        const favorites = [];
        for (const animeId of user.favorites) {
            const anime = await this.get('anime', animeId);
            if (anime) {
                favorites.push(anime);
            }
        }
        
        return favorites;
    }
};

// Initialize database on load
document.addEventListener('DOMContentLoaded', async function() {
    try {
        await Database.init();
        console.log('Database initialized');
    } catch (error) {
        console.error('Failed to initialize database:', error);
    }
});