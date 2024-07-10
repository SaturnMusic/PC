<template>
<v-list-item two-line @click='$emit("click")' :ripple='ripple' @contextmenu.prevent="menu = true">
    <v-list-item-avatar>
        <v-img :src='track.albumArt.thumb'></v-img>
    </v-list-item-avatar>
    <v-list-item-content>
        <v-list-item-title
            :class='{"primary--text": track.id == ($root.track ? $root.track : {id: null}).id}'
        >{{track.title}}<span v-if='track.explicit' class='red--text text-overline pl-2'>E</span></v-list-item-title>
        <v-list-item-subtitle>{{track.artistString}}</v-list-item-subtitle>
    </v-list-item-content>
    <v-list-item-action>
        <!-- Duration -->
        <div class='text-caption mx-2'>
            {{$duration(track.duration)}}
        </div>
    </v-list-item-action>
    <v-list-item-action>
        <!-- Quick add/remoev to library -->
        <v-btn @click.stop='addLibrary' icon v-if='!isLibrary'>
            <v-icon>mdi-heart</v-icon>
        </v-btn>
        <v-btn @click.stop='removeLibrary' icon v-if='isLibrary'>
            <v-icon>mdi-heart-remove</v-icon>
        </v-btn>
    </v-list-item-action>
    <v-list-item-action>
        <!-- Quick add to playlist -->
        <v-btn @click.stop='popup = true' icon v-if='!removeQueue'>
            <v-icon>mdi-playlist-plus</v-icon>
        </v-btn>
        <!-- Remove from queue -->
        <v-btn @click.stop='$emit("removeQueue")' icon v-if='removeQueue' color='red'>
            <v-icon>mdi-close</v-icon>
        </v-btn>
    </v-list-item-action>
    <v-list-item-action>
        <!-- Context menu -->
        <v-menu v-model='menu' offset-y offset-x absolue>
            <template v-slot:activator="{on, attrs}">
                <v-btn v-on='on' v-bind='attrs' icon>
                    <v-icon>mdi-dots-vertical</v-icon>
                </v-btn>
            </template>
            <v-list dense>
                <!-- Play Next -->
                <v-list-item dense @click='playNext'>
                    <v-list-item-icon>
                        <v-icon>mdi-playlist-plus</v-icon>
                    </v-list-item-icon>
                    <v-list-item-content>
                        <v-list-item-title>{{$t("Play next")}}</v-list-item-title>
                    </v-list-item-content>
                </v-list-item>
                <!-- Add to end of queue -->
                <v-list-item dense @click='addQueue'>
                    <v-list-item-icon>
                        <v-icon>mdi-playlist-plus</v-icon>
                    </v-list-item-icon>
                    <v-list-item-content>
                        <v-list-item-title>{{$t("Add to queue")}}</v-list-item-title>
                    </v-list-item-content>
                </v-list-item>
                <!-- Add to library -->
                <v-list-item dense @click='addLibrary' v-if='!isLibrary'>
                    <v-list-item-icon>
                        <v-icon>mdi-heart</v-icon>
                    </v-list-item-icon>
                    <v-list-item-content>
                        <v-list-item-title>{{$t("Add to library")}}</v-list-item-title>
                    </v-list-item-content>
                </v-list-item>
                <!-- Remove from library -->
                <v-list-item dense @click='removeLibrary' v-if='isLibrary'>
                    <v-list-item-icon>
                        <v-icon>mdi-heart-remove</v-icon>
                    </v-list-item-icon>
                    <v-list-item-content>
                        <v-list-item-title>{{$t("Remove from library")}}</v-list-item-title>
                    </v-list-item-content>
                </v-list-item>
                <!-- Add to playlist -->
                <v-list-item dense @click='popup = true' v-if='!playlistId'>
                    <v-list-item-icon>
                        <v-icon>mdi-playlist-plus</v-icon>
                    </v-list-item-icon>
                    <v-list-item-content>
                        <v-list-item-title>{{$t("Add to playlist")}}</v-list-item-title>
                    </v-list-item-content>
                </v-list-item>
                <!-- Remove from playlist -->
                <v-list-item dense @click='removePlaylist' v-if='playlistId'>
                    <v-list-item-icon>
                        <v-icon>mdi-playlist-remove</v-icon>
                    </v-list-item-icon>
                    <v-list-item-content>
                        <v-list-item-title>{{$t("Remove from playlist")}}</v-list-item-title>
                    </v-list-item-content>
                </v-list-item>
                <!-- Share -->
                <v-list-item dense @click='share'>
                    <v-list-item-icon>
                        <v-icon>mdi-share-variant</v-icon>
                    </v-list-item-icon>
                    <v-list-item-content>
                        <v-list-item-title>{{$t("Share")}}</v-list-item-title>
                    </v-list-item-content>
                </v-list-item>
                <!-- Play track mix -->
                <v-list-item dense @click='trackMix'>
                    <v-list-item-icon>
                        <v-icon>mdi-playlist-music</v-icon>
                    </v-list-item-icon>
                    <v-list-item-content>
                        <v-list-item-title>{{$t("Play track mix")}}</v-list-item-title>
                    </v-list-item-content>
                </v-list-item>
                <!-- Go to album -->
                <v-list-item dense @click='goAlbum'>
                    <v-list-item-icon>
                        <v-icon>mdi-album</v-icon>
                    </v-list-item-icon>
                    <v-list-item-content>
                        <v-list-item-title>{{$t("Go to")}} "{{track.album.title}}"</v-list-item-title>
                    </v-list-item-content>
                </v-list-item>
                <!-- Go to artists -->
                <v-list-item 
                    dense 
                    @click='goArtist(artist)'
                    v-for="artist in track.artists"
                    :key='"ART" + artist.id'
                >
                    <v-list-item-icon>
                        <v-icon>mdi-account-music</v-icon>
                    </v-list-item-icon>
                    <v-list-item-content>
                        <v-list-item-title>{{$t("Go to")}} "{{artist.name}}"</v-list-item-title>
                    </v-list-item-content>
                </v-list-item>

                <!-- Download -->
                <v-list-item dense @click='download'>
                    <v-list-item-icon>
                        <v-icon>mdi-download</v-icon>
                    </v-list-item-icon>
                    <v-list-item-content>
                        <v-list-item-title>{{$t("Download")}}</v-list-item-title>
                    </v-list-item-content>
                </v-list-item>

            </v-list>
        </v-menu>
    </v-list-item-action>

    <!-- Add to playlist dialog -->
    <v-dialog max-width="400px" v-model='popup'>
        <PlaylistPopup :track='this.track' @close='popup = false'></PlaylistPopup>
    </v-dialog>

    <DownloadDialog :tracks='[track]' v-if='downloadDialog' @close='downloadDialog = false'></DownloadDialog>

