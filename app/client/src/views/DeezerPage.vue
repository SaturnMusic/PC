<template>
<div style='overflow-x: hidden;'>
    <!-- Loading & Error -->
    <v-overlay opacity='0.95' z-index='0' v-if='loading || error'>
        <v-progress-circular indeterminate v-if='loading'></v-progress-circular>
        <v-icon class='red--text' v-if='error'>
            mdi-alert-circle
        </v-icon>
    </v-overlay>


    <div v-if='data'>
        <div v-for='(section, sectionIndex) in data.sections' :key='"section"+sectionIndex' class='mb-8'>

            <h1 class='py-2'>{{section.title}}</h1>

            <!-- Row layout -->
            <div class='d-flex' style='overflow-x: auto; overflow-y: hidden;' v-if='section.layout == "row"'>
                <div v-for='(item, index) in section.items' :key='"item"+index' class='mr-4 my-2'>
                    <PlaylistTile v-if='item.type == "playlist"' :playlist='item.data' card class='mb-4'></PlaylistTile>
                    <ArtistTile v-if='item.type == "artist"' :artist='item.data' card></ArtistTile>
                    <DeezerChannel v-if='item.type == "channel"' :channel='item.data' class='mb-2'></DeezerChannel>
                    <AlbumTile v-if='item.type == "album"' :album='item.data' card></AlbumTile>
                    <SmartTrackList v-if='item.type == "smarttracklist" || item.type == "flow"' :stl='item.data'></SmartTrackList>
                </div>
                <div v-if='section.hasMore' class='mx-2 align-center justify-center d-flex'>
                    <v-btn @click='showMore(section)' color='primary'>
                        {{$t("Show more")}}
                    </v-btn>
                </div>
            </div>

            <!-- Grid layout -->
            <div class='d-flex flex-wrap justify-space-around ' v-if='section.layout == "grid"' >

                <div v-for='(item, index) in section.items' :key='"item"+index' class='mr-4 my-2'>
                    <PlaylistTile v-if='item.type == "playlist"' :playlist='item.data' card class='mb-4'></PlaylistTile>
                    <ArtistTile v-if='item.type == "artist"' :artist='item.data' card></ArtistTile>
                    <DeezerChannel v-if='item.type == "channel"' :channel='item.data' class='mb-2'></DeezerChannel>
                    <AlbumTile v-if='item.type == "album"' :album='item.data' card></AlbumTile>
                    <SmartTrackList v-if='item.type == "smarttracklist" || item.type == "flow"' :stl='item.data'></SmartTrackList>
                </div>
            </div>

        </div>
    </div>

</div>
</template>

<script>
import PlaylistTile from '@/components/PlaylistTile.vue';
import ArtistTile from '@/components/ArtistTile.vue';
import DeezerChannel from '@/components/DeezerChannel.vue';
import AlbumTile from '@/components/AlbumTile.vue';
import SmartTrackList from '@/components/SmartTrackList.vue';

export default {
    name: 'DeezerPage',
    components: {PlaylistTile, ArtistTile, DeezerChannel, AlbumTile, SmartTrackList},
    props: {
        target: String
    },
    data() {
        return {
            data: null,
            loading: true,
            error: false,
            Ctarget: this.target
        }
    },
    methods: {
        //Load data
        async load() {
            this.loading = true;
            this.data = null;
            let data = await this.$axios.get(`/page?target=${this.target}`);
            this.data = data.data;
            this.loading = false;
        },
        //Show more items
        showMore(section) {
            this.$router.push({
                path: '/page',
                query: {target: section.target}
            });
        }
    },
    //Load data on load
    created() {
        this.load();
    },
    watch: {
        //Check if target changed to not use cached version
        target() {
            if (this.target == this.Ctarget) return;
            this.Ctarget = this.target;
            this.load(); 
        }
    }
}
</script>