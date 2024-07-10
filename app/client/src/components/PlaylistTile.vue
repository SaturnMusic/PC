<template>
<div>
    <!-- List tile -->
    <v-list-item @click='click' v-if='!card' @contextmenu.prevent="menu = true">
        <v-hover v-slot:default='{hover}'>
            <v-list-item-avatar>
                <v-img :src='playlist.image.thumb'></v-img>
                <v-overlay absolute :value='hover'>
                    <v-btn icon large @click.stop='play'>
                        <v-icon>mdi-play</v-icon>
                    </v-btn>
                </v-overlay>
            </v-list-item-avatar>
        </v-hover>

        <v-list-item-content>
            <v-list-item-title>{{playlist.title}}</v-list-item-title>
            <v-list-item-subtitle>{{$numberString(playlist.trackCount)}} {{$t("tracks")}}</v-list-item-subtitle>
        </v-list-item-content>
        <v-list-item-action>
            <!-- Context menu -->
            <v-menu v-model='menu' offset-y offset-x absolue>
                <template v-slot:activator="{on, attrs}">
                    <v-btn v-on='on' v-bind='attrs' icon>
                        <v-icon>mdi-dots-vertical</v-icon>
                    </v-btn>
                </template>
                <v-list dense>
                    <!-- Play -->
                    <v-list-item dense @click='play'>
                        <v-list-item-icon>
                            <v-icon>mdi-play</v-icon>
                        </v-list-item-icon>
                        <v-list-item-content>
                            <v-list-item-title>{{$t('Play')}}</v-list-item-title>
                        </v-list-item-content>
                    </v-list-item>

                    <!-- Add to library -->
                    <v-list-item dense v-if='!canRemove && !playlist.library' @click='library'>
                        <v-list-item-icon>
                            <v-icon>mdi-heart</v-icon>
                        </v-list-item-icon>
                        <v-list-item-content>
                            <v-list-item-title>{{$t('Add to library')}}</v-list-item-title>
                        </v-list-item-content>
                    </v-list-item>

                    <!-- Remove -->
                    <v-list-item dense v-if='canRemove' @click='remove'>
                        <v-list-item-icon>
                            <v-icon>mdi-playlist-remove</v-icon>
                        </v-list-item-icon>
                        <v-list-item-content>
                            <v-list-item-title>{{$t('Remove from library')}}</v-list-item-title>
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
                    
                    <!-- Download -->
                    <v-list-item dense @click='download'>
                        <v-list-item-icon>
                            <v-icon>mdi-download</v-icon>
                        </v-list-item-icon>
                        <v-list-item-content>
                            <v-list-item-title>{{$t('Download')}}</v-list-item-title>
                        </v-list-item-content>
                    </v-list-item>

                </v-list>
            </v-menu>
        </v-list-item-action>
    </v-list-item>

    <!-- Card -->
    <v-card v-if='card' max-width='175px' max-height='220px' @click='click' color='transparent' elevation='0'>
        <v-hover v-slot:default='{hover}'>
            <div>

                <v-img :src='playlist.image.thumb' class='rounded-lg'>
                </v-img>

                <v-overlay absolute :value='hover' opacity='0.5'>
                    <v-btn fab small color='white' @click.stop='play'>
                        <v-icon color='black'>mdi-play</v-icon>
                    </v-btn>
                </v-overlay>

                <div v-if='cardTitle' class='px-2 pt-2 pb-1 text-subtitle-2 text-center text-truncate'>{{playlist.title}}</div>

            </div>
        </v-hover>
    </v-card>

    <DownloadDialog :playlistName='playlist.title' :tracks='tracks' v-if='downloadDialog' @close='downloadDialog = false'></DownloadDialog>


</div>
</template>

<script>
import DownloadDialog from '@/components/DownloadDialog.vue';

export default {
    name: 'PlaylistTile',
    components: {DownloadDialog},
    data() {
        return {
            menu: false,
            hover: false,
            downloadDialog: false,
            tracks: null
        }
    },
    props: {
        playlist: Object,
        card: {
            type: Boolean,
            default: false
        },
        cardTitle: {
            type: Boolean,
            default: false
        }
    },
    methods: {
        async play() {
            let playlist = this.playlist;
            //Load if no tracks
            if (!playlist || playlist.tracks.length == 0)
                playlist = (await this.$axios.get(`/playlist/${playlist.id}?full=iguess`)).data;
            if (!playlist) return;

            //Play
            this.$root.queue.source = {
                text: playlist.title,
                source: 'playlist',
                data: playlist.id
            };
            this.$root.replaceQueue(playlist.tracks);
            this.$root.playIndex(0);

            //Load all tracks
            if (playlist.tracks.length != playlist.trackCount) {
                let data = await this.$axios.get(`/playlist/${playlist.id}?full=iguess`);
                playlist = data.data;
            }
        },
        //On click navigate to details
        click() {
            this.$router.push({
                path: '/playlist',
                query: {playlist: JSON.stringify(this.playlist)}
            });
        },
        async remove() {
            //Delete own playlist
            if (this.playlist.user.id == this.$root.profile.id) {
                await this.$axios.delete(`/playlist/${this.playlist.id}`);
                this.$root.globalSnackbar = this.$t('Playlist deleted!');
            } else {
                //Remove from library
                await this.$axios.get('/library/playlist&id=' + this.playlist.id);
                this.$root.globalSnackbar = this.$t('Removed from library!');
            }
            
            this.$emit('remove');
        },
        async download() {
            let tracks = this.playlist.tracks;
            if (tracks.length < this.playlist.trackCount) {
                let data = await this.$axios.get(`/playlist/${this.playlist.id}?full=iguess`);
                tracks = data.data.tracks;
            }
            this.tracks = tracks;
            this.downloadDialog = true;
        },
        async library() {
            await this.$axios.put(`/library/playlist?id=${this.playlist.id}`);
            this.$root.globalSnackbar = this.$t('Added to library!');
            this.playlist.library = true;
        },
        //Copy link
        share() {
            let copyElem = document.createElement('input');
            copyElem.value = `https://deezer.com/playlist/${this.playlist.id}`;
            document.body.appendChild(copyElem);
            copyElem.select();
            document.execCommand('copy');
            document.body.removeChild(copyElem);
            this.$root.globalSnackbar = this.$t('Link copied!');
        }
    },
    computed: {
        canRemove() {
            //Own playlist
            if (this.$root.profile.id == this.playlist.user.id || this.playlist.library) return true;
            return false;
        }
    }
};


</script>