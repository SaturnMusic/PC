<template>
<div>

    <v-card max-height='200px' width='180px' @click='play' loading='loading' color='transparent' elevation='0'>
        <div class='d-flex justify-center'>
            <v-avatar size='150' class='ma-1'>
                <v-img v-if="stl.image && stl.image.thumb" :src='stl.image.thumb'>
                    <!-- <v-card-title class='font-weight-black text-truncate text-h6 pa-1 ps-3' style="text-shadow: 1.3px 1.3px 6px rgba(0, 0, 0, 0.65)">{{stl.title}}</v-card-title> -->
                </v-img>
            </v-avatar>
        </div>
        <div class='pa-2 text-subtitle-2 text-center text-truncate'>{{stl.title}}</div>
    </v-card>

</div>
</template>

<script>
export default {
    name: 'DeezerFlow',
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
            let res = await this.$axios.get('/smarttracklist/flow/' + this.stl.id);
            if (!res.data) {
                this.loading = false;
                return;
            }

            //Send to player
            this.$root.queue.source = {
                text: this.stl.title,
                source: 'dynamic_page_flow_config',
                data: this.stl.id,
                type: this.stl.id,
            };
            this.$root.replaceQueue(res.data);
            this.$root.playIndex(0);
            
            this.loading = false;
        }
    }
}
</script>