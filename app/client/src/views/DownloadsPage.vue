<template>
<div>

    <h1 class='pb-2'>{{$t("Downloads")}}</h1>
    <div v-if='$root.downloads.downloading'>
        <v-card v-for='(download, index) in $root.downloads.threads' :key='"t" + index.toString()' max-width='100%'>
            <v-list-item>
                <v-list-item-avatar>
                    <v-img :src='download.track.albumArt.thumb'></v-img>
                </v-list-item-avatar>
                <v-list-item-content>
                    <v-list-item-title>{{download.track.title}}</v-list-item-title>
                    <v-list-item-subtitle>
                        {{$t('Downloaded')}}: {{$filesize(download.downloaded)}} / {{$filesize(download.size)}}<br>
                    </v-list-item-subtitle>
                </v-list-item-content>
        </v-list-item>

        </v-card>
    </div>

    <h1 class='pb-2'>{{$t("Queue")}}:</h1>
    <div class='text-h6 mr-4 pb-2 d-flex'>{{$t("Total")}}: {{$root.downloads.queue.length}}
        <v-btn @click='$root.toggleDownload' class='ml-4' color='primary'>
            <div v-if='$root.downloads.downloading'>
                <v-icon>mdi-stop</v-icon>
                {{$t("Stop")}}
            </div>
            <div v-if='!$root.downloads.downloading'>
                <v-icon>mdi-download</v-icon>
                {{$t("Start")}}
            </div>
        </v-btn>
        <!-- Open dir -->
        <v-btn @click='openDir' class='ml-4' v-if='$root.settings.electron'>
            <v-icon>mdi-folder</v-icon>
            {{$t("Show folder")}}
        </v-btn>
        <!-- Delete all -->
        <v-btn @click='deleteDownload(-1)' class='ml-4' color='red'>
            <v-icon>mdi-delete</v-icon>
            {{$t("Clear queue")}}
        </v-btn>
    </div>

    <!-- Queue -->
    <v-list dense>
        <div v-for='(download, index) in $root.downloads.queue' :key='download.id'>
            <v-list-item dense>
                <v-list-item-avatar>
                    <v-img :src='download.track.albumArt.thumb'></v-img>
                </v-list-item-avatar>
                <v-list-item-content>
                    <v-list-item-title>{{download.track.title}}</v-list-item-title>
                    <v-list-item-subtitle>{{download.track.artistString}}</v-list-item-subtitle>
                </v-list-item-content>
                <v-list-item-action>
                    <v-btn icon @click='deleteDownload(index)'>
                        <v-icon>mdi-delete</v-icon>
                    </v-btn>
                </v-list-item-action>
            </v-list-item>
        </div>
    </v-list>

</div>
</template>

<script>

export default {
    name: 'DownloadsPage',
    methods: {
        //Open downloads directory using electron
        openDir() {
            const {ipcRenderer} = window.require('electron');
            ipcRenderer.send('openDownloadsDir');
        },
        //Remove download from queue
        async deleteDownload(i) {
            await this.$axios.delete(`/downloads/${i}`);
        }
    }
}
</script>