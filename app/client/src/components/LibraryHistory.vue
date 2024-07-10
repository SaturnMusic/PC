<template>
<div>

    <div v-if='loading'>
        <v-progress-circular indeterminate class='ma-4'></v-progress-circular>
    </div>

    <v-list v-if='!loading'>
        <v-list-item v-if='!$root.settings.logListen'>
            <v-list-item-avatar>
                <v-icon class='yellow--text'>mdi-alert</v-icon>
            </v-list-item-avatar>
            <v-list-item-content>
                <v-list-item-title>
                    {{$t("Stream logging is disabled!")}}
                </v-list-item-title>
                <v-list-item-subtitle>
                    {{$t("Enable it in settings for history to work properly.")}}
                </v-list-item-subtitle>
            </v-list-item-content>
        </v-list-item>

        <v-lazy v-for='(track, index) in tracks' :key='track.id + "INDEX" + index.toString()' max-height='100'>
            <TrackTile :track='track' @click='play(index)'></TrackTile>
        </v-lazy>
    </v-list>

</div>
</template>

<script>

import TrackTile from '@/components/TrackTile.vue';

export default {
    name: 'LibraryHistory',
    components: {
        TrackTile
    },
    data() {
        return {
            loading: true,
            tracks: []
        }
    },
    methods: {
        async load() {
            this.loading = true;

            //Fetch
            let res = await this.$axios.get('/history');
            if (res.data) this.tracks = res.data;

            this.loading = false;
        },
        //Load as queue and play
        play(index) {
            this.$root.queue.source = {
                text: this.$t('History'),
                source: 'history',
                data: null
            };
            this.$root.replaceQueue(this.tracks);
            this.$root.playIndex(index);
        }
    },
    mounted() {
        //Load on start
        this.load();
    }
}
</script>