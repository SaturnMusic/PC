<template>
<v-list height='calc(100vh - 145px)' class='overflow-y-auto' v-scroll.self='scroll'>
    <v-card class='d-flex'>
        <v-img 
            :src='playlist.image.full' 
            :lazy-src="playlist.image.thumb" 
            max-height="100%"
            max-width="35vh"
            contain
        ></v-img>
        
        <div class='pl-4'>
            <v-overlay absolute :value="loading" z-index="3" opacity='0'>
                <v-progress-circular indeterminate></v-progress-circular>
            </v-overlay>
            <h1>
                {{playlist.title}}
                <v-icon v-if='playlist.type == "private"' class='ml-2 mb-2'>mdi-lock</v-icon>
                <v-icon v-if='playlist.type == "public"' class='ml-2 mb-2'>mdi-earth</v-icon>
                <v-icon v-if='playlist.type == "collaborative"' class='ml-2 mb-2'>mdi-account-edit</v-icon>
            </h1>
            <h3>{{playlist.user.name}}</h3>
            <h5>{{playlist.description}}</h5>
            <div class='mt-2' v-if='!loading'>
                <span class='text-subtitle-2'>{{playlist.trackCount}} {{$t("tracks")}}</span><br>
                <span class='text-subtitle-2'>{{$t("Duration")}}: {{$duration(playlist.duration)}}</span><br>
                <span class='text-subtitle-2'>{{$numberString(playlist.fans)}} {{$t('fans')}}</span><br>
            </div>
            
            <div class='my-2 d-flex'>
                <v-btn color='primary' class='mr-1' @click='play'>
                    <v-icon left>mdi-play</v-icon>
                    {{$t('Play')}}
                </v-btn>
                <v-btn color='red' class='mx-1' @click='library' :loading='libraryLoading' v-if='!isOwn'>
                    <div v-if='!playlist.library'>
                        <v-icon left>mdi-heart</v-icon>
                        {{$t('Library')}}
                    </div>
                    <div v-if='playlist.library'>
                        <v-icon left>mdi-heart-remove</v-icon>
                        {{$t('Remove')}}
                    </div>
                </v-btn>
                <v-btn color='green' class='mx-1' @click='download'>
                    <v-icon left>mdi-download</v-icon>
                    {{$t('Download')}}
                </v-btn>
                <v-btn color='red' class='mx-1' v-if='isOwn' @click='deleteDialog = true'>
                    <v-icon left>mdi-delete</v-icon>
                    {{$t('Delete')}}
                </v-btn>
                <v-btn color='red' class='mx-1' v-if='isOwn' @click='editDialog = true'>
                    <v-icon left>mdi-pencil</v-icon>
                    {{$t('Edit')}}
                </v-btn>
                <div class='mx-2' dense stlye='max-width: 120px;'>
                    <v-select class='px-2' dense solo :items='sortTypes' @change='sort' :label='$t("Sort by")'>
                    </v-select>
                </div>
                <div class='px-2' @click='reverseSort'>
                    <v-btn icon>
                        <v-icon v-if='isReversed'>mdi-sort-reverse-variant</v-icon>
                        <v-icon v-if='!isReversed'>mdi-sort-variant</v-icon>
                    </v-btn>
                </div>
            </div>
        </div>
    </v-card>

    <h1 class='my-2 px-2'>Tracks</h1>
        <v-lazy
            v-for='(track, index) in playlist.tracks'
            :key='index.toString() + "-" + track.id'
            ><TrackTile
                :track='track'
                @click='playIndex(index)'
                :playlistId='playlist.id'
                @remove='trackRemoved(index)'
            ></TrackTile>
        </v-lazy>

    <div class='text-center' v-if='loadingTracks'>
        <v-progress-circular indeterminate></v-progress-circular>
    </div>

    <DownloadDialog :playlistName='playlist.title' :tracks='playlist.tracks' v-if='downloadDialog' @close='downloadDialog = false'></DownloadDialog>

    <!-- Delete playlist -->
    <v-dialog v-model='deleteDialog' max-width='256px'>
        <v-card>
            <v-card-title>
                {{$t("Delete")}}
            </v-card-title>
            <v-card-text>
                {{$t("Are you sure you want to delete this playlist?")}}
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn text @click='deleteDialog = false' class='mx-2'>{{$t("Cancel")}}</v-btn>
                <v-btn text color='red' @click='deleteDialog = false; deletePlaylist();'>{{$t("Delete")}}</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>

    <!-- Edit playlist -->
    <v-dialog v-model='editDialog' max-width='400px'>
        <PlaylistPopup edit :playlist='this.playlist' @edit='refresh()' v-if='editDialog'></PlaylistPopup>
    </v-dialog>


</v-list>
</template>

<script>
import TrackTile from '@/components/TrackTile.vue';
import DownloadDialog from '@/components/DownloadDialog.vue';
import PlaylistPopup from '@/components/PlaylistPopup.vue';

