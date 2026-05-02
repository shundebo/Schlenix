// Schlenix - 音乐播放器应用

class MusicPlayerApp {
    constructor() {
        this.instances = new Map();
    }

    open() {
        const windowId = windowManager.createWindow({
            title: '音乐播放器',
            icon: '🎵',
            width: 400,
            height: 500,
            content: this.getContent()
        });

        this.instances.set(windowId, {
            playlist: this.getDefaultPlaylist(),
            currentTrack: 0,
            isPlaying: false,
            audio: new Audio(),
            volume: 0.7
        });

        this.attachEvents(windowId);
    }

    getContent() {
        return `
            <div class="music-player-container">
                <div class="music-cover">
                    <div class="music-cover-placeholder">🎵</div>
                </div>
                <div class="music-info">
                    <div class="music-title">未播放</div>
                    <div class="music-artist">选择歌曲开始播放</div>
                </div>
                <div class="music-progress">
                    <span class="music-time-current">0:00</span>
                    <input type="range" class="music-progress-bar" min="0" max="100" value="0">
                    <span class="music-time-total">0:00</span>
                </div>
                <div class="music-controls">
                    <button class="music-btn music-prev" title="上一首">⏮️</button>
                    <button class="music-btn music-play" title="播放">▶️</button>
                    <button class="music-btn music-next" title="下一首">⏭️</button>
                    <button class="music-btn music-shuffle" title="随机播放">🔀</button>
                    <button class="music-btn music-repeat" title="循环播放">🔁</button>
                </div>
                <div class="music-volume">
                    <span>🔊</span>
                    <input type="range" class="music-volume-bar" min="0" max="100" value="70">
                </div>
                <div class="music-playlist">
                    <div class="playlist-header">播放列表</div>
                    <div class="playlist-items"></div>
                </div>
            </div>
        `;
    }

    getDefaultPlaylist() {
        return [
            { title: '示例歌曲 1', artist: '艺术家 A', duration: 180, url: '' },
            { title: '示例歌曲 2', artist: '艺术家 B', duration: 210, url: '' },
            { title: '示例歌曲 3', artist: '艺术家 C', duration: 195, url: '' },
            { title: '示例歌曲 4', artist: '艺术家 D', duration: 240, url: '' },
            { title: '示例歌曲 5', artist: '艺术家 E', duration: 165, url: '' }
        ];
    }

    attachEvents(windowId) {
        const content = windowManager.getWindowContent(windowId);
        const instance = this.instances.get(windowId);
        if (!content || !instance) return;

        const btnPlay = content.querySelector('.music-play');
        const btnPrev = content.querySelector('.music-prev');
        const btnNext = content.querySelector('.music-next');
        const btnShuffle = content.querySelector('.music-shuffle');
        const btnRepeat = content.querySelector('.music-repeat');
        const progressBar = content.querySelector('.music-progress-bar');
        const volumeBar = content.querySelector('.music-volume-bar');

        // 渲染播放列表
        this.renderPlaylist(windowId);

        // 播放/暂停
        btnPlay.addEventListener('click', () => this.togglePlay(windowId));

        // 上一首
        btnPrev.addEventListener('click', () => this.playPrevious(windowId));

        // 下一首
        btnNext.addEventListener('click', () => this.playNext(windowId));

        // 随机播放
        btnShuffle.addEventListener('click', () => {
            btnShuffle.classList.toggle('active');
            notify.info('随机播放', btnShuffle.classList.contains('active') ? '已开启' : '已关闭');
        });

        // 循环播放
        btnRepeat.addEventListener('click', () => {
            btnRepeat.classList.toggle('active');
            notify.info('循环播放', btnRepeat.classList.contains('active') ? '已开启' : '已关闭');
        });

        // 进度条
        progressBar.addEventListener('input', (e) => {
            if (instance.audio.duration) {
                instance.audio.currentTime = (e.target.value / 100) * instance.audio.duration;
            }
        });

        // 音量控制
        volumeBar.addEventListener('input', (e) => {
            instance.volume = e.target.value / 100;
            instance.audio.volume = instance.volume;
        });

        // 音频事件
        instance.audio.addEventListener('timeupdate', () => {
            this.updateProgress(windowId);
        });

        instance.audio.addEventListener('ended', () => {
            this.playNext(windowId);
        });

        // 窗口关闭时清理
        const window = windowManager.windows.get(windowId);
        if (window && window.element) {
            const closeBtn = window.element.querySelector('.window-control-btn.close');
            if (closeBtn) {
                const originalClose = closeBtn.onclick;
                closeBtn.onclick = () => {
                    instance.audio.pause();
                    this.instances.delete(windowId);
                    if (originalClose) originalClose();
                };
            }
        }
    }

