<template>
<div>

    <!-- Create playlist -->
    <v-card class='text-center pa-2' v-if='edit || !addToPlaylist'> 
        <v-card-text>
            <p v-if='!edit' primary-title class='display-1'>{{$t("Create playlist")}}</p>
            <p v-if='edit' primary-title class='display-1'>{{$t("Edit playlist")}}</p>
            <v-text-field label='Title' class='ma-2' v-model='title'></v-text-field>
            <v-textarea class='mx-2' v-model='description' label='Description' rows='1' auto-grow></v-textarea>
            <v-select class='mx-2' v-model='type' :items='types' label='Type'></v-select>
        </v-card-text>

        <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn class='primary' :loading='createLoading' @click='create'>
                <div v-if='!edit'>{{$t("Create")}}</div>
                <div v-if='edit'>{{$t("Save")}}</div>
            </v-btn>
        </v-card-actions>
    </v-card>

    <!-- Add to playlist -->
    <v-card class='text-center pa-2' v-if='addToPlaylist && !edit'>
        <v-card-text>
            <p primary-title class='display-1'>{{$t("Add to playlist")}}</p>
            <v-btn block class='mb-1' @click='addToPlaylist = false'>
                <v-icon left>mdi-playlist-plus</v-icon>
                {{$t("Create new")}}
            </v-btn>
            <v-list>
                <div v-for='playlist in playlists' :key='playlist.id'>
                    <v-list-item
                        v-if='playlist.user.id == $root.profile.id'
                        @click='addTrack(playlist)'
                        dense>
                        <v-list-item-avatar>
                            <v-img :src='playlist.image.thumb'></v-img>
                        </v-list-item-avatar>
                        <v-list-item-title>{{playlist.title}}</v-list-item-title>
                    </v-list-item>
                </div>

                <v-progress-circular indeterminate v-if='loading'></v-progress-circular>
            </v-list>
        </v-card-text>
    </v-card>


</div>
</template>

<script>
export default {
    name: 'PlaylistPopup',
    data() {
        return {
            //Make mutable
            addToPlaylist: this.track?true:false,

            title: this.playlist ? this.playlist.title : '',
            description: this.playlist ? this.playlist.description : '',
            type: this.$t('Private'),
            types: [this.$t('Public'), this.$t('Private'), this.$t('Collaborative')],
            createLoading: false,
            
            loading: false,
            playlists: []
        }
    },
    props: {
        track: {
            type: Object,
            default: null
        },
        //If editing playlist
        edit: {
            type: Boolean,
            default: false
        },
        //For editting
        playlist: {
            type: Object,
            default: null
        }
    },
    methods: {
        //Create playlist
        async create() {
            this.createLoading = true;
            if (this.edit) {
                await this.$axios.put('/playlist/' + this.playlist.id, {
                    description: this.description,
                    title: this.title,
                    type: this.types.indexOf(this.type),
                });
            } else {
                await this.$axios.post('/playlist', {
                    description: this.description,
                    title: this.title,
                    type: this.types.indexOf(this.type),
                    track: this.track ? this.track.id : null
                });
            }

            this.createLoading = false;
            this.$emit('created');
            this.$emit('close');
            if (this.edit)
                this.$emit("edit");
            else
                this.$root.globalSnackbar = this.$t('Added to playlist!');
        },
        //Add track to playlist
        async addTrack(playlist) {
            await this.$axios.post(`/playlist/${playlist.id}/tracks`, {track: this.track.id});
            this.$emit('close');
            this.$root.globalSnackbar = this.$t('Added to playlist!');
        }
    },
    async mounted() {
        //Load playlists, if adding to playlist
        if (this.track) {
            this.loading = true;
            
            let res = await this.$axios.get(`/library/playlists`);
            this.playlists = res.data.data;

            this.loading = false;
        }
    }
};
</script>