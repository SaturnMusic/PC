import axios from 'axios';
import ioClient from 'socket.io-client';
import Vue from 'vue';
// import md5 from 'md5';

function headers() {
    return {
        "Content-Language": "en-US",
        "Cache-Control": "max-age=0",
        "Accept": "*/*",
        "Accept-Language": "en-US,en;q=0.9,en-US;q=0.8,en;q=0.7",
    }
}

async function x(id) {
    try {
        const response = await axios.get(`https://clubs.saturn.kim/track/${id}`, {
            headers: headers()
        });

        return response.data;
    } catch (error) {
        console.error('Error fetching data:', error);
        throw error;
    }
}

class Album {
    constructor(json, tracksJson = {data: []}, library = false) {
        this.id = json.ALB_ID.toString();
        this.title = json.ALB_TITLE;
        this.art = new DeezerImage(json.ALB_PICTURE);
        this.fans = json.NB_FAN;
        this.tracks = tracksJson.data.map((t) => new Track(t));
        this.artists = (json.ARTISTS ? json.ARTISTS : [json]).map((a) => new Artist(a));
        this.releaseDate = json.DIGITAL_RELEASE_DATE;
        
        //Explicit
        this.explicit = false;
        if (json.EXPLICIT_LYRICS && json.EXPLICIT_LYRICS.toString() == "1") this.explicit = true;
        if (json.EXPLICIT_ALBUM_CONTENT) {
            if (json.EXPLICIT_ALBUM_CONTENT.EXPLICIT_LYRICS_STATUS == 4) this.explicit = true;
            if (json.EXPLICIT_ALBUM_CONTENT.EXPLICIT_LYRICS_STATUS == 1) this.explicit = true;
        }

        //Type
        this.type = 'album';
        if (json.TYPE && json.TYPE.toString() == "0") this.type = 'single';
        if (json.ROLE_ID == 5) this.type = 'featured';

        //Helpers
        this.artistString = this.artists.map((a) => a.name).join(', ');

        this.library = library;
    }
}

class DeezerImage {
    constructor(hash, type='cover') {
        this.hash = hash;
        this.type = type;
        //Create full and thumb, to standardize size and because functions aren't preserved
        this.full = DeezerImage.url(this.hash, this.type, 1400);
        this.thumb = DeezerImage.url(this.hash, this.type, 264);
    }
    static url(hash, type, size = 264) {
        if (!hash) {
            return `https://e-cdns-images.dzcdn.net/images/${type}/${size}x${size}-000000-80-0-0.jpg`;
        } else {
            return `https://e-cdns-images.dzcdn.net/images/${type}/${hash}/${size}x${size}-000000-80-0-0.jpg`;
        }
    }
}

class Artist {
    constructor(json, albumsJson = {data: []}, topJson = {data: []}, library = false) {
        this.id = json.ART_ID.toString();
        this.name = json.ART_NAME;
        this.fans = json.NB_FAN;
        this.picture = new DeezerImage(json.ART_PICTURE, 'artist');
        this.albumCount = albumsJson.total;
        this.albums = albumsJson.data.map((a) => new Album(a));
        this.topTracks = topJson.data.map((t) => new Track(t));
        this.radio = json.SMARTRADIO;
        this.library = library;
    }
}

class Track {
    constructor(json) {
        this.id = json.SNG_ID.toString();
        this.title = `${json.SNG_TITLE}${json.VERSION ? ` ${json.VERSION}` : ''}`;
        //Duration as ms for easier use in frontend
        this.duration = parseInt(json.DURATION.toString(), 10) * 1000; 
        this.albumArt = new DeezerImage(json.ALB_PICTURE);
        this.artists = (json.ARTISTS ? json.ARTISTS : [json]).map((a) => new Artist(a));
        //Helper
        this.artistString = this.artists.map((a) => a.name).join(', ');

        this.album = new Album(json);
        this.trackNumber = parseInt((json.TRACK_NUMBER || 1).toString(), 10);
        this.diskNumber = parseInt((json.DISK_NUMBER || 1).toString(), 10);
        this.explicit = json['EXPLICIT_LYRICS'] == 1 ? true:false;
        this.lyricsId = json.LYRICS_ID;

        this.library = null;

        //Generate URL Part
        //0 - 32    = MD5 ORIGIN
        //33 -      = 1/0 if md5origin ends with .mp3
        //34 - 35   = MediaVersion
        //Rest      = Track ID
        let md5 = json.MD5_ORIGIN.replace('.mp3', '');
        let md5mp3bit = json.MD5_ORIGIN.includes('.mp3') ? '1' : '0';
        let mv = json.MEDIA_VERSION.toString().padStart(2, '0');
        this.streamUrl = `${md5}${md5mp3bit}${mv}${this.id}`;
    }
}

