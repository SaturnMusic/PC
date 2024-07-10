<template>
    <div class='pa-0' :class='{electron: $root.topBar, notop: !$root.topBar}'>

        <v-app-bar dense>
            <v-btn icon @click='close'>
                <v-icon>mdi-close</v-icon>
            </v-btn>
            <v-toolbar-title>{{$t("Playing from")}}: {{$root.queue.source.text}}</v-toolbar-title>
        </v-app-bar>
        
        <!-- Split to half -->
        <v-row class='pa-2' no-gutters justify="center">
            <!-- Left side (track info...) -->
            <v-col class='col-12 col-sm-6 text-center' align-self="center">
                <v-img 
                    :src='$root.track.albumArt.full' 
                    :lazy-src="$root.track.albumArt.thumb"
                    aspect-ratio="1"
                    max-height="calc(90vh - 310px)"
                    class='ma-4' 
                    contain>
                </v-img>
                <h1 class='text-no-wrap text-truncate'>{{$root.track.title}}</h1>
                <h2 class='primary--text text-no-wrap text-truncate'>{{$root.track.artistString}}</h2>
                
                <!-- Slider, timestamps -->
                <v-row no-gutters class='py-2'>
                    <v-col class='text-center' align-self="center">
                        <span>{{$duration(position * 1000)}}</span>
                    </v-col>
                    <v-col class='col-8'>
                        <v-slider 
                            min='0' 
                            step='1'
                            :max='this.$root.duration() / 1000' 
                            @click.prevent.stop='seekEvent'
                            @start='seeking = true'
                            @end='seek'
                            :value='position'
                            ref='seeker'
                            class='seekbar'
                            color='primary'
                            hide-details>
                        </v-slider>
                    </v-col>
                    <v-col class='text-center' align-self="center">
                        <span>{{$duration($root.duration())}}</span>
                    </v-col>
                </v-row>

                <!-- Controls -->
                <v-row no-gutters class='ma-4'>
                    <v-col>
                        <v-btn icon x-large @click='$root.skip(-1)'>
                            <v-icon size='42px'>mdi-skip-previous</v-icon>
                        </v-btn>
                    </v-col>

                    <v-col>
                        <v-btn icon x-large @click='$root.toggle()'>
                            <v-icon size='56px' v-if='!$root.isPlaying()'>mdi-play</v-icon>
                            <v-icon size='56px' v-if='$root.isPlaying()'>mdi-pause</v-icon>
                        </v-btn>
                    </v-col>

                    <v-col>
                        <v-btn icon x-large @click='$root.skipNext'>
                            <v-icon size='42px'>mdi-skip-next</v-icon>
                        </v-btn>
                    </v-col>
                </v-row>

                <!-- Bottom actions -->
                <div class='d-flex mx-2 mb-2'>
                    
                    <v-btn icon @click='repeatClick'>
                        <v-icon v-if='$root.repeat == 0 || !$root.repeat'>mdi-repeat</v-icon>
                        <v-icon color='primary' v-if='$root.repeat == 1'>mdi-repeat</v-icon>
                        <v-icon color='primary' v-if='$root.repeat == 2'>mdi-repeat-once</v-icon>
                    </v-btn>
                    <v-btn icon @click='$root.shuffle()'>
                        <v-icon color='primary' v-if='$root.shuffled'>mdi-shuffle</v-icon>
                        <v-icon v-if='!$root.shuffled'>mdi-shuffle</v-icon>
                    </v-btn>

                    <v-btn icon @click='addLibrary'>
                        <v-icon v-if='!inLibrary'>mdi-heart</v-icon>
                        <v-icon v-if='inLibrary'>mdi-heart-remove</v-icon>
                    </v-btn>

                    <v-btn icon @click='playlistPopup = true'>
                        <v-icon>mdi-playlist-plus</v-icon>
                    </v-btn>

                    <v-btn icon @click='download'>
                        <v-icon>mdi-download</v-icon>
                    </v-btn>

                    <v-btn icon @click='share'>
                        <v-icon>mdi-share-variant</v-icon>
                    </v-btn>

                    <!-- Volume -->
                    <div ref='volumeBar' style='width: 100%;'>
                        <v-slider
                            min='0.00' 
                            :prepend-icon='$root.muted ? "mdi-volume-off" : "mdi-volume-high"'
                            max='1.00'
                            step='0.01'
                            v-model='$root.volume'
                            class='px-8'
                            color='primary'
                            style='padding-top: 2px;'
                            @change='updateVolume'
                            @click:prepend='$root.toggleMute()'
                        >
                            <template v-slot:append>
                                <div style='position: absolute; padding-top: 4px;'>
                                    {{Math.round($root.volume * 100)}}%
                                </div>
                            </template>
                        </v-slider>
                    </div>
                </div>


            </v-col>

            <!-- Right side -->
            <v-col class='col-12 col-sm-6 pt-4'>
                <v-tabs v-model='tab'>
                    <v-tab key='queue'>
                        {{$t("Queue")}}
                    </v-tab>
                    <v-tab key='info'>
                        {{$t("Info")}}
                    </v-tab>
                    <v-tab key='lyrics'>
                        {{$t("Lyrics")}}
                    </v-tab>
                </v-tabs>

                <v-tabs-items v-model='tab'>
                    <!-- Queue tab -->
                    <v-tab-item key='queue' v-if='showQueue'>
                        <v-list two-line avatar class='overflow-y-auto' style='max-height: calc(100vh - 160px)'>
                            <v-virtual-scroll :items='$root.queue.data' item-height='72' benched='5' style='overflow-y: hidden !important'>
                                <template v-slot:default="{ index, item }">
                                    <draggable v-model='$root.queue.data' @move='queueMove'>
                                        <v-lazy min-height="1" transition="fade-transition" :key='"qq" + index'>
                                            <TrackTile
                                                :track='item'
                                                @click='$root.playIndex(index)'
                                                @redirect='close'
                                                :ripple='false'
                                                removeQueue
                                                @removeQueue='removeQueue(index)'
                                            ></TrackTile>
                                        </v-lazy>
                                    </draggable>
                                </template>
                            </v-virtual-scroll>
                        </v-list>
                    </v-tab-item>
                    <!-- Info tab -->
                    <v-tab-item key='info'>
                        <v-list two-line avatar class='overflow-y-auto text-center' style='max-height: calc(100vh - 160px)'>
                            <h1>{{$root.track.title}}</h1>
                            <!-- Album -->
                            <h3>{{$t("Album:")}}</h3>
                            <AlbumTile
                                :album='$root.track.album'
                                @clicked='$emit("close")'
                            ></AlbumTile>
                            <!-- Artists -->
                            <h3>{{$t("Artists:")}}</h3>
                            <v-list>
                                <ArtistTile
                                    v-for='(artist, index) in $root.track.artists'
                                    :artist='artist'
                                    :key="index + 'a' + artist.id"
                                    @clicked='$emit("close")'
                                    tiny
                                ></ArtistTile>
                            </v-list>
                            <!-- Meta -->
                            <h3>{{$t("Duration")}}: <span>{{$duration($root.track.duration)}}</span></h3>
                            <h3>{{$t("Track number")}}: {{$root.track.trackNumber}}</h3>
                            <h3>{{$t("Disk number")}}: {{$root.track.diskNumber}}</h3>
                            <h3>{{$t("Explicit")}}: {{$root.track.explicit?$t("Yes"):$t("No")}}</h3>
                            <h3>{{$t("Source")}}: {{$root.playbackInfo.source}}</h3>
                            <h3>{{$t("Quality")}}: {{$root.playbackInfo.qualityString}}</h3>
                            <h3>{{$t("ID")}}: {{$root.track.id}}</h3>
                        </v-list>
                    </v-tab-item>
                    <!-- Lyrics -->
                    <v-tab-item key='lyrics'>
                        <Lyrics :songId='$root.track.id' height='calc(100vh - 160px)'></Lyrics>
                    </v-tab-item>

                </v-tabs-items>
                
            </v-col>
        </v-row>


        <!-- Add to playlist dialog -->
        <v-dialog max-width="400px" v-model='playlistPopup'>
            <PlaylistPopup :track='$root.track' @close='playlistPopup = false'></PlaylistPopup>
        </v-dialog>

        <DownloadDialog :tracks='[$root.track]' v-if='downloadDialog' @close='downloadDialog = false'></DownloadDialog>

    </div>