    renderPlaylist(windowId) {
        const content = windowManager.getWindowContent(windowId);
        const instance = this.instances.get(windowId);
        if (!content || !instance) return;

        const playlistItems = content.querySelector('.playlist-items');
        playlistItems.innerHTML = instance.playlist.map((track, index) => `
            <div class="playlist-item ${index === instance.currentTrack ? 'active' : ''}" data-index="${index}">
                <span class="playlist-number">${index + 1}</span>
                <div class="playlist-track-info">
                    <div class="playlist-track-title">${track.title}</div>
                    <div class="playlist-track-artist">${track.artist}</div>
                </div>
                <span class="playlist-duration">${this.formatTime(track.duration)}</span>
            </div>
        `).join('');

        // 点击播放列表项
        playlistItems.querySelectorAll('.playlist-item').forEach(item => {
            item.addEventListener('click', () => {
                const index = parseInt(item.dataset.index);
                this.playTrack(windowId, index);
            });
        });
    }

    togglePlay(windowId) {
        const content = windowManager.getWindowContent(windowId);
        const instance = this.instances.get(windowId);
        if (!content || !instance) return;

        const btnPlay = content.querySelector('.music-play');

        if (instance.isPlaying) {
            instance.audio.pause();
            instance.isPlaying = false;
            btnPlay.textContent = '▶️';
        } else {
            // 模拟播放（因为没有真实音频文件）
            if (!instance.audio.src) {
                this.playTrack(windowId, instance.currentTrack);
            } else {
                instance.audio.play();
                instance.isPlaying = true;
                btnPlay.textContent = '⏸️';
            }
        }
    }

    playTrack(windowId, index) {
        const content = windowManager.getWindowContent(windowId);
        const instance = this.instances.get(windowId);
        if (!content || !instance) return;

        instance.currentTrack = index;
        const track = instance.playlist[index];

        // 更新界面
        const titleEl = content.querySelector('.music-title');
        const artistEl = content.querySelector('.music-artist');
        titleEl.textContent = track.title;
        artistEl.textContent = track.artist;

        // 模拟播放
        notify.info('正在播放', `${track.title} - ${track.artist}`);
        
        const btnPlay = content.querySelector('.music-play');
        btnPlay.textContent = '⏸️';
        instance.isPlaying = true;

        this.renderPlaylist(windowId);
    }

    playPrevious(windowId) {
        const instance = this.instances.get(windowId);
        if (!instance) return;

        const prevIndex = instance.currentTrack > 0 ? instance.currentTrack - 1 : instance.playlist.length - 1;
        this.playTrack(windowId, prevIndex);
    }

    playNext(windowId) {
        const instance = this.instances.get(windowId);
        if (!instance) return;

        const nextIndex = instance.currentTrack < instance.playlist.length - 1 ? instance.currentTrack + 1 : 0;
        this.playTrack(windowId, nextIndex);
    }

    updateProgress(windowId) {
        const content = windowManager.getWindowContent(windowId);
        const instance = this.instances.get(windowId);
        if (!content || !instance) return;

        const progressBar = content.querySelector('.music-progress-bar');
        const currentTimeEl = content.querySelector('.music-time-current');
        const totalTimeEl = content.querySelector('.music-time-total');

        if (instance.audio.duration) {
            const progress = (instance.audio.currentTime / instance.audio.duration) * 100;
            progressBar.value = progress;
            currentTimeEl.textContent = this.formatTime(instance.audio.currentTime);
            totalTimeEl.textContent = this.formatTime(instance.audio.duration);
        }
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${String(secs).padStart(2, '0')}`;
    }
}

// 注册应用
if (!window.apps) window.apps = {};
window.apps['music-player'] = new MusicPlayerApp();