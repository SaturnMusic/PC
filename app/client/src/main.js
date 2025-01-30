import Vue from 'vue';
import App from './App.vue';
import router from './js/router';
import vuetify from './js/vuetify';
import axios from 'axios';
import VueEsc from 'vue-esc';
import i18n from './js/i18n';
import { io } from "socket.io-client";
import { Rooms } from './js/rooms';

//Globals
let ipcRenderer;
//Axios
let axiosInstance = axios.create({
    baseURL: process.env.NODE_ENV === 'development' ? "http://localhost:10069" : `${window.location.origin}`,
    timeout: 16000,
    responseType: 'json'
});
Vue.prototype.$axios = axiosInstance;

//Duration formatter
Vue.prototype.$duration = (ms) => {
    if (isNaN(ms) || ms < 1) return '0:00';
    let s = Math.floor(ms / 1000);
    let hours = Math.floor(s / 3600);
    s %= 3600;
    let min = Math.floor(s / 60);
    let sec = s % 60;
    if (hours == 0) return `${min}:${sec.toString().padStart(2, '0')}`;
    return `${hours}:${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
};

//Abbrevation 
Vue.prototype.$abbreviation = (n) => {
    if (!n || n == 0) return '0';
    var base = Math.floor(Math.log(Math.abs(n)) / Math.log(1000));
    var suffix = 'KMB' [base - 1];
    return suffix ? String(n / Math.pow(1000, base)).substring(0, 3) + suffix : '' + n;
}

//Add thousands commas
Vue.prototype.$numberString = (n) => {
    if (!n || n == 0) return '0';
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

//Filesize
Vue.prototype.$filesize = (bytes) => {
    if (bytes === 0) return '0 B';
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
}

//Sockets
Vue.prototype.$io = io("http://localhost:10069", {
    path: '/socket'
});

//Rooms
Vue.use(new Rooms('https://clubs.saturn.kim'));

Vue.config.productionTip = false;
Vue.use(VueEsc);

new Vue({
    data: {
        //Globals
        settings: {},
        profile: {},
        authorized: false,
        loadingPromise: null,

        downloads: {},

        //Player
        track: null,
        audio: null,
        volume: 0.00,
        //0 = Stopped, 1 = Paused, 2 = Playing, 3 = Loading
        state: 0,
        loaders: 0,
        playbackInfo: {},
        position: 0,
        muted: false,
        savedindex: 0,
        //Gapless playback meta
        gapless: {
            promise: null,
            audio: null,
            info: null,
            track: null
        },

        //0 - normal, 1 - repeat list, 2 - repeat track
        repeat: 0,
        shuffled: false,

        //Library cache
        libraryTracks: [],

        //Queue data
        queue: {
            data: [],
            index: -1,
            source: {
                text: 'None',
                source: 'none',
                data: 'none'
            }
        },

        //Used to prevent double listen logging
        logListenId: null,

        //flow mgmt
        lastid: null,

        //shuffle mgmt
        lastidshfle: null,

        globalSnackbar: null
    },

    methods: {
        // PLAYBACK METHODS
        isPlaying() {
            return this.state == 2;
        },

        play() {
            if (!this.audio || this.state != 1) return;

            // https://developer.chrome.com/blog/play-request-was-interrupted
            var playingPromise = this.audio.play();

            if (playingPromise !== undefined) {
                playingPromise.then(_ => {
                    console.log(_) // should be 'undefined'
                    this.$rooms.togglePlayback(true);
                    this.state = 2;
                })
            .catch(error => {
                    console.log(error);
                    this.skip(1).then(this.skip(-1))
                })  
            }          
        },
        pause() {
            if (!this.audio || this.state != 2) return;
            this.audio.pause();
            this.$rooms.togglePlayback(false);
            this.state = 1;
        },
        toggle() {
            if (this.isPlaying()) return this.pause();
            this.play();
        },
        seek(t, room = true) {
            if (!this.audio || isNaN(t) || !t) return;
            //ms -> s
            this.audio.currentTime = (t / 1000);
            this.position = t;

            if (room)
                this.$rooms.sync();

            this.updateState();
        },

        //Current track duration
        duration() {
            //Prevent 0 division
            if (!this.audio) return 1;
            return this.audio.duration * 1000;
        },

        //Replace queue, has to make clone of data to not keep references
        replaceQueue(newQueue) {
            this.queue.data = Object.assign([], newQueue);
            this.shuffled = false;
        },
        //Add track to queue at index
        addTrackIndex(track, index) {
            this.queue.data.splice(index, 0, track);
        },

        //Play at index in queue
        async playIndex(index) {
            if (index >= this.queue.data.length || index < 0) return;

            //Rooms
            if (this.$rooms.room) {
                this.$rooms.playIndex(index);
                return;
            }

            this.queue.index = index;
            await this.playTrack(this.queue.data[this.queue.index]);
            this.play();
            this.savePlaybackInfo();
        },
        //Skip n tracks, can be negative
        async skip(n) {
            this.pause()
            let newIndex = this.queue.index + n;
            //Out of bounds
            if (newIndex < 0 || newIndex >= this.queue.data.length) return;
            await this.playIndex(newIndex);
        },
        shuffle() {
            if (!this.shuffled) {
                //Save positions
                for (let i = 0; i < this.queue.data.length; i++)
                    this.queue.data[i]._position = i + 1;

                //Shuffle
                for (let i = this.queue.data.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [this.queue.data[i], this.queue.data[j]] = [this.queue.data[j], this.queue.data[i]];
                }
                //Update index
                this.queue.index = this.queue.data.findIndex(t => t.id == this.track.id);
                this.shuffled = true;
                return;
            }
            //Restore unshuffled queue
            if (this.shuffled) {
                this.queue.data.sort((a, b) => (a._position || 10000) - (b._position || 10000));
                this.queue.index = this.queue.data.findIndex(t => t.id == this.track.id);
                this.shuffled = false;
                return;
            }
        },

        //Skip wrapper
        skipNext() {
            this.skip(1);
            this.savePlaybackInfo();
        },
        toggleMute() {
            if (this.audio) this.audio.muted = !this.audio.muted;
            this.muted = !this.muted;
        },

        async playTrack(track) {
            if (!track || !track.streamUrl) return;
            this.resetGapless();

            this.track = track;
            this.loaders++;
            this.state = 3;
            //Stop audio
            let autoplay = (this.state == 2);
            if (this.audio) this.audio.pause();
            if (this.audio) this.audio.currentTime = 0;

            //Load track meta
            let playbackInfo = await this.loadPlaybackInfo(track.streamUrl, track.duration);
            if (!playbackInfo) {
                this.loaders--;
                this.skipNext();
                return;
            }
            this.playbackInfo = playbackInfo;

            //Stream URL
            let url;
            if (this.playbackInfo.encrypted)
                url = `${process.env.NODE_ENV === 'development' ? "http://localhost:10069" : window.location.origin}${this.playbackInfo.url}`;
            else
                url = this.playbackInfo.direct;
            //Cancel loading
            this.loaders--;
            if (this.loaders > 0) {
                return;
            }

            //Audio
            this.audio = new Audio(url);
            this.configureAudio();
            this.state = 1;
            if (autoplay) this.play();
            //MediaSession
            this.updateMediaSession();
        },
        //Configure html audio element
        configureAudio() {
            //Listen position updates
            this.audio.addEventListener('timeupdate', async() => {
                this.position = this.audio.currentTime * 1000;

                //Rooms
                if (this.$rooms.room) return;

                this.loadSTL();
                this.loadShuffle();

                //Gapless playback
                if (this.position >= (this.duration() - (this.settings.crossfadeDuration + 7500)) && this.state == 2) {
                    if (this.repeat != 2)
                        this.loadGapless();
                }

                //Crossfade
                if (this.settings.crossfadeDuration > 0 && this.position >= (this.duration() - this.settings.crossfadeDuration) && this.state == 2 && this.gapless.audio && !this.gapless.crossfade && this.gapless.track) {
                    this.gapless.crossfade = true;
                    let currentVolume = this.audio.volume;
                    let oldAudio = this.audio;
                    this.audio = this.gapless.audio;
                    
                    var playingPromise = this.audio.play();

                    if (playingPromise !== undefined) {
                        playingPromise.then(_ => {
                            console.log(_)
                        })
                    .catch(error => {
                            console.log(error);
                            this.skip(1).then(this.skip(-1))
                        })  
                    }  

                    //Update meta
                    this.playbackInfo = this.gapless.info;
                    this.track = this.gapless.track;
                    this.queue.index = this.gapless.index;

                    this.configureAudio();
                    this.updateMediaSession();

                    this.audio.volume = 0.0;
                    let volumeStep = currentVolume / (this.settings.crossfadeDuration / 50);
                    for (let i = 0; i < (this.settings.crossfadeDuration / 50); i++) {
                        if ((oldAudio.volume - volumeStep) > 0)
                            oldAudio.volume -= volumeStep;
                        if ((this.audio.volume + volumeStep) >= 1.0 || (this.audio.volume + volumeStep) >= currentVolume)
                            break;
                        this.audio.volume += volumeStep;
                        await new Promise((res) => setTimeout(() => res(), 50));
                    }
                    //Restore original volume
                    this.audio.voume = currentVolume;

                    oldAudio.pause();

                    this.resetGapless();
                    this.updateState();

                    //Save
                    await this.savePlaybackInfo();
                }
            });
            this.audio.muted = this.muted;
            //Set volume
            this.audio.volume = this.volume * this.volume;

            this.audio.addEventListener('ended', async() => {
                //Track end
                if (this.$rooms.room) {
                    this.$rooms.trackEnd();
                    return;
                }

                //Scrobble/LogListen
                this.logListen();

                if (this.gapless.crossfade) return;

                //Repeat track
                if (this.repeat == 2) {
                    this.seek(0);
                    var playingPromise = this.audio.play();

                    if (playingPromise !== undefined) {
                        playingPromise.then(_ => {
                            console.log(_)
                            this.updateState();
                        })
                    .catch(error => {
                            console.log(error);
                            this.skip(1).then(this.skip(-1))
                        })  
                    }  
                    return;
                }

                //Repeat list
                if (this.repeat == 1 && this.queue.index == this.queue.data.length - 1) {
                    this.skip(-(this.queue.data.length - 1));
                    return;
                }

                //End of queue
                if (this.queue.index + 1 == this.queue.data.length) {
                    this.state = 1;
                    return;
                }

                //Skip to next track
                this.skip(1);
                this.savePlaybackInfo();
            });
        },
        //Update media session with current track metadata
        updateMediaSession() {
            if (!this.track || !('mediaSession' in navigator)) return;

            // eslint-disable-next-line no-undef
            navigator.mediaSession.metadata = new MediaMetadata({
                title: this.track.title,
                artist: this.track.artistString,
                album: this.track.album.title,
                artwork: [
                    { src: this.getImageUrl(this.track.albumArt, 256), sizes: '256x256', type: 'image/jpeg' },
                    { src: this.getImageUrl(this.track.albumArt, 512), sizes: '512x512', type: 'image/jpeg' }
                ]
            });
            //Controls
            navigator.mediaSession.setActionHandler('play', this.play);
            navigator.mediaSession.setActionHandler('pause', this.pause);
            navigator.mediaSession.setActionHandler('nexttrack', this.skipNext);
            navigator.mediaSession.setActionHandler('previoustrack', () => this.skip(-1));
        },
        //Get Deezer CDN image url
        getImageUrl(img, size = 264) {
            return `https://e-cdns-images.dzcdn.net/images/${img.type}/${img.hash}/${size}x${size}-000000-80-0-0.jpg`
        },

        async loadPlaybackInfo(streamUrl, duration) {
            //Get playback info
            let quality = this.settings.streamQuality;
            let infoUrl = `/streaminfo/${streamUrl}?q=${quality}`;
            let res;
            try {
                res = await this.$axios.get(infoUrl);
            } catch (_) {
                return null;
            }

            let info = res.data;
            //Generate qualityString
            switch (info.quality) {
                case 9:
                    info.qualityString = 'FLAC ' + Math.round((info.size * 8) / duration) + 'kbps';
                    break;
                case 3:
                    info.qualityString = 'MP3 320kbps';
                    break;
                case 1:
                    info.qualityString = 'MP3 128kbps';
                    break;
            }
            return info;
        },

        //Reset gapless playback meta
        resetGapless() {
            this.gapless = { crossfade: false, promise: null, audio: null, info: null, track: null, index: null };
        },
        //Load next track for gapless
        async loadGapless() {
            if (this.loaders != 0 || this.gapless.promise || this.gapless.audio || this.gapless.crossfade) return;

            //Repeat list
            if (this.repeat == 1 && this.queue.index == this.queue.data.length - 1) {
                this.gapless.track = this.queue.data[0];
                this.gapless.index = 0;
            } else {
                //Last song
                if (this.queue.index + 1 >= this.queue.data.length) return;
                //Next song
                this.gapless.track = this.queue.data[this.queue.index + 1];
                this.gapless.index = this.queue.index + 1;
            }

            //Save promise
            let resolve;
            this.gapless.promise = new Promise((res) => { resolve = res });

            //Load meta
            let info = await this.loadPlaybackInfo(this.gapless.track.streamUrl, this.gapless.track.duration);
            if (!info) {
                this.resetGapless();
                if (this.gapless.promise) resolve();
            }
            this.gapless.info = info
            if (info.encrypted)
                this.gapless.audio = new Audio(`${process.env.NODE_ENV === 'development' ? "http://localhost:10069" : window.location.origin}${info.url}`);
            else
                this.gapless.audio = new Audio(info.direct);
            this.gapless.audio.volume = 0.00;
            this.gapless.audio.preload = 'auto';
            this.gapless.crossfade = false;

            //Might get canceled
            if (this.gapless.promise) resolve();
        },
        //Load more SmartTrackList tracks
        async loadSTL() {
            if (this.queue.data.length - 1 == this.queue.index && this.queue.source.source == 'dynamic_page_flow_config' && this.queue.source.type && this.queue.source.type == 'flow') {
                if (this.lastid == this.track.id) return;
                this.lastid = this.track.id;
                let data = await this.$axios.get('/smarttracklist/flow/' + this.queue.source.data);
                if (data.data) {
                    this.replaceQueue(this.queue.data.concat(data.data));
                }
                this.savePlaybackInfo();
            }
        },
        //Load more Shuffle tracks
        async loadShuffle() {
            if (this.queue.data.length - 1 == this.queue.index && this.queue.source.source == 'shuffled_collection') {
                if (this.lastidshfle == this.track.id) return;
                this.lastidshfle = this.track.id;
                let data = await this.$axios.get('/shuffle');
                if (data.data) {
                    this.replaceQueue(this.queue.data.concat(data.data));
                }
                this.savePlaybackInfo();
            }
        },

        //Update & save settings
        async saveSettings() {
            this.settings.volume = this.volume;
            await this.$axios.post('/settings', this.settings);

            //Update settings in electron
            if (this.settings.electron) {
                ipcRenderer.send('updateSettings', this.settings);
            }
        },

        async savePlaybackInfo() {
            let data = {
                queue: this.queue,
                position: this.position,
                track: this.track,
                repeat: this.repeat,
                shuffled: this.shuffled
            }
            await this.$axios.post('/playback', data);
        },
        //Get downloads from server
        async getDownloads() {
            let res = await this.$axios.get('/downloads');
            if (res.data)
                this.downloads = res.data;
        },
        //Start stop downloading
        async toggleDownload() {
            if (this.downloads.downloading) {
                await this.$axios.delete('/download');
            } else {
                await this.$axios.put('/download');
            }
        },

        //Deezer doesn't give information if items are in library, so it has to be cachced
        async cacheLibrary() {
            let res = await this.$axios.get(`/playlist/${this.profile.favoritesPlaylist}?full=idk`);
            this.libraryTracks = res.data.tracks.map((t) => t.id);
        },

        //Log song listened to deezer, only if allowed
        async logListen() {
            if (this.logListenId == this.track.id) return;
            if (!this.track || !this.track.id) return;

            this.logListenId = this.track.id;
            // this.$root.queue.source.data is supposed to exist for this to work which i think it always does
            await this.$axios.post(`/log/${this.$root.queue.source.data}/${this.$root.queue.source.source}`, this.track);
        },
        //Send state update to integrations
        async updateState() {
            //Wait for duration
            if (this.state == 2 && (this.duration() == null || isNaN(this.duration()))) {
                setTimeout(() => {
                    this.updateState();
                }, 500);
                return;
            }
            this.$io.emit('stateChange', {
                position: this.position,
                duration: this.duration(),
                state: this.state,
                track: this.track
            });

            //Update in electron 
            if (this.settings.electron) {
                ipcRenderer.send('playing', this.state == 2);
            }
        },
        updateLanguage(l) {
            i18n.locale = l;
        },
        //For LGBT/Gayming mode
        primaryColorRainbow() {
            const colors = ['#F44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5', '#2196F3', '#03A9F4',
                '#00BCD4', '#009688', '#4CAF50', '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800', '#FF5722',
                '#795548', '#607D8B', '#9E9E9E'
            ];
            let index = 0;
            setInterval(() => {
                this.$vuetify.theme.themes.dark.primary = colors[index];
                this.$vuetify.theme.themes.light.primary = colors[index];
                this.$root.settings.primaryColor = colors[index];
                index++;
                if (index == colors.length)
                    index = 0;
            }, 400);
        }
    },

    computed: {
        //Show or no topbar
        topBar() {
            if (!this.settings.electron) return false;
            return !this.settings.nativeTopBar;
        }
    },

    async created() {
        //Load settings, create promise so `/login` can await it
        let r;
        this.loadingPromise = new Promise((resolve) => r = resolve);
        let res = await this.$axios.get('/settings');
        this.settings = res.data;
        this.$vuetify.theme.themes.dark.primary = this.settings.primaryColor;
        this.$vuetify.theme.themes.light.primary = this.settings.primaryColor;
        if (this.settings.lightTheme)
            this.$vuetify.theme.dark = false;

        //Remove LGBT
        const lgbt = 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/Gay_Pride_Flag.svg/1280px-Gay_Pride_Flag.svg.png';
        if (this.settings.backgroundImage == lgbt)
            this.settings.backgroundImage = null;


        i18n.locale = this.settings.language;
        this.volume = this.settings.volume;

        //Restore playback data
        let pd = await this.$axios.get('/playback');
        if (pd.data != {}) {
            if (pd.data.queue) this.queue = pd.data.queue;
            if (pd.data.track) this.track = pd.data.track;
            if (pd.data.repeat) this.repeat = pd.data.repeat;
            if (pd.data.shuffled) this.shuffled = pd.data.shuffled;
            this.playTrack(this.track).then(() => {
                this.seek(pd.data.position);
            });
        }

        //Check for electron (src: npm isElectron)
        this.settings.electron = ((
            typeof window !== 'undefined' &&
            typeof window.process === 'object' &&
            window.process.type === 'renderer') || (
            typeof navigator === 'object' && typeof navigator.userAgent === 'string' &&
            navigator.userAgent.indexOf('Electron') >= 0
        ));
        if (this.settings.electron)
            ipcRenderer = window.require('electron').ipcRenderer;

        //Setup electron callbacks
        if (this.settings.electron) {
            //Save files on exit
            ipcRenderer.on('onExit', async() => {
                this.pause();
                await this.saveSettings();
                await this.savePlaybackInfo();
                ipcRenderer.send('onExit', '');
            });

            //Control from electron
            ipcRenderer.on('togglePlayback', () => {
                //Rooms
                if (!this.$rooms.allowControls()) return;

                this.toggle();
            });
            ipcRenderer.on('skipNext', () => {
                //Rooms
                if (!this.$rooms.allowControls()) return;

                this.skip(1);
            });
            ipcRenderer.on('skipPrev', () => {
                //Rooms
                if (!this.$rooms.allowControls()) return;

                this.skip(-1);
            })
        }

        //Get downloads
        await this.getDownloads();

        //Sockets

        //Queue change
        this.$io.on('downloads', (data) => {
            this.downloads = data;
        });
        //Current download change
        this.$io.on('currentlyDownloading', (data) => {
            this.downloads.threads = data;
        });
        //Play at offset (for integrations)
        this.$io.on('playOffset', async(data) => {
            this.queue.data.splice(this.queue.index + 1, 0, data.track);
            await this.skip(1);
            this.seek(data.position);
        });

        r();
    },

    mounted() {
        //Bind rooms
        this.$roomsBind().setBind();
        //Save settings on unload
        window.addEventListener('beforeunload', () => {
            this.savePlaybackInfo();
            this.saveSettings();
        });
        //Save size
        window.addEventListener('resize', () => {
            this.settings.width = window.innerWidth;
            this.settings.height = window.innerHeight;
        });

        //Keystrokes
        document.addEventListener('keyup', (e) => {
            //Don't handle keystrokes in text fields
            if (e.target.tagName == "INPUT") return;
            //Don't handle if specials
            if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;

            //Rooms
            if (!this.$rooms.allowControls()) return;

            //K toggle playback
            if (e.code == "KeyK" || e.code == "Space") this.$root.toggle();
            //L +10s (from YT)
            if (e.code == "KeyL") this.$root.seek((this.position + 10000));
            //J -10s (from YT)
            if (e.code == "KeyJ") this.$root.seek((this.position - 10000));
            //-> +5s (from YT)
            if (e.code == "ArrowRight") this.$root.seek((this.position + 5000));
            //<- -5s (from YT)
            if (e.code == "ArrowLeft") this.$root.seek((this.position - 5000));
            // ^ v - Volume 
            if (e.code == 'ArrowUp') {
                if ((this.volume + 0.05) > 1) {
                    this.volume = 1.00;
                    return;
                }
                this.volume += 0.05;
            }
            if (e.code == 'ArrowDown') {
                if ((this.volume - 0.05) < 0) {
                    this.volume = 0.00;
                    return;
                }
                this.volume -= 0.05;
            }
        });
    },

    watch: {
        //Watch state for integrations
        state() {
            this.updateMediaSession();
            this.updateState();
            //Rooms
            if (this.$rooms.room && this.$rooms.allowControls())
                this.$rooms.sync();
        },
        //Update volume with curve
        volume() {
            if (this.audio)
                this.audio.volume = this.volume * this.volume;
        }
    },

    router,
    vuetify,
    i18n,
    render: function(h) { return h(App) }
}).$mount('#app');