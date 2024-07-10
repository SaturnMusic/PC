<template>
<div>

    <v-card max-width='175px' max-height='220px' height='220px' @click='play' :loading='loading' elevation='0' color='transparent'>
        <v-img :src='stl.cover.thumb'>
        </v-img>

        <div class='pa-2 text-subtitle-2'>{{stl.subtitle}}</div>
    </v-card>

</div>
</template>

<script>
export default {
    name: 'SmartTrackList',
    props: {
        stl: Object
    },
    data() {
        return {
            loading: false
        }
    },
    methods: {
        //Load stt as source
        async play() {
            this.loading = true;
            
            //Load data
            let res = await this.$axios.get('/smarttracklist/' + this.stl.id);
            if (!res.data) {
                this.loading = false;
                return;
            }

            //Send to player
            this.$root.queue.source = {
                text: this.stl.title,
                source: 'smarttracklist',
                data: this.stl.id
            };
            this.$root.replaceQueue(res.data);
            this.$root.playIndex(0);
            
            this.loading = false;
        }
    }
}
</script>