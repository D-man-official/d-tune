// Music Player Application
class MusicPlayer {
    constructor() {
        this.audioElements = {};
        this.currentAudio = null;
        this.currentSongId = null;
        this.isPlaying = false;
        this.volume = 0.8;
        this.isShuffle = false;
        this.isRepeat = false;
        this.playlist = [];
        this.currentPlaylist = [];
        
        this.init();
    }

    init() {
        // Cache DOM elements
        this.cacheElements();
        
        // Initialize audio elements
        this.initAudioElements();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Initialize player
        this.setInitialState();
        
        // Set volume
        this.setVolume(this.volume);
    }

    cacheElements() {
        // Player controls
        this.playPauseBtn = document.getElementById('play-pause-btn');
        this.prevBtn = document.getElementById('prev-btn');
        this.nextBtn = document.getElementById('next-btn');
        this.shuffleBtn = document.getElementById('shuffle-btn');
        this.repeatBtn = document.getElementById('repeat-btn');
        this.volumeBtn = document.getElementById('volume-btn');
        this.likeBtn = document.querySelector('.like-btn');
        
        // Progress elements
        this.progress = document.getElementById('progress');
        this.progressThumb = document.getElementById('progress-thumb');
        this.progressInput = document.getElementById('progress-input');
        this.currentTimeEl = document.getElementById('current-time');
        this.totalTimeEl = document.getElementById('total-time');
        
        // Volume elements
        this.volumeLevel = document.getElementById('volume-level');
        this.volumeInput = document.getElementById('volume-input');
        
        // Song info elements
        this.currentSongImg = document.getElementById('current-song-img');
        this.currentSongTitle = document.getElementById('current-song-title');
        this.currentSongArtist = document.getElementById('current-song-artist');
        
        // Music cards and play buttons
        this.musicCards = document.querySelectorAll('.music-card');
        this.quickPlayCards = document.querySelectorAll('.quick-play-card');
        this.cardPlayBtns = document.querySelectorAll('.card-play-btn');
        this.quickPlayIcons = document.querySelectorAll('.play-icon');
        
        // Mobile elements
        this.menuToggle = document.querySelector('.menu-toggle');
        this.sidebar = document.querySelector('.sidebar');
        
        // Create playlist from all songs
        this.playlist = Array.from(document.querySelectorAll('.music-card')).map(card => 
            card.getAttribute('data-song')
        );
        this.currentPlaylist = [...this.playlist];
    }

    initAudioElements() {
        // Get all audio elements
        const audioContainer = document.querySelector('.audio-container');
        const audioElements = audioContainer.querySelectorAll('audio');
        
        // Store audio elements in object
        audioElements.forEach(audio => {
            const id = audio.id;
            this.audioElements[id] = audio;
            
            // Set initial volume
            audio.volume = this.volume;
            
            // Add timeupdate event
            audio.addEventListener('timeupdate', () => this.updateProgress(audio));
            
            // Add ended event
            audio.addEventListener('ended', () => this.handleSongEnd());
            
            // Add loadedmetadata event
            audio.addEventListener('loadedmetadata', () => {
                if (audio === this.currentAudio) {
                    this.updateTotalTime();
                }
            });
        });
    }

    setupEventListeners() {
        // Play/Pause button
        this.playPauseBtn.addEventListener('click', () => this.togglePlayPause());
        
        // Previous button
        this.prevBtn.addEventListener('click', () => this.playPrevious());
        
        // Next button
        this.nextBtn.addEventListener('click', () => this.playNext());
        
        // Shuffle button
        this.shuffleBtn.addEventListener('click', () => this.toggleShuffle());
        
        // Repeat button
        this.repeatBtn.addEventListener('click', () => this.toggleRepeat());
        
        // Like button
        this.likeBtn.addEventListener('click', () => this.toggleLike());
        
        // Progress bar
        this.progressInput.addEventListener('input', (e) => this.seekTo(e.target.value));
        this.progressInput.addEventListener('mousedown', () => this.isSeeking = true);
        this.progressInput.addEventListener('mouseup', () => {
            this.isSeeking = false;
            if (this.currentAudio) {
                const time = (this.progressInput.value / 100) * this.currentAudio.duration;
                this.currentAudio.currentTime = time;
            }
        });
        
        // Volume control
        this.volumeInput.addEventListener('input', (e) => this.setVolume(e.target.value / 100));
        this.volumeBtn.addEventListener('click', () => this.toggleMute());
        
        // Music cards
        this.musicCards.forEach(card => {
            card.addEventListener('click', (e) => {
                // Don't trigger if clicking play button
                if (!e.target.closest('.card-play-btn')) {
                    const songId = card.getAttribute('data-song');
                    this.playSong(songId);
                }
            });
            
            const playBtn = card.querySelector('.card-play-btn');
            if (playBtn) {
                playBtn.addEventListener('click', () => {
                    const songId = card.getAttribute('data-song');
                    this.playSong(songId);
                });
            }
        });
        
        // Quick play cards
        this.quickPlayCards.forEach(card => {
            card.addEventListener('click', () => {
                const songId = card.getAttribute('data-song');
                this.playSong(songId);
            });
        });
        
        // Mobile menu toggle
        if (this.menuToggle) {
            this.menuToggle.addEventListener('click', () => {
                this.sidebar.classList.toggle('active');
            });
        }
        
        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 992 && 
                this.sidebar.classList.contains('active') &&
                !this.sidebar.contains(e.target) &&
                !this.menuToggle.contains(e.target)) {
                this.sidebar.classList.remove('active');
            }
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Space bar to play/pause
            if (e.code === 'Space' && !e.target.matches('input, textarea')) {
                e.preventDefault();
                this.togglePlayPause();
            }
            
