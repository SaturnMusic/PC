<template>
<div>
    <h1 class='pb-2'>{{$t('Settings')}}</h1>
    <v-list>
        <v-select 
            class='px-4 mx-2'
            :label='$t("Streaming Quality")' 
            persistent-hint
            :items='qualities'
            @change='updateStreamingQuality'
            v-model='streamingQuality'
        ></v-select>

        <v-select 
            class='px-4 mx-2'
            :label='$t("Download Quality")' 
            persistent-hint
            :items='qualities'
            @change='updateDownloadQuality'
            v-model='downloadQuality'
        ></v-select>

        <!-- Download path -->
        <v-text-field 
            class='px-4 mx-2' 
            :label='$t("Downloads Directory")'
            v-model='$root.settings.downloadsPath'
            append-icon='mdi-open-in-app'
            @click:append='selectDownloadPath'
        ></v-text-field>

        <!-- Crossfade -->
        <v-slider
            :label='$t("Crossfade (ms)")'
            min='0'
            max='10000'
            thumb-label
            step='500'
            ticks
            class='px-4 mt-4 mx-2'
            v-model='$root.settings.crossfadeDuration'
        ></v-slider>

        <!-- Downloader -->
        <v-subheader>{{$t("Downloader")}}</v-subheader>
        <v-divider></v-divider>

        <!-- Download dialog -->
        <v-list-item>
            <v-list-item-action>
                <v-checkbox v-model='$root.settings.downloadDialog' class='pl-2'></v-checkbox>
            </v-list-item-action>
            <v-list-item-content>
                <v-list-item-title>{{$t("Show download dialog")}}</v-list-item-title>
                <v-list-item-subtitle>{{$t("Always show download confirm dialog before downloading.")}}</v-list-item-subtitle>
            </v-list-item-content>
        </v-list-item>

        <!-- Download threads -->
        <v-slider
            :label='$t("Simultaneous downloads")'
            min='1'
            max='16'
            thumb-label
            step='1'
            ticks
            dense
            class='px-4 mx-2'
            v-model='$root.settings.downloadThreads'
        ></v-slider>
        <!-- Tag Settings -->
        <v-list-item  @click='TagsDialog = true'>
            <v-list-item-avatar>
                <v-icon>mdi-label</v-icon>
            </v-list-item-avatar>
            <v-list-item-content>
                <v-list-item-title>{{$t("Tags")}}</v-list-item-title>
            </v-list-item-content>
        </v-list-item>
        <!-- Create artist folder -->
        <v-list-item>
            <v-list-item-action>
                <v-checkbox v-model='$root.settings.createArtistFolder' class='pl-2'></v-checkbox>
            </v-list-item-action>
            <v-list-item-content>
                <v-list-item-title>{{$t("Create folders for artists")}}</v-list-item-title>
            </v-list-item-content>
        </v-list-item>
        <!-- Create album folder -->
        <v-list-item>
            <v-list-item-action>
                <v-checkbox v-model='$root.settings.createAlbumFolder' class='pl-2'></v-checkbox>
            </v-list-item-action>
            <v-list-item-content>
                <v-list-item-title>{{$t("Create folders for albums")}}</v-list-item-title>
            </v-list-item-content>
        </v-list-item>
        <!-- Create playlist folder -->
        <v-list-item>
            <v-list-item-action>
                <v-checkbox v-model='$root.settings.playlistFolder' class='pl-2'></v-checkbox>
            </v-list-item-action>
            <v-list-item-content>
                <v-list-item-title>{{$t("Create folders for playlists")}}</v-list-item-title>
            </v-list-item-content>
        </v-list-item>
       <!-- Seperate albums by disk -->
       <v-list-item>
            <v-list-item-action>
                <v-checkbox v-model='$root.settings.albumsbydisk' class='pl-2'></v-checkbox>
            </v-list-item-action>
            <v-list-item-content>
                <v-list-item-title>{{$t("Seperate albums by disks")}}</v-list-item-title>
            </v-list-item-content>
        </v-list-item>
       <!-- Overwrite currently downloaded files -->
       <v-list-item>
            <v-list-item-action>
                <v-checkbox v-model='$root.settings.overwritedownloadedfiles' class='pl-2'></v-checkbox>
            </v-list-item-action>
            <v-list-item-content>
                <v-list-item-title>{{$t("Overwrite already downloaded files")}}</v-list-item-title>
            </v-list-item-content>
        </v-list-item>
        <!-- Download lyrics -->
        <v-list-item>
            <v-list-item-action>
                <v-checkbox v-model='$root.settings.downloadLyrics' class='pl-2'></v-checkbox>
            </v-list-item-action>
            <v-list-item-content>
                <v-list-item-title>{{$t("Download lyrics")}}</v-list-item-title>
            </v-list-item-content>
        </v-list-item>
         <!-- Download Cover -->
         <v-list-item>
            <v-list-item-action>
                <v-checkbox v-model='$root.settings.downloadCover' class='pl-2'></v-checkbox>
            </v-list-item-action>
            <v-list-item-content>
                <v-list-item-title>{{$t("Download cover")}}</v-list-item-title>
            </v-list-item-content>
            <!-- Resolution -->
            <v-select :items='artResolutions' :label='$t("Art Resolution")' v-model='$root.settings.coverResolution' style='max-width: 150px;'></v-select>
            
        </v-list-item>

        <!-- Artist Seperator -->
        <v-text-field
            class='px-4 my-2'
            :label='$t("Artist Seperator")'
            persistent-hint
            v-model='$root.settings.artistSeperator'
        ></v-text-field>

        <!-- Download naming -->
        <v-text-field
            class='px-4 my-2'
            :label='$t("Download Filename")'
            persistent-hint
            v-model='$root.settings.downloadFilename'
            :hint='$t("Variables") + ": %title%, %artists%, %artist%, %feats%, %trackNumber%, %0trackNumber%, %album%, %year%, %label%, %albumArtist%, %albumArtists%"'
        ></v-text-field>

        <!-- UI -->
        <v-subheader>{{$t("UI")}}</v-subheader>
        <v-divider></v-divider>

        <!-- Language -->
        <v-select 
            class='mt-2 px-4 mx-2'
            :label='$t("Language")' 
            persistent-hint
            :items='languageNames'
            @change='updateLanguage'
        ></v-select>
        <!-- Light theme -->
        <v-list-item>
            <v-list-item-action>
                <v-checkbox 
                    v-model='$root.settings.lightTheme' 
                    class='pl-2'
                    @change='$vuetify.theme.dark = !$root.settings.lightTheme'
                ></v-checkbox>
            </v-list-item-action>
            <v-list-item-content>
                <v-list-item-title>{{$t("Light theme")}}</v-list-item-title>
            </v-list-item-content>
        </v-list-item>
        <!-- Primary color -->
        <v-list-item @click='colorPicker = true'>
            <v-list-item-avatar>
                <v-icon>mdi-palette</v-icon>
            </v-list-item-avatar>
            <v-list-item-content>
                <v-list-item-title class='pl-2'>{{$t("Select primary color")}}</v-list-item-title>
            </v-list-item-content>
        </v-list-item>
        <!-- Autocomplete -->
        <v-list-item>
            <v-list-item-action>
                <v-checkbox v-model='$root.settings.showAutocomplete' class='pl-2'></v-checkbox>
            </v-list-item-action>
            <v-list-item-content>
                <v-list-item-title>{{$t("Show autocomplete in search")}}</v-list-item-title>
            </v-list-item-content>
        </v-list-item>
        <!-- Keep sidebar open -->
        <v-list-item>
            <v-list-item-action>
                <v-checkbox v-model='$root.settings.sidebarOpen' class='pl-2'></v-checkbox>
            </v-list-item-action>
            <v-list-item-content>
                <v-list-item-title>{{$t("Keep sidebar open")}}</v-list-item-title>
                <v-list-item-subtitle>{{$t("WARNING: Might require reload to work properly!")}}</v-list-item-subtitle>
            </v-list-item-content>
        </v-list-item>
        <!-- Keep sidebar closed -->
        <v-list-item>
            <v-list-item-action>
                <v-checkbox v-model='$root.settings.sidebarClosed' class='pl-2'></v-checkbox>
            </v-list-item-action>
            <v-list-item-content>
                <v-list-item-title>{{$t("Keep sidebar closed")}}</v-list-item-title>
                <v-list-item-subtitle>{{$t("WARNING: Might require reload to work properly!")}}</v-list-item-subtitle>
            </v-list-item-content>
        </v-list-item>
        <!-- Native top bar -->
        <v-list-item>
            <v-list-item-action>
                <v-checkbox v-model='$root.settings.nativeTopBar' class='pl-2'></v-checkbox>
            </v-list-item-action>
            <v-list-item-content>
                <v-list-item-title>{{$t("Native top bar")}}</v-list-item-title>
                <v-list-item-subtitle>{{$t("Requires restart of Saturn!")}}</v-list-item-subtitle>
            </v-list-item-content>
        </v-list-item>
        <!-- Performance mode -->
        <v-list-item>
            <v-list-item-action>
                <v-checkbox v-model='$root.settings.perfmode' class='pl-2'></v-checkbox>
            </v-list-item-action>
            <v-list-item-content>
                <v-list-item-title>{{$t("Performance Mode")}}</v-list-item-title>
                <v-list-item-subtitle>{{$t("Only display essential track info. Incompatible with Clubs.")}}</v-list-item-subtitle>
                <v-list-item-subtitle>{{$t("Greatly improves general load time")}}</v-list-item-subtitle>
            </v-list-item-content>
        </v-list-item>
        <!-- Background image -->
        <v-text-field
            class='px-4 my-2'
            :label='$t("Background Image")'
            persistent-hint
            v-model='$root.settings.backgroundImage'
            :hint='$t("Enter URL or absolute path. WARNING: Requires reload!")'
        ></v-text-field>
        
        <!-- Accounts -->
        <v-subheader>{{$t("Integrations")}}</v-subheader>
        <v-divider></v-divider>

        <!-- Log listening -->
        <v-list-item>
            <v-list-item-action>
                <v-checkbox v-model='$root.settings.logListen' class='pl-2'></v-checkbox>
            </v-list-item-action>
            <v-list-item-content>
                <v-list-item-title>{{$t("Log track listens to Deezer")}}</v-list-item-title>
                <v-list-item-subtitle>{{$t("This allows listening history, flow and recommendations to work properly.")}}</v-list-item-subtitle>
            </v-list-item-content>
        </v-list-item>
        <!-- LastFM -->
        <v-list-item @click='connectLastFM' v-if='!$root.settings.lastFM'>
            <v-list-item-avatar>
                <v-img src='lastfm.svg'></v-img>
            </v-list-item-avatar>
            <v-list-item-content>
                <v-list-item-title class='pl-2'>{{$t("Login with LastFM")}}</v-list-item-title>
                <v-list-item-subtitle class='pl-2'>{{$t("Connect your LastFM account to allow scrobbling.")}}</v-list-item-subtitle>
            </v-list-item-content>
        </v-list-item>
        <v-list-item v-if='$root.settings.lastFM' @click='disconnectLastFM'>
            <v-list-item-avatar>
                <v-icon>mdi-logout</v-icon>
            </v-list-item-avatar>
            <v-list-item-content>
                <v-list-item-title class='red--text'>{{$t("Disconnect LastFM")}}</v-list-item-title>
            </v-list-item-content>
        </v-list-item>
        <!-- LastFM -->
        <v-text-field
            class='px-4 my-2'
            :label='$t("LastFM API Key")'
            v-model='$root.settings.lastfmkey'
        ></v-text-field>

        <v-text-field
            class='px-4 my-2'
            :label='$t("LastFM API Secret")'
            v-model='$root.settings.lastfmsecret'
        ></v-text-field>
        <!-- Discord -->

        <!-- <v-list-item>
            <v-list-item-action>
                <v-select
                class='mr-4'
                v-model='$root.settings.lrcprovider'
                label="Provider"
                :items="['Deezer', 'lrclib', 'genius', 'mxm']"
                ></v-select>
            </v-list-item-action>
            <v-list-item-content>
                <v-list-item-title>{{$t("Custom Lyric Provider")}}</v-list-item-title>
            </v-list-item-content>
        </v-list-item> -->

        <v-list-item>
            <v-list-item-action>
                <v-checkbox class='pl-2' v-model='$root.settings.enableDiscord' @click='snackbarText = $t("Requires restart to apply!"); snackbar = true'></v-checkbox>
            </v-list-item-action>
            <v-list-item-content>
                <v-list-item-title>{{$t("Discord Rich Presence")}}</v-list-item-title>
                <v-list-item-subtitle>{{$t("Enable Discord Rich Presence, requires restart to toggle!")}}</v-list-item-subtitle>
            </v-list-item-content>
        </v-list-item>
        <!-- Discord Join Button -->
        <v-list-item>
            <v-list-item-action>
                <v-checkbox class='pl-2' v-model='$root.settings.discordJoin' @click='snackbarText = $t("Requires restart to apply!"); snackbar = true'></v-checkbox>
            </v-list-item-action>
            <v-list-item-content>
                <v-list-item-title>{{$t("Discord Join Button")}}</v-list-item-title>
                <v-list-item-subtitle>{{$t("Enable Discord join button for syncing tracks, requires restart to toggle!")}}</v-list-item-subtitle>
            </v-list-item-content>
        </v-list-item>

        <!-- Misc -->
        <v-subheader>{{$t("Other")}}</v-subheader>
        <v-divider></v-divider>

        <div class='d-flex mx-4 pt-2'>
            <v-select
                v-model='$root.settings.contentLanguage'
                :items='languageList'
                :label='$t("Content language")'
                class='mr-4'
            ></v-select>

            <v-select
                v-model='$root.settings.contentCountry'
                :items='countryList'
                :label='$t("Content country")'
                class='ml-4'
            ></v-select>

        </div>

        <!-- Minimize to tray -->
        <v-list-item v-if='$root.settings.electron'>
            <v-list-item-action>
                <v-checkbox v-model='$root.settings.minimizeToTray' class='pl-2'></v-checkbox>
            </v-list-item-action>
            <v-list-item-content>
                <v-list-item-title>{{$t("Minimize to tray")}}</v-list-item-title>
            </v-list-item-content>
        </v-list-item>
        <!-- Close on exit -->
        <v-list-item v-if='$root.settings.electron'>
            <v-list-item-action>
                <v-checkbox v-model='$root.settings.closeOnExit' class='pl-2'></v-checkbox>
            </v-list-item-action>
            <v-list-item-content>
                <v-list-item-title>{{$t("Close on exit")}}</v-list-item-title>
                <v-list-item-subtitle>{{$t("Don't minimize to tray")}}</v-list-item-subtitle>
            </v-list-item-content>
        </v-list-item>
        <!-- Force white tray icon -->
            <!-- <v-list-item v-if='$root.settings.electron'>
                <v-list-item-action>
                    <v-checkbox v-model='$root.settings.forceWhiteTrayIcon' class='pl-2'></v-checkbox>
                </v-list-item-action>
                <v-list-item-content>
                    <v-list-item-title>{{$t("Force white tray icon")}}</v-list-item-title>
                    <v-list-item-subtitle>{{$t("Force default (white) tray icon if theme incorrectly detected. Requires restart.")}}</v-list-item-subtitle>
                </v-list-item-content>
            </v-list-item> -->
        
        <!-- Logout -->
        <v-btn block color='red' class='mt-4' @click='logout'>
            <v-icon>mdi-logout</v-icon>
            {{$t("Logout")}}
        </v-btn>

    </v-list>

    <v-btn fab color='primary' absolute bottom right class='mb-12' @click='save' :loading='saving'>
        <v-icon>mdi-content-save</v-icon>
    </v-btn>

    <!-- Info snackbar -->
    <v-snackbar v-model="snackbar">
      {{ snackbarText }}

      <template v-slot:action="{ attrs }">
        <v-btn
          color="primary"
          text
          v-bind="attrs"
          @click="snackbar = false"
        >
          {{$t("Dismiss")}}
        </v-btn>
      </template>
    </v-snackbar>

    <!-- Color picker overlay -->
    <v-overlay :value='colorPicker' elevation='2'>
        <v-card>
            <v-color-picker v-model='$root.settings.primaryColor' mode='hexa'></v-color-picker>
            <v-btn :color='$root.settings.primaryColor' block class='my-1 px-2' @click='saveColor'>
                {{$t("Save")}}
            </v-btn>
        </v-card>
    </v-overlay>

    <v-dialog v-model='TagsDialog' max-width='512'>
    <v-card elevation='2'>
        <v-card-title class="headline">
        Tag Settings
        </v-card-title>
        <v-card-text>
        <v-divider class="mt-3"></v-divider>
        <v-form>
            <v-checkbox 
            v-model='$root.settings.cover' 
            :label="$t('Cover')"
            ></v-checkbox>
            <v-checkbox 
            v-model='$root.settings.title' 
            :label="$t('Song Title')"
            ></v-checkbox>
            <v-checkbox 
            v-model='$root.settings.artist' 
            :label="$t('Song Artist')"
            ></v-checkbox>
            <v-checkbox 
            v-model='$root.settings.trackNumber' 
            :label="$t('Track Number')"
            ></v-checkbox>
            <v-checkbox 
            v-model='$root.settings.trackTotal' 
            :label="$t('Track Total')"
            ></v-checkbox>
            <v-checkbox 
            v-model='$root.settings.discNumber' 
            :label="$t('Disc Number')"
            ></v-checkbox>
            <v-checkbox 
            v-model='$root.settings.albumArtist' 
            :label="$t('Album Artist')"
            ></v-checkbox>
            <v-checkbox 
            v-model='$root.settings.genre' 
            :label="$t('Genre')"
            ></v-checkbox>
            <v-checkbox 
            v-model='$root.settings.year' 
            :label="$t('Year')"
            ></v-checkbox>
            <v-checkbox 
            v-model='$root.settings.date' 
            :label="$t('Date')"
            ></v-checkbox>
            <v-checkbox 
            v-model='$root.settings.explicit' 
            :label="$t('Explicit')"
            ></v-checkbox>
            <v-checkbox 
            v-model='$root.settings.isrc' 
            :label="$t('IRSC')"
            ></v-checkbox>
            <v-checkbox 
            v-model='$root.settings.length' 
            :label="$t('Song Length')"
            ></v-checkbox>
            <v-checkbox 
            v-model='$root.settings.barcode' 
            :label="$t('Album Barcode')"
            ></v-checkbox>
            <v-checkbox 
            v-model='$root.settings.bpm' 
            :label="$t('Song BPM')"
            ></v-checkbox>
            <v-checkbox 
            v-model='$root.settings.label' 
            :label="$t('Label')"
            ></v-checkbox>
            <v-checkbox 
            v-model='$root.settings.lyrics' 
            :label="$t('Lyrics')"
            ></v-checkbox>
            <v-checkbox 
            v-model='$root.settings.copyright' 
            :label="$t('Copyright')"
            ></v-checkbox>
            <v-checkbox 
            v-model='$root.settings.composer' 
            :label="$t('Composer')"
            ></v-checkbox>
            <v-checkbox 
            v-model='$root.settings.involvedPeople' 
            :label="$t('Involved People')"
            ></v-checkbox>
            <v-checkbox 
            v-model='$root.settings.source' 
            :label="$t('Source')"
            ></v-checkbox>
            <v-checkbox 
            v-model='$root.settings.savePlaylistAsCompilation' 
            :label="$t('Save Playlist As Compilation')"
            ></v-checkbox>
        </v-form>
        <v-divider class="mt-3"></v-divider>
        </v-card-text>
        <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn text @click="TagsDialog = false">
            {{$t("Close")}}
        </v-btn>
        </v-card-actions>
    </v-card>
    </v-dialog>
