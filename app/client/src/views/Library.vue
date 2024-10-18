<template>
<div>
    <h1>{{$t("Library")}} 
        <v-btn class='ml-2 mb-1' icon @click='shuffle' v-if='$rooms.allowControls()'>
            <v-icon>mdi-shuffle</v-icon>
        </v-btn>
        <v-btn class='ml-2 mb-1' icon @click='download'>
            <v-icon>mdi-download</v-icon>
        </v-btn>
    </h1>

    <v-tabs v-model='tab'>
        <v-tab key='tracks'>
            {{$t("Tracks")}}
        </v-tab>
        <v-tab key='albums'>
            {{$t("Albums")}}
        </v-tab>
        <v-tab key='artists'>
            {{$t("Artists")}}
        </v-tab>
        <v-tab key='playlists'>
            {{$t("Playlists")}}
        </v-tab>
        <v-tab key='history'>
            {{$t("History")}}
        </v-tab>
    </v-tabs>

    <v-tabs-items v-model='tab'>
        <!-- Tracks -->
        <v-tab-item key='tracks'>
            <LibraryTracks :height='"calc(100vh - " + ($root.topBar ? 310 : 290) + "px)"'></LibraryTracks>
        </v-tab-item>

        <!-- Albums -->
        <v-tab-item key='albums'>
            <LibraryAlbums></LibraryAlbums>
        </v-tab-item>

        <!-- Artists -->
        <v-tab-item key='artists'>
            <LibraryArtists></LibraryArtists>
        </v-tab-item>

        <!-- Playlists -->
        <v-tab-item key='playlists'>
            <LibraryPlaylists></LibraryPlaylists>
        </v-tab-item>

        <!-- History -->
        <v-tab-item key='history'>
            <LibraryHistory></LibraryHistory>
        </v-tab-item>
    </v-tabs-items>
    
    <DownloadDialog :playlistName='Library' :tracks='this.trcks' v-if='downloadDialog' @close='downloadDialog = false'></DownloadDialog>

</div>
</template>

<script>
import LibraryTracks from '@/components/LibraryTracks.vue';
import LibraryAlbums from '@/components/LibraryAlbums.vue';
import LibraryArtists from '@/components/LibraryArtists.vue';
import LibraryPlaylists from '@/components/LibraryPlaylists.vue';
import LibraryHistory from '@/components/LibraryHistory.vue';
import DownloadDialog from '@/components/DownloadDialog.vue';

export default {
    name: 'Library',
    components: {
        LibraryTracks, LibraryAlbums, LibraryArtists, DownloadDialog, LibraryPlaylists, LibraryHistory
    },
        props: {
        routeTab: {
            default: 'tracks',
            type: String
        }
    },
    data() {
        return {
            tab: null,
            tabs: ['tracks', 'albums', 'artists', 'playlists'],
            downloadDialog: false,
            trcks: [],
        }
    },
    methods: {
        async download() {
            let id = this.$root.profile.favoritesPlaylist;
            this.$axios.get(`/playlist/${id}/?full=idk`).then((res) => {
                this.trcks.push(...res.data.tracks);
            });
            this.downloadDialog = true;
        },
        async shuffle() {
            //Rooms
            if (this.$rooms.room) return;


            let res = await this.$axios.get('/shuffle');
            if (res && res.data) {
                this.$root.queue.source = {
                    text: this.$t('Shuffle'),
                    source: 'shuffled_collection',
                    data: 0
                };
                this.$root.replaceQueue(res.data);
                this.$root.playIndex(0);
            }
        }
    },
    mounted() {
        //Make mutable
        this.tab = this.tabs.indexOf(this.routeTab);
    },
    watch: {
        //Update when navigating from drawer
        routeTab() {
            this.tab = this.tabs.indexOf(this.routeTab);
        }
    }
}
</script>