// Auth-related functions
function checkAuthAndRedirect() {
    if (!Auth.isLoggedIn()) {
        const currentPage = window.location.pathname.split('/').pop();
        const protectedPages = ['dashboard.html', 'watch.html', 'profile.html'];
        
        if (protectedPages.includes(currentPage)) {
            window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.href);
            return false;
        }
    }
    return true;
}

// Load user-specific data
async function loadUserData() {
    if (!Auth.isLoggedIn()) return null;
    
    const user = Auth.getCurrentUser();
    if (!user) return null;
    
    // Update UI elements with user data
    const usernameElements = document.querySelectorAll('.username-display');
    usernameElements.forEach(el => {
        el.textContent = user.username || user.firstName;
    });
    
    const avatarElements = document.querySelectorAll('.user-avatar');
    avatarElements.forEach(el => {
        el.src = user.avatar;
        el.alt = user.username;
    });
    
    return user;
}

// Watch anime with auth check
async function watchAnimeWithAuth(animeId, episode = 1) {
    if (!Auth.isLoggedIn()) {
        // Simpan data anime untuk redirect setelah login
        sessionStorage.setItem('pendingWatch', JSON.stringify({ animeId, episode }));
        window.location.href = 'login.html?redirect=' + encodeURIComponent(`watch.html?id=${animeId}&ep=${episode}`);
        return;
    }
    
    const user = Auth.getCurrentUser();
    
    // Save to watch history
    try {
        await Database.addWatchHistory(user.id, animeId, episode, 0, 1425);
    } catch (error) {
        console.error('Error saving to watch history:', error);
    }
    
    // Redirect to watch page
    window.location.href = `watch.html?id=${animeId}&ep=${episode}`;
}

// Toggle favorite with auth
async function toggleFavoriteWithAuth(animeId) {
    if (!Auth.isLoggedIn()) {
        showNotification('Silakan login untuk menambahkan ke favorit', 'warning');
        return;
    }
    
    const user = Auth.getCurrentUser();
    const result = await Database.toggleFavorite(user.id, animeId);
    
    if (result.success) {
        const message = result.action === 'added' ? 'Ditambahkan ke favorit' : 'Dihapus dari favorit';
        showNotification(message);
        
        // Update UI
        const favoriteBtn = document.querySelector(`[onclick*="${animeId}"]`);
        if (favoriteBtn) {
            const icon = favoriteBtn.querySelector('i');
            if (icon) {
                icon.className = result.action === 'added' ? 'fas fa-heart' : 'far fa-heart';
            }
        }
    }
}

// Update main initialization in script.js
document.addEventListener('DOMContentLoaded', async function() {
    // Check auth
    checkAuthAndRedirect();
    
    // Load user data if logged in
    if (Auth.isLoggedIn()) {
        await loadUserData();
    }
    
    // Check for pending watch after login
    const pendingWatch = sessionStorage.getItem('pendingWatch');
    if (pendingWatch && Auth.isLoggedIn()) {
        const { animeId, episode } = JSON.parse(pendingWatch);
        sessionStorage.removeItem('pendingWatch');
        watchAnimeWithAuth(animeId, episode);
    }
    
    // ... existing code ...
});