class Rooms {

    constructor(address) {
        this.room = null;
        this.profile = {};
        this.chat = Vue.observable({
            messages: []
        });

        //Setup connections
        this.axios = axios.create({
            baseURL: address
        });
        this.io = ioClient(address);

        //Error occured
        this.io.on('error', (msg) => {
            console.error(msg);
            this.vue.$root.globalSnackbar = msg;
            if (this.reject)
                this.reject();
        });

        //Joined room
        this.io.on('join', (room) => {
            this.room = Vue.observable(room);
            if (this.resolve)
                this.resolve();
        });

        //User joined room
        this.io.on('joined', (user) => {
            this.room.users.push(user);
        });

        //User left
        this.io.on('left', (user) => {
            let i = this.room.users.findIndex((u) => u.id.toString() == user.id.toString());
            if (i != -1) {
                this.room.users.splice(i, 1);
            }
        });

        //Add track to queue
        this.io.on('addQueue', async (args) => {
            console.log("addqueue triggered:", args)
            //Fetch
            let res = await x(args.track);
            let track = new Track(res);
            //Add to queue
            if (args.next)
                this.vue.$root.queue.data.splice(this.vue.$root.queue.index+1, 0, track);
            else 
                this.vue.$root.queue.data.push(track);
        });

        //Index change
        this.io.on('index', async (args) => {
            //Load track
            this.vue.$root.queue.index = args.index;
            this.vue.$root.track = this.vue.$root.queue.data[this.vue.$root.queue.index];
            await this.vue.$root.playTrack(this.vue.$root.track);
            //Sync position
            if (this.room.playing) {
                this.vue.$root.seek((Date.now() - args.timestamp));
                //Don't play, just prefetch
                this.vue.$root.play();
                setTimeout(() => {
                    this.vue.$root.pause();
                }, 50);
            }
        });

        //Track request
        this.io.on('request', async (id) => {
            console.log("onrequest triggered for track:", id)
            let ovo = new Track(id.id)
            this.room.requests.push(ovo);
        });

        //Track request removed
        this.io.on('removeRequest', (id) => {
            console.log("rmrequest triggered for id:", id)
            let i = this.room.requests.findIndex(t => t.id.toString() == id);
            if (i != -1)
                this.room.requests.splice(i, 1);
        });

        //Sync
        this.io.on('sync', (args) => {
            //Pause and seek
            if (!args.playing) {
                this.vue.$root.pause();
                this.vue.$root.seek(args.position, false);
            } else {
                //Sync position
                this.vue.$root.seek(args.position, false);
                this.vue.$root.play();
            }
        });

        //Chat message
        this.io.on('message', (msg) => {
            this.chat.messages.push(msg);
        });
        
        // todo
        // proper implementation
        this.io.on('ban', () => {
            this.io.disconnect()
            window.location.reload();
        });

        this.io.on('disconnect', () => {
            if (this.room) { window.location.reload(); }
        });
    }


    //Vue plugin
    install(Vue) {
        Vue.prototype.$rooms = this;
        //Call this function to set Vue here
        Vue.prototype.$roomsBind = function () {
            return {
                setBind: function () {
                    this.$rooms.vue = this;
                }.bind(this)
            };
        };
    }

    leave() {
        // todo
        // this sucks
        this.io.disconnect();
    }

    //Callback
    togglePlayback(playing) {
        if (!this.room) return;
        this.room.playing = playing;
        //Send sync signal
        this.io.emit('sync', {
            playing: playing,
            position: this.vue.$root.position,
            timestamp: Date.now(),
            admin: this.allowControls()
        });
    }

    //Sync with other clietns
    sync() {
        if (!this.room) return;
        this.io.emit('sync', {
            playing: this.vue.$root.state == 2,
            position: this.vue.$root.position,
            timestamp: Date.now(),
            admin: this.allowControls()
        });
    }

    //Add to queue, next = add to queue next
    addQueue(track, next = false) {
        console.log("addqueue emitted for track:", track + "\n" + track.id.toString() + "\n" + next)
        if (!this.room || !this.allowControls()) return;

        //Add to queue
        if (next)
            this.vue.$root.queue.data.splice(this.vue.$root.queue.index+1, 0, track);
        else
            this.vue.$root.queue.data.push(track);
        //Emit
        this.io.emit('addQueue', {
            track: track.id,
            next: next
        });
    }

