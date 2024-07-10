<template>
<div>

    <v-card 
        width='225px' 
        height='100px'
        :img='channel.image.thumb'
        @click='click'
    >
        <v-container fill-height class='justify-center'>
            <v-card-title class='font-weight-black text-truncate text-h6 pa-1'>{{channel.title}}</v-card-title>
        </v-container>
        
    </v-card>

</div>
</template>

<script>
export default {
    name: 'DeezerChannel',
    props: {
        channel: Object
    },
    methods: {
        click() {
            console.log(this.channel.target);
            this.$router.push({
                path: '/page',
                query: {target: this.channel.target}
            });
        }
    }
}
</script>