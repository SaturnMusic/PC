<template>
<v-list dense>
    <!-- Play album -->
    <v-list-item dense @click='$emit("play")'>
        <v-list-item-icon>
            <v-icon>mdi-play</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
            <v-list-item-title>{{$t("Play")}}</v-list-item-title>
        </v-list-item-content>
    </v-list-item>
    <!-- Add to queue -->
    <v-list-item dense @click='$emit("addQueue")'>
        <v-list-item-icon>
            <v-icon>mdi-playlist-plus</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
            <v-list-item-title>{{$t("Add to queue")}}</v-list-item-title>
        </v-list-item-content>
    </v-list-item>
    <!-- Add to library -->
    <v-list-item dense @click='$emit("library")' v-if='!album.library'>
        <v-list-item-icon>
            <v-icon>mdi-heart</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
            <v-list-item-title>{{$t("Add to library")}}</v-list-item-title>
        </v-list-item-content>
    </v-list-item>
    <!-- Remove from library -->
    <v-list-item dense @click='$emit("library")' v-if='album.library'>
        <v-list-item-icon>
            <v-icon>mdi-heart-remove</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
            <v-list-item-title>{{$t("Remove from library")}}</v-list-item-title>
        </v-list-item-content>
    </v-list-item>
    <!-- Share -->
    <v-list-item dense @click='$emit("share")'>
        <v-list-item-icon>
            <v-icon>mdi-share-variant</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
            <v-list-item-title>{{$t("Share")}}</v-list-item-title>
        </v-list-item-content>
    </v-list-item>
    <!-- Download -->
    <v-list-item dense @click='$emit("download")'>
        <v-list-item-icon>
            <v-icon>mdi-download</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
            <v-list-item-title>{{$t("Download")}}</v-list-item-title>
        </v-list-item-content>
    </v-list-item>
</v-list>
</template>

<script>
export default {
    name: 'AlbumContext',
    props: {
        album: Object,
    }
}
</script>