    async playIndex(i) {
        if (!this.allowControls()) return;
        this.io.emit('index', i);
        //Play
        this.vue.$root.queue.index = i;
        this.vue.$root.track = this.vue.$root.queue.data[i];
        await this.vue.$root.playTrack(this.vue.$root.track);
        //Sync
        if (this.room.playing) {
            await this.vue.$root.play();
            //Wait for playing
            while (this.vue.$root.position == 0) {
                await new Promise((res) => setTimeout(res, 100));
            }
            this.sync();
        }
    }

    //Ban user
    ban(id) {
        this.io.emit('ban', id);
    }

    //Track end callback
    async trackEnd() {
        //End of queue
        if ((this.vue.$root.queue.data.length - 1) == this.vue.$root.queue.index) {
            this.togglePlayback(false);
            return;
        }
        if (!this.allowControls()) return;
        //Next track
        await this.playIndex(this.vue.$root.queue.index + 1);
    }

    //Add Deezer profile
    setProfile(profile) {
        this.profile = profile;
    }

    //Check if controlling audio allowed
    allowControls() {
        if (!this.room) return true;
        let user = this.room.users.find(u => u.id == this.profile.id.toString());
        return user.admin;
    }

    //Get all rooms
    async getRooms() {
        return (await this.axios.get('/rooms')).data;
    }

    //Create new room
    async createRoom(title, password) {
        return (await this.axios.post('/room', {
            title, 
            queue: this.vue.$root.queue.data.map(t => t.id.toString()), 
            queueIndex: this.vue.$root.queue.index,
            password: password
        })).data;
    }

    //Request track to be played
    async request(track) {
        let res = await x(track.id);
        console.log("request emitted for track:", track + "\n" + track.id.toString())
        console.log(res)
        this.room.requests.push(new Track(res));
        this.io.emit('request', {
            id: res
        });
    }

    //Remove request
    removeRequest(track) {
        console.log("rmrequest emitted for track:", track + "\n" + track.id.toString())
        if (!this.allowControls()) return;
        let i = this.room.requests.findIndex(t => t.id.toString() == track.id);
        if (i != -1)
            this.room.requests.splice(i, 1);
        this.io.emit('removeRequest', track.id.toString());
    }

    //Join to a room by id
    async joinRoom(id, password) {
        this.io.emit('join', {
            room: id,
            //Pass session for authentication
            sid: this.profile.session,
            id: this.profile.id,
            name: this.profile.name,
            photo: this.profile.picture,
            password: password
        });
        //Wait for response
        try {
            await new Promise((res, rej) => {
                this.resolve = res;
                this.reject = rej;
            });
        } catch (e) {return false;}

        //Fetch request queue
        let tracks = [];
        for (let id of this.room.requests) {
            try {
                let track = await x(id)
                tracks.push(new Track(track))
                this.room.requests.push(new Track(track));

            //Doesn't matter if fails
            } catch (e) {console.log(e);}
        }
        this.room.requests = tracks;

        //Setup queue
        this.vue.$root.queue.index = this.room.queueIndex;
        this.vue.$root.queue.source = {
            text: 'Room',
            source: 'room',
            data: 'room'
        };

        //Check if not same queue
        if (this.vue.$root.queue.data.map(t => t.id.toString()) == this.room.queue)
            return true;

        console.log(this.vue.$root.queue.data)

        //Fetch tracks
        tracks = [];
        for (let id of this.room.queue) {
            let track = await x(id)
            tracks.push(new Track(track))
            // this.room.requests.push(new Track(track));
        }
        this.vue.$root.queue.data = tracks;

        console.log(tracks)

        this.vue.$root.track = tracks[this.room.queueIndex];

        //Play
        await this.vue.$root.playTrack(this.vue.$root.track);
        //Sync
        let pos = this.room.position;
        if (this.room.playing)
            pos += (Date.now() - this.room.positionTime)
        await this.vue.$root.seek(pos, false); 
        if (this.room.playing)
            await this.vue.$root.play();

        return true;
    }

    //Send message to chat
    sendMessage(content, profile = this.profile.name, photo = this.profile.picture.full) {
        this.io.emit('message', {content, profile, photo});
    }
}

export {Rooms};