            // Left/Right arrows for previous/next
            if (e.code === 'ArrowLeft' && e.altKey) {
                this.playPrevious();
            }
            if (e.code === 'ArrowRight' && e.altKey) {
                this.playNext();
            }
            
            // M for mute
            if (e.code === 'KeyM' && e.altKey) {
                this.toggleMute();
            }
        });
        
        // Window resize
        window.addEventListener('resize', () => this.handleResize());
        
        // Handle beforeunload to save state
        window.addEventListener('beforeunload', () => this.saveState());
        
        // Load saved state
        this.loadState();
    }

    setInitialState() {
        // Set initial song
        const initialSongId = 'm1';
        this.updateSongInfo(initialSongId);
        
        // Set initial volume display
        this.updateVolumeDisplay();
    }

    playSong(songId) {
        // Pause current audio if playing
        if (this.currentAudio && this.isPlaying) {
            this.currentAudio.pause();
        }
        
        // Get the audio element
        const audio = this.audioElements[songId];
        if (!audio) {
            console.error(`Audio element ${songId} not found`);
            return;
        }
        
        // Play the new audio
        audio.currentTime = 0;
        audio.play().catch(error => {
            console.error('Error playing audio:', error);
        });
        
        // Update state
        this.currentAudio = audio;
        this.currentSongId = songId;
        this.isPlaying = true;
        
        // Update UI
        this.updateSongInfo(songId);
        this.updatePlayPauseButton();
        this.updateActiveCard(songId);
        
        // Update current playlist index
        const index = this.currentPlaylist.indexOf(songId);
        if (index !== -1) {
            this.currentPlaylistIndex = index;
        }
        
        // Update progress immediately
        this.updateProgress(audio);
    }

    togglePlayPause() {
        if (!this.currentAudio) {
            // If no song is selected, play the first one
            this.playSong('m1');
            return;
        }
        
        if (this.isPlaying) {
            this.currentAudio.pause();
            this.isPlaying = false;
        } else {
            this.currentAudio.play().catch(error => {
                console.error('Error playing audio:', error);
            });
            this.isPlaying = true;
        }
        
        this.updatePlayPauseButton();
    }

    playPrevious() {
        if (!this.currentSongId) return;
        
        let index = this.currentPlaylist.indexOf(this.currentSongId);
        if (index === -1) index = 0;
        
        let prevIndex = index - 1;
        if (prevIndex < 0) prevIndex = this.currentPlaylist.length - 1;
        
        const prevSongId = this.currentPlaylist[prevIndex];
        this.playSong(prevSongId);
    }

    playNext() {
        if (!this.currentSongId) return;
        
        let index = this.currentPlaylist.indexOf(this.currentSongId);
        if (index === -1) index = 0;
        
        let nextIndex;
        if (this.isShuffle) {
            // Get random song that's not current
            do {
                nextIndex = Math.floor(Math.random() * this.currentPlaylist.length);
            } while (nextIndex === index && this.currentPlaylist.length > 1);
        } else {
            nextIndex = index + 1;
            if (nextIndex >= this.currentPlaylist.length) {
                if (this.isRepeat) {
                    nextIndex = 0;
                } else {
                    // Stop at last song
                    return;
                }
            }
        }
        
        const nextSongId = this.currentPlaylist[nextIndex];
        this.playSong(nextSongId);
    }

    handleSongEnd() {
        if (this.isRepeat) {
            // Repeat current song
            if (this.currentAudio) {
                this.currentAudio.currentTime = 0;
                this.currentAudio.play().catch(error => {
                    console.error('Error playing audio:', error);
                });
            }
        } else {
            // Play next song
            this.playNext();
        }
    }

    toggleShuffle() {
        this.isShuffle = !this.isShuffle;
        this.shuffleBtn.classList.toggle('active', this.isShuffle);
        
        if (this.isShuffle) {
            // Create shuffled playlist
            this.currentPlaylist = [...this.playlist].sort(() => Math.random() - 0.5);
        } else {
            // Restore original playlist order
            this.currentPlaylist = [...this.playlist];
        }
    }

    toggleRepeat() {
        this.isRepeat = !this.isRepeat;
        this.repeatBtn.classList.toggle('active', this.isRepeat);
    }

    toggleLike() {
        this.likeBtn.classList.toggle('active');
        const icon = this.likeBtn.querySelector('i');
        if (this.likeBtn.classList.contains('active')) {
            icon.classList.remove('far');
            icon.classList.add('fas');
        } else {
            icon.classList.remove('fas');
            icon.classList.add('far');
        }
    }

    seekTo(percentage) {
        if (this.currentAudio) {
            const time = (percentage / 100) * this.currentAudio.duration;
            this.currentAudio.currentTime = time;
        }
    }

    setVolume(value) {
        this.volume = Math.max(0, Math.min(1, value));
        
        // Update all audio elements
        Object.values(this.audioElements).forEach(audio => {
            audio.volume = this.volume;
        });
        
        // Update UI
        this.updateVolumeDisplay();
        
        // Save volume
        localStorage.setItem('musicPlayerVolume', this.volume);
    }

    toggleMute() {
        if (this.volume > 0) {
            this.lastVolume = this.volume;
            this.setVolume(0);
        } else {
            this.setVolume(this.lastVolume || 0.8);
        }
        
        this.updateVolumeDisplay();
    }

    updateProgress(audio) {
        if (audio !== this.currentAudio) return;
        
        const currentTime = audio.currentTime;
        const duration = audio.duration || 1; // Avoid division by zero
        
        const progressPercent = (currentTime / duration) * 100;
        
        // Update progress bar
        this.progress.style.width = `${progressPercent}%`;
        this.progressThumb.style.left = `${progressPercent}%`;
        this.progressInput.value = progressPercent;
        
        // Update time display
        this.currentTimeEl.textContent = this.formatTime(currentTime);
        
        // Update total time if needed
        if (duration && this.totalTimeEl.textContent === '0:00') {
            this.totalTimeEl.textContent = this.formatTime(duration);
        }
    }

    updateTotalTime() {
        if (this.currentAudio && this.currentAudio.duration) {
            this.totalTimeEl.textContent = this.formatTime(this.currentAudio.duration);
        }
    }

    updateSongInfo(songId) {
        // Find the card with this songId
        const card = document.querySelector(`.music-card[data-song="${songId}"]`);
        
        if (card) {
            const img = card.querySelector('img');
            const title = card.querySelector('.song-title');
            const artist = card.querySelector('.artist');
            
            if (img) this.currentSongImg.src = img.src;
            if (title) this.currentSongTitle.textContent = title.textContent;
            if (artist) this.currentSongArtist.textContent = artist.textContent;
        }
    }

    updateActiveCard(songId) {
        // Remove active class from all cards
        this.musicCards.forEach(card => {
            card.classList.remove('active-song');
        });
        
        // Add active class to current card
        const currentCard = document.querySelector(`.music-card[data-song="${songId}"]`);
        if (currentCard) {
            currentCard.classList.add('active-song');
        }
    }

    updatePlayPauseButton() {
        const icon = this.playPauseBtn.querySelector('i');
        if (this.isPlaying) {
            icon.classList.remove('fa-play');
            icon.classList.add('fa-pause');
        } else {
            icon.classList.remove('fa-pause');
            icon.classList.add('fa-play');
        }
    }

    updateVolumeDisplay() {
        const volumePercent = this.volume * 100;
        this.volumeLevel.style.width = `${volumePercent}%`;
        this.volumeInput.value = volumePercent;
        
        const icon = this.volumeBtn.querySelector('i');
        if (this.volume === 0) {
            icon.classList.remove('fa-volume-up', 'fa-volume-down');
            icon.classList.add('fa-volume-mute');
        } else if (this.volume < 0.5) {
            icon.classList.remove('fa-volume-up', 'fa-volume-mute');
            icon.classList.add('fa-volume-down');
        } else {
            icon.classList.remove('fa-volume-down', 'fa-volume-mute');
            icon.classList.add('fa-volume-up');
        }
    }

    formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    handleResize() {
        // Close sidebar on desktop
        if (window.innerWidth > 992 && this.sidebar.classList.contains('active')) {
            this.sidebar.classList.remove('active');
        }
    }

    saveState() {
        const state = {
            currentSongId: this.currentSongId,
            isPlaying: this.isPlaying,
            volume: this.volume,
            isShuffle: this.isShuffle,
            isRepeat: this.isRepeat,
            currentTime: this.currentAudio ? this.currentAudio.currentTime : 0
        };
        
        localStorage.setItem('musicPlayerState', JSON.stringify(state));
    }

    loadState() {
        const savedState = localStorage.getItem('musicPlayerState');
        if (savedState) {
            const state = JSON.parse(savedState);
            
            if (state.currentSongId) {
                this.playSong(state.currentSongId);
                if (this.currentAudio) {
                    this.currentAudio.currentTime = state.currentTime || 0;
                }
                this.isPlaying = state.isPlaying;
                
                if (state.isPlaying) {
                    setTimeout(() => {
                        if (this.currentAudio && !this.currentAudio.paused) {
                            this.currentAudio.play().catch(console.error);
                        }
                    }, 100);
                }
            }
            
            this.setVolume(state.volume || 0.8);
            this.isShuffle = state.isShuffle || false;
            this.isRepeat = state.isRepeat || false;
            
            // Update UI
            this.shuffleBtn.classList.toggle('active', this.isShuffle);
            this.repeatBtn.classList.toggle('active', this.isRepeat);
            this.updatePlayPauseButton();
        }
        
        // Load volume separately
        const savedVolume = localStorage.getItem('musicPlayerVolume');
        if (savedVolume) {
            this.setVolume(parseFloat(savedVolume));
        }
    }
}