</div>
</template>

<script>

export default {
    name: 'Settings',
    data() {
        return {
            saving: false,
            qualities: [
                'MP3 128kbps',
                'MP3 320kbps',
                'FLAC ~1441kbps'
            ],
            streamingQuality: null,
            downloadQuality: null,
            devToolsCounter: 0,
            snackbarText: null,
            snackbar: false,
            language: 'en',
            languages: [
                {code: 'en', name: 'English'},
                {code: 'ar', name: 'Arabic'},
                {code: 'ast', name: 'Asturian'},
                {code: 'hr', name: 'Croatian'},
                {code: 'fil', name: 'Filipino'},
                {code: 'fr', name: 'French'},
                {code: 'de', name: 'German'},
                {code: 'el', name: 'Greek'},
                {code: 'id', name: 'Indonesian'},
                {code: 'it', name: 'Italian'},
                {code: 'pl', name: 'Polish'},
                {code: 'pt', name: 'Portuguese'},
                {code: 'ro', name: 'Romanian'},
                {code: 'ru', name: 'Russian'},
                {code: 'sk', name: 'Slovak'},
                {code: 'es', name: 'Spanish'},
                {code: 'tr', name: 'Turkish'},
                {code: 'uk', name: 'Ukrainian'},
                {code: 'vi', name: 'Vietnamese'}
            ],
            artResolutions: [256, 512, 600, 800, 1000, 1200, 1400, 1600, 1800],
            colorPicker: false,
            TagsDialog: false,
            
            //Lists from Deezer website
            languageList: ["me", "da", "de", "en", "us", "es", "mx", "fr", "hr", "id", "it", "hu", "ms", "nl", "no", "pl", "br", "pt", "ru", "ro", "sq", "sk", "sl", "sr", "fi", "sv", "tr", "cs", "bg", "uk", "he", "ar", "th", "cn", "ja", "ko"],
            countryList: ["AF", "AL", "DZ", "AO", "AI", "AG", "AR", "AM", "AU", "AT", "AZ", "BH", "BD", "BB", "BY", "BE", "BJ", "BT", "BO", "BA", "BW", "BR", "IO", "VG", "BN", "BG", "BF", "BI", "KH", "CM", "CA", "CV", "KY", "CF", "TD", "CL", "CX", "CC", "CO", "CK", "CR", "HR", "CY", "CZ", "CD", "DK", "DJ", "DM", "TL", "EC", "EG", "SV", "GQ", "ER", "EE", "ET", "FM", "FJ", "FI", "FR", "GA", "GM", "GE", "DE", "GH", "GR", "GD", "GT", "GN", "GW", "HN", "HU", "IS", "ID", "IQ", "IE", "IL", "IT", "JM", "JP", "JO", "KZ", "KE", "KI", "KW", "KG", "LA", "LV", "LB", "LS", "LR", "LY", "LT", "LU", "MK", "MG", "MW", "MY", "ML", "MT", "MH", "MR", "MU", "MX", "MD", "MN", "ME", "MS", "MA", "MZ", "NA", "NR", "NP", "NZ", "NI", "NE", "NG", "NU", "NF", "NO", "OM", "PK", "PW", "PA", "PG", "PY", "PE", "PL", "PT", "QA", "CG", "RO", "RU", "RW", "KN", "LC", "VC", "WS", "ST", "SA", "SN", "RS", "SC", "SL", "SG", "SK", "SI", "SO", "ZA", "ES", "LK", "SJ", "SZ", "SE", "CH", "TJ", "TZ", "TH", "KM", "FK", "CI", "MV", "NL", "PH", "PN", "SB", "TG", "TK", "TO", "TN", "TR", "TM", "TC", "TV", "UG", "UA", "AE", "GB", "US", "UY", "UZ", "VU", "VE", "VN", "YE", "ZM", "ZW"],
        }
    },
    methods: {
        //Save settings
        save() {
            this.saving = true;
            this.$root.saveSettings();
            //Artificial wait to make it seem like something happened.
            setTimeout(() => {this.saving = false;}, 500);
            this.snackbarText = this.$t("Settings saved!");
            this.snackbar = true;
        },
        getQuality(v) {
            let i = this.qualities.indexOf(v);
            if (i == 0) return 1;
            if (i == 1) return 3;
            if (i == 2) return 9;
            return 3;
        },
        //Update streaming quality
        updateStreamingQuality(v) {
            this.$root.settings.streamQuality = this.getQuality(v);
        },
        updateDownloadQuality(v) {
            this.$root.settings.downloadsQuality = this.getQuality(v);
        },
        //Quality to show currently selected quality
        getPresetQuality(q) {
            if (q == 9) return this.qualities[2];
            if (q == 3) return this.qualities[1];
            if (q == 1) return this.qualities[0];
            return this.qualities[1];
        },
        //Select download path, electron only
        selectDownloadPath() {
            //Electron check
            if (!this.$root.settings.electron) {
                alert(this.$t("Available only in Electron version!"));
                return;
            }
            const {ipcRenderer} = window.require('electron');
            ipcRenderer.on('selectDownloadPath', (event, newPath) => {
                if (newPath) this.$root.settings.downloadsPath = newPath;
            });
            ipcRenderer.send('selectDownloadPath');
        },
        async logout() {
            this.$root.settings.arl = null;
            await this.$root.saveSettings();
            location.reload();
        },
        //Redirect to lastfm login
        async connectLastFM() {
            let res = await this.$axios.get('/lastfm');
            window.location.replace(res.data.url);
        },
        //Disconnect LastFM
        async disconnectLastFM() {
            this.$root.settings.lastFM = null;
            await this.$root.saveSettings();
            window.location.reload();
        },
        saveColor() {
            this.colorPicker = false;
            this.$vuetify.theme.themes.dark.primary = this.$root.settings.primaryColor;
            this.$vuetify.theme.themes.light.primary = this.$root.settings.primaryColor;
            this.$root.saveSettings();
        },
        updateLanguage(l) {
            let code = this.languages.filter(lang => lang.name == l)[0].code;
            this.language = code;
            this.$root.updateLanguage(code);
            this.$root.settings.language = code;
        },
        //Update light theme
        changeLightTheme(v) {
            this.$root.settings.lightTheme = v;
            if (v) {
                this.$vuetify.theme.dark = false;
                this.$vuetify.theme.light = true;
            } else {
                this.$vuetify.theme.dark = true;
                this.$vuetify.theme.light = false;
            }
        },
        async applyLGBT() {
            await this.save();
            window.location.reload();
        }
    },
    computed: {
        languageNames() {
            return this.languages.map(l => l.name);
        }
    },
    mounted() {
        this.streamingQuality = this.getPresetQuality(this.$root.settings.streamQuality);
        this.downloadQuality = this.getPresetQuality(this.$root.settings.downloadsQuality);

        //Press 'f' 10 times, to open dev tools
        document.addEventListener('keyup', (event) => {
            if (event.keyCode === 70) {
                this.devToolsCounter += 1;
            } else {
                this.devToolsCounter = 0;
            }
            if (this.devToolsCounter == 10) {
                this.devToolsCounter = 0;
                if (this.$root.settings.electron) {
                    const {remote} = window.require('electron');
                    remote.getCurrentWindow().toggleDevTools();
                }
            }

            //RGB
            if (event.code == 'KeyG' && event.ctrlKey && event.altKey) {
                this.$root.primaryColorRainbow();
            }
        });
    }
}
</script>