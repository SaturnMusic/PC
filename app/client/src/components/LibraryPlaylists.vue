<template>
<v-list>

    <v-overlay v-if='loading'>
        <v-progress-circular indeterminate></v-progress-circular>
    </v-overlay>

    <div class='d-flex'>
        <!-- Sort -->
        <div class='mt-1 px-2 d-flex'>
            <div class='text-overline pt-1 mx-2'>
                {{playlists.length}} {{$t("Playlists")}}
            </div>
            <div style="max-width: 200px;" class='mx-2'>
                <v-select class='px-2' dense solo :items='sortTypes' @change='sort' :label='$t("Sort by")'>
                </v-select>
            </div>
            <div class='px-2' @click='reverseSort'>
                <v-btn icon>
                    <v-icon v-if='isReversed'>mdi-sort-reverse-variant</v-icon>
                    <v-icon v-if='!isReversed'>mdi-sort-variant</v-icon>
                </v-btn>
            </div>
        </div>
        <!-- Search -->
        <v-text-field
            dense
            :label='$t("Search")'
            solo
            class='mx-2'
            v-model='searchQuery'
        ></v-text-field>
    </div>

    <v-dialog max-width="400px" v-model='popup'>
        <PlaylistPopup @created='playlistCreated'></PlaylistPopup>
    </v-dialog>

    <div class='d-flex justify-center flex-wrap'>
        <!-- Add playlist card -->
        <v-card width='175px' height='175px' class='ma-2 d-flex justify-center align-center flex-column text-center rounded-lg' outlined @click='popup = true'>
            <v-icon large>
                mdi-playlist-plus
            </v-icon>
            <br>
            <p class='text-h6 font-weight-bold'>{{$t("Create new playlist")}}</p>
        </v-card>

        <v-lazy max-height="220" v-for='playlist in filtered' :key='playlist.id' class='ma-2'>
            <PlaylistTile :playlist='playlist' @remove='removed(playlist.id)' card cardTitle></PlaylistTile>
        </v-lazy>
    </div>

</v-list>
</template>

<script>
import PlaylistTile from '@/components/PlaylistTile.vue';
import PlaylistPopup from '@/components/PlaylistPopup.vue';

export default {
    name: 'LibraryPlaylists',
    components: {
        PlaylistTile, PlaylistPopup
    },
    data() {
        return {
            playlists: [],
            loading: false,
            popup: false,

            //Sort
            isReversed: false,
            sortTypes: [
                this.$t('Date Added'),
                this.$t('Name (A-Z)'),
            ],
            unsorted: null,
            searchQuery: null
        }
    },
    methods: {
        //Load data
        async load() {
            this.loading = true;
            let res = await this.$axios.get(`/library/playlists`);
            if (res.data && res.data.data) {
                this.playlists = res.data.data;
            }
            this.loading = false;

        },
        //Playlist created, update list
        playlistCreated() {
            this.popup = false;
            this.playlists = [];
            this.load();
        },
        //On playlist remove
        removed(id) {
            this.playlists.splice(this.playlists.findIndex(p => p.id == id), 1);
        },
        //Sort changed
        async sort(type) {
            let index = this.sortTypes.indexOf(type);
            //Copy original
            if (!this.unsorted)
                this.unsorted = JSON.parse(JSON.stringify(this.playlists));
            
            //Using indexes, so it can be translated later
            this.isReversed = false;
            switch (index) {
                //Default
                case 0:
                    this.playlists = JSON.parse(JSON.stringify(this.unsorted));
                    break;
                //Name
                case 1:
                    this.playlists = this.playlists.sort((a, b) => {return a.title.localeCompare(b.title);});
                    break;
            }
        },
        async reverseSort() {
            this.isReversed = !this.isReversed;
            this.playlists.reverse();
        },
    },
    mounted() {
        //Initial load
        this.load();
    },
    computed: {
        //Search playlists
        filtered() {
            if (!this.searchQuery)
                return this.playlists;
            
            return this.playlists.filter(p => p.title.toLowerCase().includes(this.searchQuery.toLowerCase()));
        }
    }
}
</script>