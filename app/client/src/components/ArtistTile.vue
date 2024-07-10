<template>
<div>
    <v-list-item @click='click' v-if='!card' @contextmenu.prevent="menu = true">
        <v-list-item-avatar>
            <v-img :src='artist.picture.thumb'></v-img>
        </v-list-item-avatar>
        <v-list-item-content>
            <v-list-item-title>{{artist.name}}</v-list-item-title>
            <v-list-item-subtitle v-if='!tiny'>{{$abbreviation(artist.fans)}} {{$t("fans")}}</v-list-item-subtitle>
        </v-list-item-content>
        <v-list-item-action>
            <!-- Context menu -->
            <v-menu v-model='menu' offset-y offset-x absolue>
                <template v-slot:activator="{on, attrs}">
                    <v-btn v-on='on' v-bind='attrs' icon>
                        <v-icon>mdi-dots-vertical</v-icon>
                    </v-btn>
                </template>
                <v-list dense>
                    <!-- Add library -->
                    <v-list-item dense @click='library' v-if='!artist.library'>
                        <v-list-item-icon>
                            <v-icon>mdi-heart</v-icon>
                        </v-list-item-icon>
                        <v-list-item-content>
                            <v-list-item-title>{{$t("Add to library")}}</v-list-item-title>
                        </v-list-item-content>
                    </v-list-item>
                    <!-- Remove from library -->
                    <v-list-item dense @click='library' v-if='artist.library'>
                        <v-list-item-icon>
                            <v-icon>mdi-heart-remove</v-icon>
                        </v-list-item-icon>
                        <v-list-item-content>
                            <v-list-item-title>{{$t("Remove from library")}}</v-list-item-title>
                        </v-list-item-content>
                    </v-list-item>
                    <!-- Share -->
                    <v-list-item dense @click='share'>
                        <v-list-item-icon>
                            <v-icon>mdi-share-variant</v-icon>
                        </v-list-item-icon>
                        <v-list-item-content>
                            <v-list-item-title>{{$t("Share")}}</v-list-item-title>
                        </v-list-item-content>
                    </v-list-item>
                </v-list>
            </v-menu>

        </v-list-item-action>
    </v-list-item>

    <!-- Card version -->
    <v-card max-height='200px' width='180px' v-if='card' @click='click' color='transparent' elevation='0'>
        <div class='d-flex justify-center'>
            <v-avatar size='150' class='ma-1'>
                <v-img :src='artist.picture.thumb'>
                </v-img>
            </v-avatar>
        </div>

        <div class='pa-2 text-subtitle-2 text-center text-truncate'>{{artist.name}}</div>
    </v-card>

</div>
</template>

<script>
export default {
    name: 'ArtistTile',
    data() {
        return {
            menu: false
        }
    },
    props: {
        artist: Object,
        card: {
            type: Boolean,
            default: false,
        },
        tiny: {
            type: Boolean,
            default: false
        },
    },
    methods: {
        async library() {
            if (this.artist.library) {
                //Remove
                await this.$axios.delete('/library/artist?id=' + this.artist.id);
                this.$root.globalSnackbar = this.$t('Removed from library!');
                this.artist.library = false;
                this.$emit('remove');
            } else {
                //Add
                await this.$axios.put(`/library/artist?id=${this.artist.id}`);
                this.$root.globalSnackbar = this.$t('Added to library!');
                this.artist.library = true;
            }
        },
        click() {
            //Navigate to details
            this.$router.push({
                path: '/artist',
                query: {artist: JSON.stringify(this.artist)}
            });
            this.$emit('clicked');
        },
        //Copy link
        share() {
            let copyElem = document.createElement('input');
            copyElem.value = `https://deezer.com/artist/${this.artist.id}`;
            document.body.appendChild(copyElem);
            copyElem.select();
            document.execCommand('copy');
            document.body.removeChild(copyElem);
            this.$root.globalSnackbar = this.$t('Link copied!');
        }
    }
}

</script>