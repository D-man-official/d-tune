// Auto-bind btn1..btn11 to m1..m11
const TOTAL = 11;

// build array of {btn, audio}
const tracks = [];
for (let i = 1; i <= TOTAL; i++) {
  const btn = document.querySelector(`.btn${i}`);
  const audio = document.querySelector(`.m${i}`);
  if (btn && audio) tracks.push({ btn, audio, index: i });
}

// pause all audios except the one provided, and reset icons
function pauseAllExcept(exceptAudio) {
  tracks.forEach(({ btn, audio }) => {
    if (audio !== exceptAudio) {
      audio.pause();
      btn.classList.remove('fa-pause');
      btn.classList.add('fa-circle-play');
    }
  });
}

// attach listeners
tracks.forEach(({ btn, audio }) => {
  // click toggles play/pause and enforces single-play behavior
  btn.addEventListener('click', () => {
    if (audio.paused) {
      pauseAllExcept(audio); // stop others first
      audio.play();
      btn.classList.remove('fa-circle-play');
      btn.classList.add('fa-pause');
    } else {
      audio.pause();
      btn.classList.remove('fa-pause');
      btn.classList.add('fa-circle-play');
    }
  });

  // when a track ends naturally, reset its button icon
  audio.addEventListener('ended', () => {
    btn.classList.remove('fa-pause');
    btn.classList.add('fa-circle-play');
  });
});
