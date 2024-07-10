<template>
<v-list>

    <v-overlay v-if='loading'>
        <v-progress-circular indeterminate></v-progress-circular>
    </v-overlay>

    <!-- Sort -->
    <div class='px-4 d-flex' style='max-height: 50px;' v-if='!loading'>
        <div class='text-overline pt-1 mx-2'>
            {{artists.length}} {{$t("Artists")}}
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

    <div class='d-flex flex-wrap justify-center'>
        <v-lazy max-height="200" v-for='artist in filtered' :key='artist.id' class='my-2 ml-3'>
            <ArtistTile :artist='artist' @remove='removed(artist.id)' card></ArtistTile>
        </v-lazy>
    </div>

</v-list>
</template>

<script>
import ArtistTile from '@/components/ArtistTile.vue';

export default {
    name: 'LibraryArtists',
    components: {
        ArtistTile
    },
    data() {
        return {
            artists: [],
            loading: false,

            //Sort
            isReversed: false,
            sortTypes: [
                this.$t('Date Added'),
                this.$t('Name (A-Z)')
            ],
            unsorted: null,
            searchQuery: null
        }
    },
    methods: {
        //Load data
        async load() {
            this.loading = true;
            let res = await this.$axios.get(`/library/artists`);
            if (res.data && res.data.data) {
                this.artists = res.data.data;
            }
            this.loading = false;
        },
        removed(id) {
            this.artists.splice(this.artists.findIndex(a => a.id == id), 1);
        },
        //Sort changed
        async sort(type) {
            let index = this.sortTypes.indexOf(type);
            //Copy original
            if (!this.unsorted)
                this.unsorted = JSON.parse(JSON.stringify(this.artists));
            
            //Using indexes, so it can be translated later
            this.isReversed = false;
            switch (index) {
                //Default
                case 0:
                    this.artists = JSON.parse(JSON.stringify(this.unsorted));
                    break;
                //Name
                case 1:
                    this.artists = this.artists.sort((a, b) => {return a.name.localeCompare(b.name);});
                    break;
            }
        },
        async reverseSort() {
            this.isReversed = !this.isReversed;
            this.artists.reverse();
        }
    },
    mounted() {
        //Initial load
        this.load();
    },
    computed: {
        //Search
        filtered() {
            if (!this.searchQuery)
                return this.artists;
            
            return this.artists.filter(a => a.name.toLowerCase().includes(this.searchQuery.toLowerCase()));
        }
    }
}
</script>