</template>

<style scoped>
.main {
    width: 100vw;
}

.notop {
    height: 100vh;
    width: 100vw;
}

.electron {
    height: calc(100vh - 28px);
    margin-top: 28px;
    width: 100vw;
}

@media screen and (max-height: 900px) {
    .imagescale {
        max-height: 50vh;
    }
}

@media screen and (max-height: 600px) {
    .imagescale {
        max-height: 45vh;
    }
}
</style>

<script>
import TrackTile from '@/components/TrackTile.vue';
import ArtistTile from '@/components/ArtistTile.vue';
import AlbumTile from '@/components/AlbumTile.vue';
import PlaylistPopup from '@/components/PlaylistPopup.vue';
import Lyrics from '@/components/Lyrics.vue';
import DownloadDialog from '@/components/DownloadDialog.vue';

import draggable from 'vuedraggable';

export default {
    name: 'FullscreenPlayer',
    components: {
        TrackTile, ArtistTile, AlbumTile, PlaylistPopup, Lyrics, DownloadDialog, draggable
    },
    data() {
        return {
            //Position used in seconds, because of CPU usage
            position: this.$root.position / 1000,
            seeking: false,
            tab: null,
            inLibrary: this.$root.track.library ? true:false,
            playlistPopup: false,
            downloadDialog: false,
            //For reloading queue
            showQueue: true,
        }
    },
    methods: {
        //Emit close event
        close() {
            this.$emit('close');
        },
        seek(v) {
            this.$root.seek(v * 1000);
            this.seeking = false;
        },
        //Mouse event seek
        seekEvent(v) {
            let seeker = this.$refs.seeker;
            let offsetp = (v.pageX - seeker.$el.offsetLeft) / seeker.$el.clientWidth;
            let pos = offsetp * this.$root.duration();
            this.$root.seek(pos);
            this.position = pos / 1000;
            this.seeking = false;
        },
        //Add/Remove track from library
        async addLibrary() {
            if (this.inLibrary) {
                await this.$axios.delete(`/library/track?id=` + this.$root.track.id);
                this.inLibrary = false;
                //Remove from cache
                this.$root.libraryTracks.splice(this.$root.libraryTracks.indexOf(this.$root.track.id), 1);
                this.$root.globalSnackbar = this.$t('Removed from library!');
                return;
            }
            await this.$axios.put('/library/track?id=' + this.$root.track.id);
            this.$root.libraryTracks.push(this.$root.track.id);
            this.inLibrary = true;

            this.$root.globalSnackbar = this.$t('Added to library!');
        },
        //Download current track
        async download() {
            this.downloadDialog = true;
        },
        //Save volume
        updateVolume(v) {
            this.$root.volume = v;
        },
        //Repeat button click
        repeatClick() {
            if (this.$root.repeat == 2) {
                this.$root.repeat = 0;
                return;
            }
            this.$root.repeat += 1;
        },
        //Copy link
        share() {
            let copyElem = document.createElement('input');
            copyElem.value = `https://deezer.com/track/${this.$root.track.id}`;
            document.body.appendChild(copyElem);
            copyElem.select();
            document.execCommand('copy');
            document.body.removeChild(copyElem);
            this.$root.globalSnackbar = this.$t('Link copied!');
        },
        queueMove() {
            console.log('move');
            this.$root.queue.index = this.$root.queue.data.findIndex(t => t.id == this.$root.track.id);
        },
        // Remove from queue
        removeQueue(i) {
            if (this.$root.queue.index == i) return;
            if (this.$root.queue.index > i)
                this.$root.queue.index -= 1;
            this.$root.queue.data.splice(i, 1);
        }
    },
    mounted() {
        //Scroll on volume
        this.$refs.volumeBar.addEventListener('wheel', e => {
            //Volup
            if (e.deltaY < 0) {
                if (this.$root.volume + 0.05 > 1)
                    this.$root.volume = 1;
                else 
                    this.$root.volume += 0.05;
            } else {
                //Voldown
                if (this.$root.volume - 0.05 < 0)
                    this.$root.volume = 0;
                else 
                    this.$root.volume -= 0.05;
            }
        });
    },
    computed: {
    },
    watch: {
        //Update add to library button on track change
        '$root.track'() {
            this.inLibrary = this.$root.libraryTracks.includes(this.$root.track.id);
        },
        '$root.position'() {
            if (!this.seeking) {
                this.position = this.$root.position / 1000;
            }
        },
        //Force update queue
        '$root.shuffled'() {
            this.showQueue = false;
            this.showQueue = true;
        }
    }
};

</script>