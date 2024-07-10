<template>
  <div>

    <h1 class='pb-2'>{{$t('Search results for:')}} "{{query}}"</h1>

    <!-- Loading overlay -->
    <v-overlay opacity='0.9' :value='loading' z-index='3'>
      <v-progress-circular indeterminate>
        
      </v-progress-circular>
    </v-overlay>

    <!-- Error overlay -->
    <v-overlay opacity='0.9' :value='error' z-index="3">
      <h1 class='red--text'>{{$t("Error loading data!")}}</h1><br>
      <h3>{{$t("Try again later!")}}</h3>
    </v-overlay>

    <!-- Tabs -->
    <v-tabs v-model="tab">
      <v-tabs-slider></v-tabs-slider>
      <v-tab key="tracks">
        <v-icon left>mdi-music-note</v-icon>{{$t("Tracks")}}
      </v-tab>
      <v-tab>
        <v-icon left>mdi-album</v-icon>{{$t("Albums")}}
      </v-tab>
      <v-tab>
          <v-icon left>mdi-account-music</v-icon>{{$t("Artists")}}
      </v-tab>
      <v-tab>
          <v-icon left>mdi-playlist-music</v-icon>{{$t("Playlists")}}
      </v-tab>
    </v-tabs>

    <v-tabs-items v-model="tab">
      <!-- Tracks -->
      <v-tab-item key="tracks">
        <div v-if="data && data.tracks">
          <v-list avatar>
            <TrackTile
              v-for="(track, i) in data.tracks"
              :track="track"
              :key="track.id"
              @click="playTrack(i)"
            ></TrackTile>
          </v-list>
        </div>
      </v-tab-item>
      <!-- Albums -->
      <v-tab-item key="albums">
        <div v-if="data && data.albums">
          <v-list avatar>
            <AlbumTile
              v-for="(album) in data.albums"
              :album="album"
              :key="album.id"
            ></AlbumTile>
          </v-list>
        </div>
      </v-tab-item>
      <!-- Artists -->
      <v-tab-item key="artists">
        <div v-if="data && data.artists">
          <v-list avatar>
            <ArtistTile
              v-for="(artist) in data.artists"
              :artist="artist"
              :key="artist.id"
            ></ArtistTile>
          </v-list>
        </div>
      </v-tab-item>
      <!-- Playlists -->
      <v-tab-item key="playlists">
        <div v-if="data && data.playlists">
          <v-list avatar>
            <PlaylistTile
              v-for="(playlist) in data.playlists"
              :playlist="playlist"
              :key="playlist.id"
            ></PlaylistTile>
          </v-list>
        </div>
      </v-tab-item>
    </v-tabs-items>
  </div>
</template>

<script>
import TrackTile from "@/components/TrackTile.vue";
import AlbumTile from "@/components/AlbumTile.vue";
import ArtistTile from '@/components/ArtistTile.vue';
import PlaylistTile from '@/components/PlaylistTile.vue';

export default {
  name: "Search",
  components: {
    TrackTile, AlbumTile, ArtistTile, PlaylistTile
  },
  data() {
    return {
      data: null,
      loading: true,
      error: false,
      tab: null
    };
  },
  props: {
    query: String
  },
  methods: {
    load() {
      this.data = null;
      this.loading = true;
      //Call API
      this.$axios
        .get("/search", {
          params: { q: this.query }
        })
        .then(data => {
          this.data = data.data;
          this.loading = false;
        })
        .catch(() => {
          this.loading = false;
          this.error = true;
        });
    },
    //On click for track tile
    playTrack(i) {
      this.$root.queue.source = {
        text: this.$t("Search"),
        source: "search",
        data: this.query
      };
      this.$root.replaceQueue(this.data.tracks);
      this.$root.playIndex(i);
    }
  },
  watch: {
    //Reload on new search query
    query() {
      this.load();
    }
  },
  mounted() {
    this.load();
  }
};
</script>