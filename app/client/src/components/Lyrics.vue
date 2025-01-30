<template>
    <div :style='"max-height: " + height' class='overflow-y-auto' ref='content'>

        <v-list-item>
            <v-list-item-action>
                <v-select
                class='mr-4'
                v-model='p'
                label="Provider"
                :items="['Deezer', 'LRCLib', 'Genius', 'MusixMatch']"
                @change="load"
                ></v-select>
            </v-list-item-action>
            <v-list-item-content>
                <v-list-item-title>{{$t("Custom Lyric Provider")}}</v-list-item-title>
            </v-list-item-content>
        </v-list-item>

        <div class='text-center my-4'>
            <v-progress-circular indeterminate v-if='loading'></v-progress-circular>
        </div>

        <div v-if='!loading && lyrics && lyrics.lyrics && lyrics.lyrics.length > 0' class='text-center'>
            <div 
            v-for='(lyric, index) in lyrics.lyrics' 
            :key='lyric.offset' 
            class='my-6 mx-4 pa-2 rounded' 
            :class='{"grey darken-3": (playingNow(index) && !$root.settings.lightTheme), "grey lighten-1": (playingNow(index) && $root.settings.lightTheme)}'
            @click='seekTo(index)'>
                <span 
                class='my-8'
                :class='{"text-h6 font-weight-regular": !playingNow(index), "text-h5 font-weight-bold": playingNow(index)}'
                :ref='"l"+index'
                >
                    {{lyric.text}}
                </span>
            </div>
        </div>
    
        <!-- Unsynchronized -->
        <div v-if='!loading && lyrics && lyrics.text && lyrics.text.length > 0 && (!lyrics.lyrics || lyrics.lyrics.length == 0)' class='text-center'>
            <span v-for='(lyric, index) in lyrics.text' :key='"US" + index' class='my-8 mx-4'>
                <span class='my-8 text-h6 font-weight-regular'>
                    {{lyric}}
                </span>
                <br>
            </span>
        </div>
    
        <!-- Error -->
        <div v-if='!loading && (!lyrics || (lyrics.text.length == 0 && lyrics.lyrics.length == 0))' class='pa-4 text-center'>
            <span class='red--text text-h5'>
                {{$t("Error loading lyrics or lyrics not found!")}}
            </span>
        </div>

    </div>
    </template>
    
    <script>
    export default {
        name: 'Lyrics',
        props: {
            songId: String,
            height: String
        },
        data() {
            return {
                cSongId: this.songId,
                loading: true,
                lyrics: null,
                p: "Deezer",
                currentLyricIndex: 0,
            }
        },
        methods: {
            // Load data from API
            async load() {
                this.loading = true;
                this.lyrics = null;
                try {
                    let res = await this.$axios.get(`/lyrics/${this.songId}/${this.p}`);
    
                    // Check for new Pipe API response structure
                    if (res.data && res.data.track && res.data.track.lyrics) {
                        const track = res.data.track;
                        this.lyrics = {
                        lyrics: [],
                        text: track.lyrics.text.replace(/\r\n|\r|\n\n/g, '\n').split('\n').filter(line => line.trim() !== ''),
                        writers: track.lyrics.writers,
                        copyright: track.lyrics.copyright
                    };
                        // Handle synchronized lines if they exist
                        if (track.lyrics.synchronizedLines) {
                            this.lyrics.lyrics = track.lyrics.synchronizedLines.map((line) => ({
                                offset: line.milliseconds,
                                text: line.line,
                                lrcTimestamp: line.lrcTimestamp
                            }));
                        }
                    } 
                    // Check for old response structure
                    else if (res.data && res.data.lyrics) {
                        this.lyrics = res.data.lyrics; // Assuming it has 'text' and 'lyrics' structure
                    }
    
                } catch (e) {
                    console.error(e); // Log error for debugging
                }
                this.loading = false;
            },
            // Whether current lyric is playing now
            playingNow(i) {
                if (!this.$root.audio) return false;
                // First & last lyric check
                if (i == this.lyrics.lyrics.length - 1) {
                    return this.lyrics.lyrics[i].offset <= this.$root.position;
                }
    
                return this.$root.position >= this.lyrics.lyrics[i].offset && this.$root.position < this.lyrics.lyrics[i + 1].offset;
            },
            // Get index of current lyric
            currentLyric() {
                if (!this.$root.audio) return 0;
                return this.lyrics.lyrics.findIndex((l) => this.playingNow(this.lyrics.lyrics.indexOf(l)));
            },
            // Scroll to currently playing lyric
            scrollLyric() {
                if (!this.lyrics || !this.lyrics.lyrics || this.lyrics.lyrics.length == 0) return;
    
                // Prevent janky scrolling
                if (this.currentLyricIndex == this.currentLyric()) return;
                this.currentLyricIndex = this.currentLyric();
    
                if (!this.$refs["l" + this.currentLyricIndex]) return;
                this.$refs.content.scrollTo({
                    top: this.$refs["l" + this.currentLyricIndex][0].offsetTop - (window.innerHeight / 2.42),
                    behavior: 'smooth'
                });
            },
            // Seek to lyric in song
            seekTo(i) {
                // Rooms
                if (!this.$rooms.allowControls()) return;
    
                this.$root.seek(this.lyrics.lyrics[i].offset);
            }
        },
        mounted() {
            this.load();
        },
        watch: {
            songId() {
                // Load on song id change
                if (this.cSongId != this.songId) {
                    this.cSongId = this.songId;
                    this.load();
                }
            },
            '$root.position'() {
                this.scrollLyric();
            }
        }
    }
    </script>
    