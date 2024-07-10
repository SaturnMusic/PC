<template>
<div>

    <v-dialog v-model='dShow' max-width='420'>
        <v-card>

            <v-card-title class='headline'>
                {{$t("Download")}} {{tracks.length}} {{$t("tracks")}}
            </v-card-title>
            <v-card-text class='pb-0'>

                <v-select 
                    :label='$t("Quality")' 
                    persistent-hint
                    :items='qualities'
                    v-model='qualityString'
                    :hint='$t("Estimated size:") + " " + $filesize(estimatedSize)'
                ></v-select>

                <v-checkbox
                    v-model='autostart'
                    :label='$t("Start downloading")'
                ></v-checkbox>

            </v-card-text>

            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn text @click='$emit("close")'>{{$t("Cancel")}}</v-btn>
                <v-btn text @click='download'>{{$t("Download")}}</v-btn>
            </v-card-actions>

        </v-card>
    </v-dialog>

</div>
</template>

<script>
export default {
    name: 'DownloadDialog',
    props: {
        tracks: Array,
        show: {
            type: Boolean,
            default: true
        },
        playlistName: {
            type: String,
            default: null
        }
    },
    data() {
        return {
            shown: true,
            qualities: [
                this.$t('Settings quality'),
                'MP3 128kbps',
                'MP3 320kbps',
                'FLAC ~1441kbps'
            ],
            qualityString: this.$t('Settings quality'),
            autostart: true,
            dShow: this.show
        }
    },
    methods: {
        //Get quality int from select
        qualityInt() {
            let i = this.qualities.indexOf(this.qualityString);
            if (i == 1) return 1;
            if (i == 2) return 3;
            if (i == 3) return 9;
            return this.$root.settings.downloadsQuality;
        },
        //Add files to download queue
        async download() {
            let data = {
                tracks: this.tracks,
                playlistName: this.playlistName,
                quality: null
            }
            if (this.qualities.indexOf(this.qualityString) != 0 && this.qualityString) {
                data['quality'] = this.qualityInt();
            }
            await this.$axios.post(`/downloads`, data);
            
            if (this.autostart) this.$axios.put('/download');
            this.$emit("close");
        }
    },
    computed: {
        estimatedSize() {
            let qi = this.qualityInt();
            let duration = this.tracks.reduce((a, b) => a + (b.duration / 1000), 0);

            //Magic numbers = bitrate / 8 * 1024 = bytes per second
            switch (qi) {
                case 1:
                    return duration * 16384;
                case 3:
                    return duration * 40960;
                case 9:
                    //FLAC is 1144, because more realistic
                    return duration * 146432;
            }
            return duration * this.$root.settings.downloadsQuality;

        }
    },
    watch: {
        //Prevent errors on closing with mouse
        show() {
            this.dShow = this.show;
        },
        dShow() {
            if (!this.dShow) this.$emit('close');
        }
    },
    mounted() {
        //Auto download
        if (!this.$root.settings.downloadDialog) {
            this.download();
            setInterval(() => {
                this.$emit('close');
                this.dShow = false;
            }, 50);
            
        }
    }
}
</script>