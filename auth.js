// Authentication System
const Auth = {
    // Initialize auth system
    init() {
        this.checkAuthState();
        this.setupAutoLogout();
    },
    
    // Check if user is logged in
    isLoggedIn() {
        const session = localStorage.getItem('session');
        if (!session) return false;
        
        try {
            const sessionData = JSON.parse(session);
            
            // Check if session is expired
            if (sessionData.expiresAt && Date.now() > sessionData.expiresAt) {
                this.logout();
                return false;
            }
            
            return !!sessionData.userId;
        } catch (error) {
            console.error('Session parse error:', error);
            return false;
        }
    },
    
    // Get current user
    getCurrentUser() {
        if (!this.isLoggedIn()) return null;
        
        const session = JSON.parse(localStorage.getItem('session'));
        const userData = JSON.parse(localStorage.getItem('user_' + session.userId) || '{}');
        
        return {
            ...userData,
            id: session.userId,
            session: session
        };
    },
    
    // Login function
    async login(identifier, password, rememberMe = false) {
        try {
            // Initialize database
            await Database.init();
            
            // Find user by email or username
            const users = await Database.getAll('users');
            
            const user = users.find(u => 
                u.email.toLowerCase() === identifier.toLowerCase() || 
                u.username.toLowerCase() === identifier.toLowerCase()
            );
            
            if (!user) {
                return {
                    success: false,
                    message: 'Email atau username tidak ditemukan'
                };
            }
            
            // For demo purposes, we'll use simple password check
            // In production, use bcrypt or similar
            if (user.password !== password) {
                return {
                    success: false,
                    message: 'Password salah'
                };
            }
            
            // Create session
            const session = {
                userId: user.id,
                token: this.generateToken(),
                createdAt: Date.now(),
                expiresAt: rememberMe ? Date.now() + (30 * 24 * 60 * 60 * 1000) : Date.now() + (24 * 60 * 60 * 1000), // 30 days or 1 day
                rememberMe: rememberMe
            };
            
            // Save session
            localStorage.setItem('session', JSON.stringify(session));
            
            // Update last login
            user.lastLogin = Date.now();
            await Database.update('users', user.id, user);
            
            // Log activity
            await this.logActivity(user.id, 'login');
            
            return {
                success: true,
                user: user,
                session: session
            };
            
        } catch (error) {
            console.error('Login error:', error);
            return {
                success: false,
                message: 'Terjadi kesalahan saat login'
            };
        }
    },
    
    // Register function
    async register(userData) {
        try {
            await Database.init();
            
            // Check if username or email already exists
            const users = await Database.getAll('users');
            
            const usernameExists = users.some(u => 
                u.username.toLowerCase() === userData.username.toLowerCase()
            );
            
            const emailExists = users.some(u => 
                u.email.toLowerCase() === userData.email.toLowerCase()
            );
            
            if (usernameExists) {
                return {
                    success: false,
                    message: 'Username sudah digunakan'
                };
            }
            
            if (emailExists) {
                return {
                    success: false,
                    message: 'Email sudah terdaftar'
                };
            }
            
            // Create user object
            const userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            
            const newUser = {
                id: userId,
                firstName: userData.firstName,
                lastName: userData.lastName || '',
                email: userData.email,
                username: userData.username,
                password: userData.password, // In production, hash this!
                avatar: userData.avatar,
                joinDate: userData.joinDate,
                subscription: userData.subscription || 'free',
                preferences: userData.preferences || {},
                watchHistory: userData.watchHistory || [],
                favorites: userData.favorites || [],
                createdAt: userData.createdAt,
                lastLogin: null,
                isActive: true,
                role: 'user'
            };
            
            // Save user to database
            await Database.add('users', newUser);
            
            // Log activity
            await this.logActivity(userId, 'register');
            
            // Create sample user data
            await this.createSampleUserData(userId);
            
            return {
                success: true,
                user: newUser
            };
            
        } catch (error) {
            console.error('Register error:', error);
            return {
                success: false,
                message: 'Terjadi kesalahan saat registrasi'
            };
        }
    },
    
    // Logout function
    logout() {
        const session = JSON.parse(localStorage.getItem('session') || '{}');
        
        if (session.userId) {
            this.logActivity(session.userId, 'logout').catch(console.error);
        }
        
        // Clear session
        localStorage.removeItem('session');
        
        // Clear temporary session storage
        sessionStorage.clear();
        
        // Redirect to login page
        setTimeout(() => {
            window.location.href = 'login.html?logout=true';
        }, 100);
    },
    
    // Generate token (simplified)
    generateToken() {
        return 'token_' + Date.now() + '_' + Math.random().toString(36).substr(2);
    },
    
    // Check auth state on page load
    checkAuthState() {
        const protectedPages = ['dashboard.html', 'watch.html', 'profile.html'];
        const currentPage = window.location.pathname.split('/').pop();
        
        if (protectedPages.includes(currentPage) && !this.isLoggedIn()) {
            window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.href);
        }
    },
    
    // Setup auto logout
    setupAutoLogout() {
        // Check session every minute
        setInterval(() => {
            if (this.isLoggedIn()) {
                const session = JSON.parse(localStorage.getItem('session'));
                if (session.expiresAt && Date.now() > session.expiresAt) {
                    this.logout();
                    alert('Sesi Anda telah berakhir. Silakan login kembali.');
                }
            }
        }, 60000); // Check every minute
    },
    
    // Log user activity
    async logActivity(userId, action, details = {}) {
        try {
            const activity = {
                id: 'activity_' + Date.now(),
                userId: userId,
                action: action,
                details: details,
                timestamp: Date.now(),
                ip: '127.0.0.1', // In production, get real IP
                userAgent: navigator.userAgent
            };
            
            await Database.add('activities', activity);
        } catch (error) {
            console.error('Activity log error:', error);
        }
    },
    
    // Create sample user data
    async createSampleUserData(userId) {
        try {
            // Sample watch history
            const watchHistory = [
                {
                    animeId: 1,
                    title: "Solo Leveling",
                    episode: 3,
                    progress: 45,
                    timestamp: Date.now() - 3600000,
                    duration: 1425
                },
                {
                    animeId: 2,
                    title: "Jujutsu Kaisen",
                    episode: 5,
                    progress: 72,
                    timestamp: Date.now() - 86400000,
                    duration: 1410
                }
            ];
            
            // Sample favorites
            const favorites = [1, 2, 3];
            
            // Add to database
            await Database.update('users', userId, {
                watchHistory: watchHistory,
                favorites: favorites
            });
            
        } catch (error) {
            console.error('Create sample data error:', error);
        }
    },
    
    // Update user profile
    async updateProfile(userId, updates) {
        try {
            const user = await Database.get('users', userId);
            
            if (!user) {
                return { success: false, message: 'User tidak ditemukan' };
            }
            
            // Remove sensitive fields
            delete updates.password;
            delete updates.id;
            delete updates.email;
            
            const updatedUser = { ...user, ...updates };
            
            await Database.update('users', userId, updatedUser);
            
            return {
                success: true,
                user: updatedUser
            };
            
        } catch (error) {
            console.error('Update profile error:', error);
            return {
                success: false,
                message: 'Terjadi kesalahan saat update profil'
            };
        }
    },
    
    // Change password
    async changePassword(userId, currentPassword, newPassword) {
        try {
            const user = await Database.get('users', userId);
            
            if (!user) {
                return { success: false, message: 'User tidak ditemukan' };
            }
            
            if (user.password !== currentPassword) {
                return { success: false, message: 'Password saat ini salah' };
            }
            
            if (newPassword.length < 8) {
                return { success: false, message: 'Password baru minimal 8 karakter' };
            }
            
            user.password = newPassword;
            await Database.update('users', userId, user);
            
            await this.logActivity(userId, 'password_change');
            
            return { success: true };
            
        } catch (error) {
            console.error('Change password error:', error);
            return {
                success: false,
                message: 'Terjadi kesalahan saat mengubah password'
            };
        }
    },
    
    // Forgot password (simplified)
    async forgotPassword(email) {
        try {
            await Database.init();
            const users = await Database.getAll('users');
            
            const user = users.find(u => u.email === email);
            
            if (!user) {
                return { success: false, message: 'Email tidak ditemukan' };
            }
            
            // In production, send email with reset link
            const resetToken = this.generateToken();
            const resetLink = `reset-password.html?token=${resetToken}&email=${encodeURIComponent(email)}`;
            
            // Save reset token (temporary)
            sessionStorage.setItem('reset_token_' + email, resetToken);
            
            return {
                success: true,
                resetLink: resetLink,
                message: 'Instruksi reset password telah dikirim ke email Anda'
            };
            
        } catch (error) {
            console.error('Forgot password error:', error);
            return {
                success: false,
                message: 'Terjadi kesalahan saat memproses permintaan'
            };
        }
    }
};

// Initialize auth system on load
document.addEventListener('DOMContentLoaded', function() {
    Auth.init();
});