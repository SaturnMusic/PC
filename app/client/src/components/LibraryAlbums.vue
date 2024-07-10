<template>
<v-list>

    <v-overlay v-if='loading'>
        <v-progress-circular indeterminate></v-progress-circular>
    </v-overlay>

    <!-- Sort -->
    <div class='px-4 d-flex' style='max-height: 50px;' v-if='!loading'>
        <div class='text-overline pt-1 mx-2'>
            {{albums.length}} {{$t("Albums")}}
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
        <!-- Search -->
        <v-text-field
            dense
            :label='$t("Search")'
            solo
            class='mx-2'
            v-model='searchQuery'
        ></v-text-field>
    </div>

    <div class='d-flex justify-center flex-wrap'>
        <v-lazy max-height="230" v-for='album in filtered' :key='album.id' class='ma-2'>
            <AlbumTile :album='album' @remove='removed(album.id)' card></AlbumTile>
        </v-lazy>
    </div>

</v-list>
</template>

<script>
import AlbumTile from '@/components/AlbumTile.vue';

export default {
    name: 'LibraryAlbums',
    components: {
        AlbumTile
    },
    data() {
        return {
            albums: [],
            loading: false,

            //Sort
            isReversed: false,
            sortTypes: [
                this.$t('Date Added'),
                this.$t('Name (A-Z)'),
                this.$t('Artist (A-Z)')
            ],
            unsorted: null,
            searchQuery: null
        }
    },
    methods: {
        //Load data
        async load() {
            this.loading = true;
            let res = await this.$axios.get(`/library/albums`);
            if (res.data && res.data.data) {
                this.albums = res.data.data;
            }
            this.loading = false;
        },
        removed(id) {
            this.albums.splice(this.albums.findIndex(a => a.id == id), 1);
        },
        //Sort changed
        async sort(type) {
            let index = this.sortTypes.indexOf(type);
            //Copy original
            if (!this.unsorted)
                this.unsorted = JSON.parse(JSON.stringify(this.albums));
            
            //Using indexes, so it can be translated later
            this.isReversed = false;
            switch (index) {
                //Default
                case 0:
                    this.albums = JSON.parse(JSON.stringify(this.unsorted));
                    break;
                //Name
                case 1:
                    this.albums = this.albums.sort((a, b) => {return a.title.localeCompare(b.title);});
                    break;
                //Artist
                case 2:
                    this.albums = this.albums.sort((a, b) => {return a.artistString.localeCompare(b.artistString);});
                    break;
            }
        },
        async reverseSort() {
            this.isReversed = !this.isReversed;
            this.albums.reverse();
        },
    },
    mounted() {
        //Initial load
        this.load();
    },
    computed: {
        //Search
        filtered() {
            if (!this.searchQuery)
                return this.albums;
            
            return this.albums.filter(a => a.title.toLowerCase().includes(this.searchQuery.toLowerCase()));
        }
    }
}
</script>