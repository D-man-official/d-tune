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
    this.currentPlaylistIndex = 0;
    this.likedSongs = new Set();
    this.currentView = 'home'; // 'home' or 'liked' or 'search'
    
    // Load liked songs from localStorage
    this.loadLikedSongs();
    
    this.init();
  }

  loadLikedSongs() {
    const saved = localStorage.getItem('likedSongs');
    if (saved) {
      this.likedSongs = new Set(JSON.parse(saved));
    }
  }

  saveLikedSongs() {
    localStorage.setItem('likedSongs', JSON.stringify([...this.likedSongs]));
  }

  isLiked(songId) {
    return this.likedSongs.has(songId);
  }

  toggleLike(songId = this.currentSongId) {
    if (!songId) return;
    
    if (this.likedSongs.has(songId)) {
      this.likedSongs.delete(songId);
    } else {
      this.likedSongs.add(songId);
    }
    
    this.saveLikedSongs();
    this.updateLikeButton();
    
    // If we're in liked view, refresh the list
    if (this.currentView === 'liked') {
      this.showLikedSongs();
    }
  }

  getLikedSongsArray() {
    return [...this.likedSongs];
  }

  init() {
    this.cacheElements();
    this.initAudioElements();
    this.setupEventListeners();
    this.setInitialState();
    this.setVolume(this.volume);
  }

  cacheElements() {
    this.playPauseBtn = document.getElementById("play-pause-btn");
    this.prevBtn = document.getElementById("prev-btn");
    this.nextBtn = document.getElementById("next-btn");
    this.shuffleBtn = document.getElementById("shuffle-btn");
    this.repeatBtn = document.getElementById("repeat-btn");
    this.volumeBtn = document.getElementById("volume-btn");
    this.likeBtn = document.getElementById("player-like-btn");

    this.progress = document.getElementById("progress");
    this.progressThumb = document.getElementById("progress-thumb");
    this.progressInput = document.getElementById("progress-input");
    this.currentTimeEl = document.getElementById("current-time");
    this.totalTimeEl = document.getElementById("total-time");

    this.volumeLevel = document.getElementById("volume-level");
    this.volumeInput = document.getElementById("volume-input");

    this.currentSongImg = document.getElementById("current-song-img");
    this.currentSongTitle = document.getElementById("current-song-title");
    this.currentSongArtist = document.getElementById("current-song-artist");

    this.musicCards = document.querySelectorAll(".music-card");
    this.quickPlayCards = document.querySelectorAll(".quick-play-card");
    this.cardPlayBtns = document.querySelectorAll(".card-play-btn");
    this.quickPlayIcons = document.querySelectorAll(".play-icon");

    this.menuToggle = document.querySelector(".menu-toggle");
    this.sidebar = document.querySelector(".sidebar");
    this.searchToggle = document.querySelector(".search-toggle");
    
    // Navigation elements
    this.homeNav = document.getElementById("home-nav");
    this.likedNav = document.getElementById("liked-nav");
    this.sidebarSearchNav = document.getElementById("sidebar-search-nav");
    this.mobileHomeNav = document.getElementById("mobile-home-nav");
    this.mobileLikedNav = document.getElementById("mobile-liked-nav");
    this.mobileSearchNav = document.getElementById("mobile-search-nav");
    
    // Content sections
    this.homeContent = document.getElementById("homeContent");
    this.likedContent = document.getElementById("likedContent");
    this.likedSongsList = document.getElementById("likedSongsList");
    this.likedCount = document.getElementById("likedCount");
    this.playAllLiked = document.getElementById("playAllLiked");
    
    // Search elements
    this.mobileSearch = document.getElementById("mobileSearch");
    this.mobileSearchInput = document.getElementById("mobileSearchInput");
    this.closeMobileSearch = document.getElementById("closeMobileSearch");
    this.mobileSearchResults = document.getElementById("mobileSearchResults");

    this.playlist = Array.from(document.querySelectorAll(".music-card")).map(
      (card) => card.getAttribute("data-song"),
    ).filter(id => id && id !== '');
    this.currentPlaylist = [...this.playlist];
  }

  initAudioElements() {
    const audioContainer = document.querySelector(".audio-container");
    const audioElements = audioContainer.querySelectorAll("audio");

    audioElements.forEach((audio) => {
      const id = audio.id;
      this.audioElements[id] = audio;
      audio.volume = this.volume;

      audio.addEventListener("timeupdate", () => this.updateProgress(audio));
      audio.addEventListener("ended", () => this.handleSongEnd());
      audio.addEventListener("loadedmetadata", () => {
        if (audio === this.currentAudio) {
          this.updateTotalTime();
        }
      });
    });
  }

  setupEventListeners() {
    // Player controls
    this.playPauseBtn.addEventListener("click", () => this.togglePlayPause());
    this.prevBtn.addEventListener("click", () => this.playPrevious());
    this.nextBtn.addEventListener("click", () => this.playNext());
    this.shuffleBtn.addEventListener("click", () => this.toggleShuffle());
    this.repeatBtn.addEventListener("click", () => this.toggleRepeat());
    this.likeBtn.addEventListener("click", () => this.toggleLike());

    // Progress bar
    this.progressInput.addEventListener("input", (e) =>
      this.seekTo(e.target.value),
    );
    this.progressInput.addEventListener(
      "mousedown",
      () => (this.isSeeking = true),
    );
    this.progressInput.addEventListener("mouseup", () => {
      this.isSeeking = false;
      if (this.currentAudio) {
        const time =
          (this.progressInput.value / 100) * this.currentAudio.duration;
        this.currentAudio.currentTime = time;
      }
    });

    // Volume control
    this.volumeInput.addEventListener("input", (e) =>
      this.setVolume(e.target.value / 100),
    );
    this.volumeBtn.addEventListener("click", () => this.toggleMute());

    // Music cards
    this.musicCards.forEach((card) => {
      card.addEventListener("click", (e) => {
        if (!e.target.closest(".card-play-btn")) {
          const songId = card.getAttribute("data-song");
          if (songId) this.playSong(songId);
        }
      });

      const playBtn = card.querySelector(".card-play-btn");
      if (playBtn) {
        playBtn.addEventListener("click", () => {
          const songId = card.getAttribute("data-song");
          if (songId) this.playSong(songId);
        });
      }
    });

    // Quick play cards
    this.quickPlayCards.forEach((card) => {
      card.addEventListener("click", () => {
        const songId = card.getAttribute("data-song");
        if (songId) this.playSong(songId);
      });
    });

    // Navigation
    this.homeNav?.addEventListener("click", (e) => {
      e.preventDefault();
      this.showHome();
    });
    
    this.likedNav?.addEventListener("click", (e) => {
      e.preventDefault();
      this.showLikedSongs();
    });
    
    // Sidebar search navigation
    this.sidebarSearchNav?.addEventListener("click", (e) => {
      e.preventDefault();
      this.openMobileSearch();
    });
    
    // Mobile navigation
    this.mobileHomeNav?.addEventListener("click", (e) => {
      e.preventDefault();
      this.showHome();
    });
    
    this.mobileLikedNav?.addEventListener("click", (e) => {
      e.preventDefault();
      this.showLikedSongs();
    });
    
    // Mobile bottom nav search
    this.mobileSearchNav?.addEventListener("click", (e) => {
      e.preventDefault();
      this.openMobileSearch();
    });
    
    this.playAllLiked?.addEventListener("click", () => {
      this.playAllLikedSongs();
    });

    // Mobile menu toggle
    if (this.menuToggle) {
      this.menuToggle.addEventListener("click", () => {
        this.sidebar.classList.toggle("active");
      });
    }

    // Mobile search toggle (top bar)
    if (this.searchToggle) {
      this.searchToggle.addEventListener("click", () => {
        this.openMobileSearch();
      });
    }

    // Close mobile search
    if (this.closeMobileSearch) {
      this.closeMobileSearch.addEventListener("click", () => {
        this.closeMobileSearchFunc();
      });
    }

    // Search input event
    if (this.mobileSearchInput) {
      this.mobileSearchInput.addEventListener("input", () => {
        this.performSearch(this.mobileSearchInput.value);
      });
    }

    // Close sidebar when clicking outside on mobile
    document.addEventListener("click", (e) => {
      if (
        window.innerWidth <= 992 &&
        this.sidebar.classList.contains("active") &&
        !this.sidebar.contains(e.target) &&
        !this.menuToggle.contains(e.target)
      ) {
        this.sidebar.classList.remove("active");
      }
    });

    // Keyboard shortcuts
    document.addEventListener("keydown", (e) => {
      if (e.code === "Space" && !e.target.matches("input, textarea")) {
        e.preventDefault();
        this.togglePlayPause();
      }
      if (e.code === "ArrowLeft" && e.altKey) this.playPrevious();
      if (e.code === "ArrowRight" && e.altKey) this.playNext();
      if (e.code === "KeyM" && e.altKey) this.toggleMute();
      if (e.code === "KeyL" && e.altKey) this.toggleLike();
    });

    window.addEventListener("resize", () => this.handleResize());
    window.addEventListener("beforeunload", () => this.saveState());
    this.loadState();
    
    // FAKIRA sidebar nav
    const fakiraLink = document.getElementById("fakira-link");
    const fakiraSection = document.getElementById("fakira-section");
    if (fakiraLink && fakiraSection) {
      fakiraLink.addEventListener("click", () => {
        this.showHome();
        setTimeout(() => {
          fakiraSection.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
      });
    }
  }

  openMobileSearch() {
    this.currentView = 'search';
    if (this.mobileSearch) {
      this.mobileSearch.classList.add("active");
      if (this.homeContent) this.homeContent.style.display = "none";
      if (this.likedContent) this.likedContent.style.display = "none";
      if (this.mobileSearchInput) {
        this.mobileSearchInput.focus();
        this.mobileSearchInput.value = "";
      }
      if (this.mobileSearchResults) this.mobileSearchResults.innerHTML = "";
    }
    
    // Update active nav states
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.remove('active');
    });
    this.sidebarSearchNav?.classList.add('active');
    this.mobileSearchNav?.classList.add('active');
  }

  closeMobileSearchFunc() {
    if (this.mobileSearch) {
      this.mobileSearch.classList.remove("active");
      if (this.homeContent) this.homeContent.style.display = "";
      if (this.mobileSearchInput) this.mobileSearchInput.value = "";
      if (this.mobileSearchResults) this.mobileSearchResults.innerHTML = "";
    }
    this.showHome();
  }

  performSearch(query) {
    if (!this.mobileSearchResults) return;
    
    const q = query.toLowerCase().trim();
    this.mobileSearchResults.innerHTML = "";

    if (!q) return;

    document.querySelectorAll(".music-card").forEach((card) => {
      const title = card.querySelector(".song-title")?.textContent || "";
      const artist = card.querySelector(".artist")?.textContent || "";
      const img = card.querySelector("img")?.src || "";
      const songId = card.dataset.song;

      if (title.toLowerCase().includes(q) || artist.toLowerCase().includes(q)) {
        const div = document.createElement("div");
        div.className = "mobile-search-card";
        div.innerHTML = `
          <img src="${img}">
          <div class="mobile-search-info">
            <h4>${title}</h4>
            <p>${artist}</p>
          </div>
        `;

        div.onclick = () => {
          this.playSong(songId);
          this.closeMobileSearchFunc();
        };

        this.mobileSearchResults.appendChild(div);
      }
    });
  }

  setInitialState() {
    const initialSongId = "m4";
    this.updateSongInfo(initialSongId);
    this.updateVolumeDisplay();
    this.updateLikeButton();
  }

  showHome() {
    this.currentView = 'home';
    if (this.homeContent) this.homeContent.style.display = "";
    if (this.likedContent) this.likedContent.style.display = "none";
    if (this.mobileSearch) this.mobileSearch.classList.remove("active");
    
    // Update active nav states
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.remove('active');
    });
    this.homeNav?.classList.add('active');
    this.mobileHomeNav?.classList.add('active');
    
    // Set playlist to all songs
    this.currentPlaylist = [...this.playlist];
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  showLikedSongs() {
    this.currentView = 'liked';
    if (this.homeContent) this.homeContent.style.display = "none";
    if (this.likedContent) this.likedContent.style.display = "";
    if (this.mobileSearch) this.mobileSearch.classList.remove("active");
    
    // Update active nav states
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.remove('active');
    });
    this.likedNav?.classList.add('active');
    this.mobileLikedNav?.classList.add('active');
    
    // Update liked count
    const likedCount = this.likedSongs.size;
    if (this.likedCount) {
      this.likedCount.textContent = `${likedCount} ${likedCount === 1 ? 'song' : 'songs'}`;
    }
    
    // Clear and populate liked songs list
    if (this.likedSongsList) {
      this.likedSongsList.innerHTML = '';
      
      if (likedCount === 0) {
        this.likedSongsList.innerHTML = `
          <div class="empty-liked">
            <i class="fas fa-heart"></i>
            <h3>No liked songs yet</h3>
            <p>Like songs by clicking the heart icon</p>
          </div>
        `;
        return;
      }
      
      // Set playlist to liked songs only
      this.currentPlaylist = this.getLikedSongsArray();
      
      // Create list items for each liked song
      this.currentPlaylist.forEach((songId, index) => {
        const originalCard = document.querySelector(`.music-card[data-song="${songId}"]`);
        if (!originalCard) return;
        
        const title = originalCard.querySelector(".song-title")?.textContent || "";
        const artist = originalCard.querySelector(".artist")?.textContent || "";
        const img = originalCard.querySelector("img")?.src || "";
        
        const item = document.createElement("div");
        item.className = "liked-song-item";
        item.setAttribute("data-song", songId);
        
        if (songId === this.currentSongId) {
          item.classList.add("active");
        }
        
        item.innerHTML = `
          <div class="liked-song-number">${index + 1}</div>
          <div class="liked-song-image">
            <img src="${img}" alt="${title}">
          </div>
          <div class="liked-song-info">
            <h4>${title}</h4>
            <p>${artist}</p>
          </div>
          <button class="liked-song-like">
            <i class="fas fa-heart"></i>
          </button>
          <div class="liked-song-duration">2:30</div>
        `;
        
        // Add click events
        item.addEventListener("click", (e) => {
          if (!e.target.closest('.liked-song-like')) {
            this.playSong(songId);
          }
        });
        
        const likeBtn = item.querySelector('.liked-song-like');
        likeBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          this.toggleLike(songId);
        });
        
        this.likedSongsList.appendChild(item);
      });
    }
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  playAllLikedSongs() {
    const likedSongs = this.getLikedSongsArray();
    if (likedSongs.length === 0) return;
    
    this.currentPlaylist = [...likedSongs];
    this.currentPlaylistIndex = 0;
    this.playSong(likedSongs[0]);
  }

  playSong(songId) {
    if (!songId || !this.audioElements[songId]) return;
    
    // Pause current audio if playing
    if (this.currentAudio && this.isPlaying) {
      this.currentAudio.pause();
    }
    
    const audio = this.audioElements[songId];
    audio.currentTime = 0;
    audio.play().catch((error) => {
      console.error("Error playing audio:", error);
    });
    
    this.currentAudio = audio;
    this.currentSongId = songId;
    this.isPlaying = true;
    
    this.updateSongInfo(songId);
    this.updatePlayPauseButton();
    this.updateActiveCard(songId);
    this.updateLikeButton();
    
    // Update current playlist index
    const index = this.currentPlaylist.indexOf(songId);
    if (index !== -1) {
      this.currentPlaylistIndex = index;
    }
    
    this.updateProgress(audio);
    
    // Update active state in liked songs list
    if (this.currentView === 'liked' && this.likedSongsList) {
      document.querySelectorAll('.liked-song-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-song') === songId) {
          item.classList.add('active');
        }
      });
    }
  }

  togglePlayPause() {
    if (!this.currentAudio) {
      const firstSong = this.currentPlaylist[0];
      if (firstSong) {
        this.playSong(firstSong);
      }
      return;
    }

    if (this.isPlaying) {
      this.currentAudio.pause();
      this.isPlaying = false;
    } else {
      this.currentAudio.play().catch((error) => {
        console.error("Error playing audio:", error);
      });
      this.isPlaying = true;
    }

    this.updatePlayPauseButton();
  }

  playPrevious() {
    if (!this.currentSongId || this.currentPlaylist.length === 0) return;
    
    let index = this.currentPlaylist.indexOf(this.currentSongId);
    if (index === -1) index = 0;
    
    let prevIndex = index - 1;
    if (prevIndex < 0) prevIndex = this.currentPlaylist.length - 1;
    
    const prevSongId = this.currentPlaylist[prevIndex];
    this.playSong(prevSongId);
  }

  playNext() {
    if (!this.currentSongId || this.currentPlaylist.length === 0) return;
    
    let index = this.currentPlaylist.indexOf(this.currentSongId);
    if (index === -1) index = 0;
    
    let nextIndex;
    if (this.isShuffle) {
      do {
        nextIndex = Math.floor(Math.random() * this.currentPlaylist.length);
      } while (nextIndex === index && this.currentPlaylist.length > 1);
    } else {
      nextIndex = index + 1;
      if (nextIndex >= this.currentPlaylist.length) {
        if (this.isRepeat) {
          nextIndex = 0;
        } else {
          return;
        }
      }
    }
    
    const nextSongId = this.currentPlaylist[nextIndex];
    this.playSong(nextSongId);
  }

  handleSongEnd() {
    if (this.isRepeat) {
      if (this.currentAudio) {
        this.currentAudio.currentTime = 0;
        this.currentAudio.play().catch((error) => {
          console.error("Error playing audio:", error);
        });
      }
    } else {
      this.playNext();
    }
  }

  toggleShuffle() {
    this.isShuffle = !this.isShuffle;
    this.shuffleBtn.classList.toggle("active", this.isShuffle);
  }

  toggleRepeat() {
    this.isRepeat = !this.isRepeat;
    this.repeatBtn.classList.toggle("active", this.isRepeat);
  }

  updateLikeButton() {
    if (!this.likeBtn) return;
    
    const icon = this.likeBtn.querySelector("i");
    if (this.isLiked(this.currentSongId)) {
      this.likeBtn.classList.add("active");
      icon.className = "fas fa-heart";
    } else {
      this.likeBtn.classList.remove("active");
      icon.className = "far fa-heart";
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
    Object.values(this.audioElements).forEach((audio) => {
      audio.volume = this.volume;
    });
    this.updateVolumeDisplay();
    localStorage.setItem("musicPlayerVolume", this.volume);
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
    const duration = audio.duration || 1;
    const progressPercent = (currentTime / duration) * 100;

    this.progress.style.width = `${progressPercent}%`;
    this.progressThumb.style.left = `${progressPercent}%`;
    this.progressInput.value = progressPercent;
    this.currentTimeEl.textContent = this.formatTime(currentTime);

    if (duration && this.totalTimeEl.textContent === "0:00") {
      this.totalTimeEl.textContent = this.formatTime(duration);
    }
  }

  updateTotalTime() {
    if (this.currentAudio && this.currentAudio.duration) {
      this.totalTimeEl.textContent = this.formatTime(this.currentAudio.duration);
    }
  }

  updateSongInfo(songId) {
    const card = document.querySelector(`.music-card[data-song="${songId}"]`);
    if (card) {
      const img = card.querySelector("img");
      const title = card.querySelector(".song-title");
      const artist = card.querySelector(".artist");

      if (img) this.currentSongImg.src = img.src;
      if (title) this.currentSongTitle.textContent = title.textContent;
      if (artist) this.currentSongArtist.textContent = artist.textContent;
    }
    this.updateLikeButton();
  }

  updateActiveCard(songId) {
    this.musicCards.forEach((card) => {
      card.classList.remove("active-song");
    });

    const currentCard = document.querySelector(`.music-card[data-song="${songId}"]`);
    if (currentCard) {
      currentCard.classList.add("active-song");
    }
  }

  updatePlayPauseButton() {
    const icon = this.playPauseBtn.querySelector("i");
    if (this.isPlaying) {
      icon.classList.remove("fa-play");
      icon.classList.add("fa-pause");
    } else {
      icon.classList.remove("fa-pause");
      icon.classList.add("fa-play");
    }
  }

  updateVolumeDisplay() {
    const volumePercent = this.volume * 100;
    this.volumeLevel.style.width = `${volumePercent}%`;
    this.volumeInput.value = volumePercent;

    const icon = this.volumeBtn.querySelector("i");
    if (this.volume === 0) {
      icon.classList.remove("fa-volume-up", "fa-volume-down");
      icon.classList.add("fa-volume-mute");
    } else if (this.volume < 0.5) {
      icon.classList.remove("fa-volume-up", "fa-volume-mute");
      icon.classList.add("fa-volume-down");
    } else {
      icon.classList.remove("fa-volume-down", "fa-volume-mute");
      icon.classList.add("fa-volume-up");
    }
  }

  formatTime(seconds) {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  handleResize() {
    if (window.innerWidth > 992 && this.sidebar.classList.contains("active")) {
      this.sidebar.classList.remove("active");
    }
  }

  saveState() {
    const state = {
      currentSongId: this.currentSongId,
      isPlaying: this.isPlaying,
      volume: this.volume,
      isShuffle: this.isShuffle,
      isRepeat: this.isRepeat,
      currentTime: this.currentAudio ? this.currentAudio.currentTime : 0,
      currentView: this.currentView
    };
    localStorage.setItem("musicPlayerState", JSON.stringify(state));
  }

  loadState() {
    const savedState = localStorage.getItem("musicPlayerState");
    if (savedState) {
      const state = JSON.parse(savedState);
      
      if (state.currentSongId) {
        const audio = this.audioElements[state.currentSongId];
        if (audio) {
          this.currentAudio = audio;
          this.currentSongId = state.currentSongId;
          audio.currentTime = state.currentTime || 0;
          this.isPlaying = false;
          
          this.updateSongInfo(state.currentSongId);
          this.updatePlayPauseButton();
          this.updateActiveCard(state.currentSongId);
        }
      }
      
      this.setVolume(state.volume || 0.8);
      this.isShuffle = state.isShuffle || false;
      this.isRepeat = state.isRepeat || false;
      this.shuffleBtn.classList.toggle("active", this.isShuffle);
      this.repeatBtn.classList.toggle("active", this.isRepeat);
      this.updatePlayPauseButton();
      
      // Restore view
      if (state.currentView === 'liked') {
        setTimeout(() => this.showLikedSongs(), 100);
      } else if (state.currentView === 'search') {
        setTimeout(() => this.openMobileSearch(), 100);
      }
    }
    
    const savedVolume = localStorage.getItem("musicPlayerVolume");
    if (savedVolume) {
      this.setVolume(parseFloat(savedVolume));
    }
  }
}

// Initialize the music player when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.musicPlayer = new MusicPlayer();
  
  // Add animation delays to cards
  const cards = document.querySelectorAll(".music-card, .quick-play-card");
  cards.forEach((card, index) => {
    card.style.setProperty("--i", index);
  });
});