</v-list-item>
</template>

<script>
import PlaylistPopup from '@/components/PlaylistPopup.vue';
import DownloadDialog from '@/components/DownloadDialog.vue';

export default {
    name: 'TrackTile',
    components: {
        PlaylistPopup, DownloadDialog
    },
    data() {
        return {
            menu: false,
            popup: false,
            downloadDialog: false,
            isLibrary: this.$root.libraryTracks.includes(this.track.id)
        }
    },
    props: {
        track: Object,
        //If specified, track can be removed
        playlistId: {
            type: String,
            default: null
        },
        ripple: {
            type: Boolean,
            default: true
        },
        removeQueue: {
            type: Boolean,
            default: false
        }
    },
    methods: {
        //Add track next to queue
        playNext() {
            this.$root.addTrackIndex(this.track, this.$root.queue.index+1);
        },
        addQueue() {
            this.$root.queue.data.push(this.track);
        },
        addLibrary() {
            this.isLibrary = true;
            this.$root.libraryTracks.push(this.track.id);
            this.$axios.put(`/library/track?id=${this.track.id}`);
            this.$root.globalSnackbar = this.$t('Added to library!');
        },
        goAlbum() {
            this.$emit('redirect')
            this.$router.push({
                path: '/album',
                query: {album: JSON.stringify(this.track.album)}
            });
        },
        goArtist(a) {
            this.$emit('redirect');
            this.$router.push({
                path: '/artist',
                query: {artist: JSON.stringify(a)}
            });
        },
        async removeLibrary() {
            this.isLibrary = false;
            this.$root.libraryTracks.splice(this.$root.libraryTracks.indexOf(this.track.id), 1);
            await this.$axios.delete(`/library/track?id=${this.track.id}`);
            this.$root.globalSnackbar = this.$t('Removed from library!');
            this.$emit('remove');
        },
        //Remove from playlist
        async removePlaylist() {
            await this.$axios.delete(`/playlist/${this.playlistId}/tracks`, {
                data: {track: this.track.id}
            });
            this.$root.globalSnackbar = this.$t('Removed from playlist!');
            this.$emit('remove');
        },
        //Download track
        download() {
            this.downloadDialog = true;
        },
        async trackMix() {
            let res = await this.$axios.get('/trackmix/' + this.track.id);
            this.$root.queue.source = {
                text: this.$t('Track Mix'),
                source: 'trackmix',
                data: this.track.id
            };
            this.$root.replaceQueue(res.data);
            this.$root.playIndex(0);
        },
        //Copy link
        share() {
            let copyElem = document.createElement('input');
            copyElem.value = `https://deezer.com/track/${this.track.id}`;
            document.body.appendChild(copyElem);
            copyElem.select();
            document.execCommand('copy');
            document.body.removeChild(copyElem);
            this.$root.globalSnackbar = this.$t('Link copied!');
        }
    },
    watch: {
        '$root.libraryTracks'() {
            this.isLibrary = this.$root.libraryTracks.includes(this.track.id);
        }
    }
}
</script>