// Initialize the music player when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Create and initialize the music player
    window.musicPlayer = new MusicPlayer();
    
    // Add animation delays to cards
    const cards = document.querySelectorAll('.music-card, .quick-play-card');
    cards.forEach((card, index) => {
        card.style.setProperty('--i', index);
    });
    
    // Add loading animation to images
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        img.addEventListener('load', function() {
            this.parentElement.classList.remove('loading');
        });
        
        if (!img.complete) {
            img.parentElement.classList.add('loading');
        }
    });
    
    // Add touch swipe support for mobile
    let touchStartX = 0;
    let touchStartY = 0;
    
    document.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
    });
    
    document.addEventListener('touchend', (e) => {
        const touchEndX = e.changedTouches[0].screenX;
        const touchEndY = e.changedTouches[0].screenY;
        const diffX = touchEndX - touchStartX;
        const diffY = touchEndY - touchStartY;
        
        // Horizontal swipe (minimize vertical movement)
        if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
            if (diffX > 0 && window.innerWidth <= 992) {
                // Swipe right - open sidebar
                document.querySelector('.sidebar').classList.add('active');
            } else if (diffX < 0) {
                // Swipe left - close sidebar
                document.querySelector('.sidebar').classList.remove('active');
            }
        }
    });
    
    // Add click outside to close modals
    document.addEventListener('click', (e) => {
        // Close sidebar when clicking outside on mobile
        if (window.innerWidth <= 992) {
            const sidebar = document.querySelector('.sidebar');
            const menuToggle = document.querySelector('.menu-toggle');
            
            if (sidebar.classList.contains('active') &&
                !sidebar.contains(e.target) &&
                !menuToggle.contains(e.target)) {
                sidebar.classList.remove('active');
            }
        }
    });
    
    // Add service worker for offline support
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').catch(console.error);
    }
    
    // Handle online/offline status
    window.addEventListener('online', () => {
        document.body.classList.remove('offline');
        showNotification('Back online!', 'success');
    });
    
    window.addEventListener('offline', () => {
        document.body.classList.add('offline');
        showNotification('You are offline', 'warning');
    });
    
    // Notification function
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            <span>${message}</span>
            <button class="notification-close"><i class="fas fa-times"></i></button>
        `;
        
        document.body.appendChild(notification);
        
        // Add animation
        setTimeout(() => notification.classList.add('show'), 10);
        
        // Auto remove
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
        
        // Close button
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        });
    }
});

// Add CSS for notifications
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background: #181818;
        color: white;
        padding: 16px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        display: flex;
        align-items: center;
        gap: 12px;
        z-index: 9999;
        transform: translateX(120%);
        transition: transform 0.3s ease;
        border-left: 4px solid #1DB954;
    }
    
    .notification.success {
        border-left-color: #1DB954;
    }
    
    .notification.warning {
        border-left-color: #FFA500;
    }
    
    .notification.show {
        transform: translateX(0);
    }
    
    .notification i:first-child {
        font-size: 20px;
    }
    
    .notification-close {
        background: none;
        border: none;
        color: #B3B3B3;
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        transition: background 0.2s;
    }
    
    .notification-close:hover {
        background: rgba(255, 255, 255, 0.1);
    }
    
    .offline .music-player {
        opacity: 0.7;
        pointer-events: none;
    }
`;

document.head.appendChild(notificationStyles);