export default {
    name: 'PlaylistTile',
    components: {
        TrackTile, DownloadDialog, PlaylistPopup
    },
    props: {
        playlistData: Object,
    },
    data() {
        return {
            //Props cannot be modified
            playlist: this.playlistData,
            //Initial loading
            loading: false,
            loadingTracks: false,
            //Add to library button
            libraryLoading: false,
            downloadDialog: false,
            deleteDialog: false,
            editDialog: false,
            
            //Sort
            sortTypes: [
                this.$t('Date Added'),
                this.$t('Name (A-Z)'),
                this.$t('Artist (A-Z)'),
                this.$t('Album (A-Z)')
            ],
            isReversed: false
        }
    },
    methods: {
        async playIndex(index) {
            //Load tracks
            if (this.playlist.tracks.length == 0)
                await this.loadAllTracks();
            
            this.$root.queue.source = {
                text: this.playlist.title,
                source: 'playlist',
                data: this.playlist.id
            };
            this.$root.replaceQueue(this.playlist.tracks);
            this.$root.playIndex(index);

            //Load rest of tracks on background
            if (this.playlist.tracks.length < this.playlist.trackCount) {
                this.loadAllTracks().then(() => {
                    this.$root.replaceQueue(this.playlist.tracks);
                });
            }
        },
        play() {
            this.playIndex(0);
        },
        scroll(event) {
            let loadOffset = event.target.scrollHeight - event.target.offsetHeight - 100;
            if (event.target.scrollTop > loadOffset) {
                if (!this.loadingTracks && !this.loading) this.loadTracks();
            }
        },

        //Lazy loading
        async loadTracks() {
            if (this.playlist.tracks.length >= this.playlist.trackCount) return;
            this.loadingTracks = true;

            let offset = this.playlist.tracks.length;
            let res = await this.$axios.get(`/playlist/${this.playlist.id}?start=${offset}`);
            if (res.data && res.data.tracks) {
                this.playlist.tracks.push(...res.data.tracks);
            }
            this.loadingTracks = false;
        },

        //Load all the tracks
        async loadAllTracks() {
            this.loadingTracks = true;
            let data = await this.$axios.get(`/playlist/${this.playlist.id}?full=iguess`);
            if (data && data.data && data.data.tracks) {
                this.playlist.tracks.push(...data.data.tracks.slice(this.playlist.tracks.length));
            }
            this.loadingTracks = false;
        },
        async library() {
            this.libraryLoading = true;
            if (this.playlist.library) {
                //Remove
                await this.$axios.delete('/library/playlist?id=' + this.playlist.id);
                this.$root.globalSnackbar = this.$t('Removed from library!');
                this.playlist.library = false;
            } else {
                //Add
                await this.$axios.put(`/library/playlist?id=${this.playlist.id}`);
                this.$root.globalSnackbar = this.$t('Added to library!');
                this.playlist.library = true;
            }
            this.libraryLoading = false;
        },
        //Refresh metadata
        async refresh() {
            this.editDialog = false;
            this.loading = true;
            let data = await this.$axios.get(`/playlist/${this.playlist.id}?start=0`);
            if (data && data.data) {
                let tracks = this.playlist.tracks;
                let library = this.playlist.library;
                this.playlist = data.data;
                this.playlist.tracks = tracks;
                this.playlist.library = library;
            }
            this.loading = false;
        },
        async initialLoad() {
            //Load meta and intial tracks
            if (this.playlist.tracks.length < this.playlist.trackCount) {
                this.loading = true;
                let data = await this.$axios.get(`/playlist/${this.playlist.id}?start=0`);
                if (data && data.data && data.data.tracks) {
                    //Preserve library state
                    let inLib = this.playlist.library;
                    this.playlist = data.data;
                    this.playlist.library = inLib;
                }
                this.loading = false;
            }
        },
        //On track removed
        trackRemoved(index) {
            this.playlist.tracks.splice(index, 1);
        },
        async download() {
            //Load all tracks
            if (this.playlist.tracks.length < this.playlist.trackCount) {
                await this.loadAllTracks();
            }
            this.downloadDialog = true;
        },
        async deletePlaylist() {
            await this.$axios.delete(`/playlist/${this.playlist.id}`);
            this.$router.go(-1);
        },
        //Sort changed
        async sort(type) {
            let index = this.sortTypes.indexOf(type);
            //Preload all tracks
            if (this.playlist.tracks.length < this.playlist.trackCount) 
                await this.loadAllTracks();
            //Copy original
            if (!this.tracksUnsorted)
                this.tracksUnsorted = JSON.parse(JSON.stringify(this.playlist.tracks));
            
            //Using indexes, so it can be translated later
            this.isReversed = false;
            switch (index) {
                //Default
                case 0:
                    this.tracks = JSON.parse(JSON.stringify(this.tracksUnsorted));
                    break;
                //Name
                case 1:
                    this.tracks = this.playlist.tracks.sort((a, b) => {return a.title.localeCompare(b.title);});
                    break;
                //Artist
                case 2:
                    this.tracks = this.playlist.tracks.sort((a, b) => {return a.artistString.localeCompare(b.artistString);});
                    break;
                //Album
                case 3:
                    this.tracks = this.playlist.tracks.sort((a, b) => {return a.album.title.localeCompare(b.album.title);});
                    break;
            }
        },
        async reverseSort() {
            //Preload tracks if not sorted yet
            if (this.playlist.tracks.length < this.playlist.trackCount) 
                await this.sort(0);
            this.isReversed = !this.isReversed;
            this.playlist.tracks.reverse();
        },
    },
    mounted() {
        this.initialLoad(); 
    },
    computed: {
        isOwn() {
            if (this.$root.profile.id == this.playlist.user.id) return true;
            return false;
        }
    },
    watch: {
        //Reload on playlist change from drawer
        playlistData(n, o) {
            if (n.id == o.id) return;
            this.playlist = this.playlistData;
            this.loading = false;
            this.initialLoad();
        }
    }
}
</script>