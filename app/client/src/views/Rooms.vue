<template>
    <div>
        <div v-if='!$rooms.room'>
        <h1 style="display: flex; align-items: center; position: relative">
        <div style="display: flex; align-items: center">
          Clubs
          <v-btn class="ml-2 mb-1" icon @click="loadRooms()">
            <v-icon>mdi-refresh</v-icon>
          </v-btn>
        </div>
        <v-btn
          @click="createDialog = true"
          color="primary"
          class="my-4"
          style="position: absolute; right: 0"
        >
          <v-icon left>mdi-plus</v-icon>
          Create new club
        </v-btn>
      </h1>
    
            <!-- List of rooms -->
            <v-list>
                <div v-if='!rooms' class='ma-auto text-center'>
                    <v-progress-circular indeterminate></v-progress-circular>
                </div>
                <v-list-item v-for='room in rooms' :key='room.id' @click='joinRoom(room)'>
                    <v-list-item-icon>
                        <v-icon v-if='room.password'>mdi-lock</v-icon>
                        <v-icon v-if='!room.password'>mdi-earth</v-icon>
                    </v-list-item-icon>
                    <v-list-item-content>
                        <v-list-item-title>{{room.title}}</v-list-item-title>
                        <v-list-item-subtitle>
                            <v-icon class='mr-2'>mdi-account-multiple</v-icon>{{room.users}}
                        </v-list-item-subtitle>
                    </v-list-item-content>
                </v-list-item>
            </v-list>
        </div>
    
        <!-- Joined room -->
        <div v-if='$rooms.room'>
            <v-container>
                <v-row no-gutters>
                    <!-- Left side -->
                    <v-col cols='6' class='px-2'>
                        <h2 class='text-center mb-2'>{{$rooms.room.title}}</h2>
                        <v-btn icon class='leave-button text-center' @click='leave()' color='red'>
                            <v-icon>mdi-close</v-icon>
                        </v-btn>
                        <!-- User list -->
                        <h3 class='text-center mb-2'>Listeners ({{$rooms.room.users.length}}):</h3>
                        <div>
                            <v-list dense class='overflow-y-auto' style='max-height: calc(50vh - 160px); height: calc(50vh - 160px);'>
                                <v-list-item dense v-for='user in $rooms.room.users' :key='"user" + user.sid'>
                                    <v-list-item-avatar>
                                        <v-img :src='user.picture' width='32' contain></v-img>
                                    </v-list-item-avatar>
                                    <v-list-item-content>
                                        <v-list-item-title v-if='user.admin' style='color: #F44336;'>{{user.username}}</v-list-item-title>
                                        <v-list-item-title v-if='!user.admin'>{{user.username}}</v-list-item-title>
                                    </v-list-item-content>
                                    <v-list-item-action>
                                        <div v-if='!user.admin && $rooms.allowControls()'>
                                            <v-icon @click='ban(user.sid)'>mdi-close</v-icon>
                                        </div>
                                    </v-list-item-action>
                                </v-list-item>
                            </v-list>
                        </div>
    
                        <!-- Requested songs -->
                        <h3 class='text-center my-2'>Song requests:</h3>
                        <div>
                            <v-list dense class='overflow-y-auto' style='max-height: calc(50vh - 156px); height: calc(50vh - 156px);'>
                                <v-list-item dense v-for='track in $rooms.room.requests' :key='"req" + track.id'>
                                    <v-list-item-avatar>
                                        <v-img :src='track.albumArt.thumb'></v-img>
                                    </v-list-item-avatar>
                                    <v-list-item-content>
                                        <v-list-item-title>{{track.title}}</v-list-item-title>
                                        <v-list-item-subtitle>{{track.artistString}}</v-list-item-subtitle>
                                    </v-list-item-content>
                                    <v-list-item-action v-if='$rooms.allowControls()'>
                                        <div class='d-flex'>
                                            <v-btn icon @click='$rooms.removeRequest(track)'>
                                                <v-icon>mdi-close</v-icon>
                                            </v-btn>
                                            <v-btn icon @click='playRequestNext(track)'>
                                                <v-icon>mdi-playlist-play</v-icon>
                                            </v-btn>
                                            <v-btn icon @click='addRequestQueue(track)'>
                                                <v-icon>mdi-playlist-plus</v-icon>
                                            </v-btn>
                                        </div>
                                    </v-list-item-action>
                                </v-list-item>
                            </v-list>
                        </div>
                    </v-col>
                    <!-- Right side -->
                    <v-col cols='6' class='px-2'>
                        <div>
                            <v-list dense class='overflow-y-auto' style='max-height: calc(100vh - 270px); height: calc(100vh - 270px)' ref='chat'>
                                <v-list-item dense v-for='message in $rooms.chat.messages' :key='message.timestamp'>
                                    <v-list-item-avatar>
                                        <v-img :src='message.photo' width='32' contain></v-img>
                                    </v-list-item-avatar>
                                    <v-list-item-content>
                                        <!-- todo - red name on admin in chat ? -->
                                        <!-- <v-list-item-title v-if='user(message.user).admin' style='color: #F44336;'>{{user(message.user).username}}</v-list-item-title>
                                        <v-list-item-title v-if='!user(message.user).admin'>{{user(message.user).username}}</v-list-item-title> -->
                                        <v-list-item-title>{{ message.profile }}</v-list-item-title>
                                        <v-list-item-subtitle>{{message.content}}</v-list-item-subtitle>
                                    </v-list-item-content>
                                </v-list-item>
                            </v-list>
                        </div>
                        <!-- Send message -->
                        <v-text-field 
                            dense
                            hide-details
                            filled
                            maxlength='150'
                            class='mt-6'
                            label='Send message'
                            @keyup.enter='sendMessage'
                            v-model='message'
                            :disabled='disabledChat'
                            ref='chatField'
                        ></v-text-field>
                    </v-col>
                </v-row>
            </v-container>
        </div>
    
    
        <!-- Password dialog -->
        <v-dialog v-model='passwordDialog' width='400'>
            <v-card>
                <v-card-title>Club is password protected</v-card-title>
                <v-text-field 
                    class='my-1 mx-4' 
                    label='Password' 
                    v-model='joinPassword'
                    type="password"
                ></v-text-field>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn
                        color='primary'
                        class='my-2'
                        @click='joinWithPassword()'
                    >Join</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    
        <!-- Loading -->
        <v-overlay v-if='loading' class='text-center'>
            <v-progress-circular indeterminate></v-progress-circular>
            <br>
            <span class='text-h6'>Downloading queue...</span>
        </v-overlay>
    
        <!-- Create room dialog -->
        <v-dialog v-model='createDialog' width='400'>
            <v-card>
                <v-card-title>Create Club</v-card-title>
                <v-text-field class='mx-4 my-1' label='Name' v-model='roomName'>
                    <v-icon>mdi-label</v-icon>
                </v-text-field>
                <v-text-field class='mx-4 my-1' label='Password' v-model='roomPassword' type="password">
                    <v-icon>mdi-lock</v-icon>
                </v-text-field>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn 
                        color='primary' 
                        class='my-2' 
                        @click='createRoom'
                        :disabled='!roomName || roomName.length < 3 || !roomPassword || roomPassword.length < 3'
                        :loading='creatingRoom'
                        maxlength='32'
                    >Create</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    
        <TrackTile v-if='false'></TrackTile>
    
    </div>
    </template>
    
    <style>
    .leave-button {
        position: absolute;
        left: 48px;
        top: 32px;
    }
    </style>
    
    <script>
    // import md5 from 'md5';
    
    import TrackTile from '../components/TrackTile';
    
    export default {
        name: 'Rooms',
        components: {TrackTile},
        data() {
            return {
                rooms: null,
                loading: false,
    
                //Chat
                message: null,
                disabledChat: false,
    
                //Join room
                joinPassword: null,
                passwordDialog: false,
                joinRoomId: null,
    
                //Create dialog
                createDialog: false,
                roomName: null,
                roomPassword: null,
                creatingRoom: false
            }
        },
        methods: {
            //Load list of rooms
            async loadRooms() {
                let rooms = await this.$rooms.getRooms();
                rooms.sort((a, b) => b.users - a.users);
                this.rooms = rooms;
            },
            //Create new room
            async createRoom() {
                this.$root.pause();
    
                this.creatingRoom = true;
                //Generate queue
                let {id, password} = await this.$rooms.createRoom(this.roomName, this.roomPassword);
                this.creatingRoom = false;
                this.createDialog = false;
                //Join
                if (!password) {
                    await this.joinWithPassword(id, password);
                    return;
                }
                await this.joinWithPassword(id, password);
            },
            //Join to room
            async joinRoom(room) {
                //Check password
                if (room.password) {
                    this.joinRoomId = room.id;
                    this.joinPassword = null;
                    this.passwordDialog = true;
                    return;
                }
                //Join
                this.loading = true;
                await this.$rooms.joinRoom(room.id);
                this.loading = false;
            },
            //Join to room with password
            async joinWithPassword(id, password) {

                this.passwordDialog = false;
                this.loading = true;
                if (!id)
                    id = this.joinRoomId;
                if (!password)
                    password = this.joinPassword;
                await this.$rooms.joinRoom(id, password);
    
                this.joinPassword = null;
                this.loading = false;
            },
            //Send chat message
            sendMessage() {
                if (!this.message || this.message.length < 1) return;
                this.$rooms.sendMessage(this.message);
                this.message = null;
                //Rate limt
                this.disabledChat = true;
                setTimeout(() => {
                    this.disabledChat = false;
                    setTimeout(() => {
                        this.$refs.chatField.focus();
                    }, 50);
                }, 250);
            },
            //Get user by id
            user(id) {
                return this.$rooms.room.users.find(u => u.id == id);
            },
            //Ban user
            ban(user) {
                this.$rooms.ban(user);
            },
            //Play request
            async playRequestNext(track) {
                if (!this.$rooms.allowControls()) return;
                this.$rooms.removeRequest(track);
                await this.$rooms.addQueue(track, true);
            },
            async addRequestQueue(track) {
                if (!this.$rooms.allowControls()) return;
                this.$rooms.removeRequest(track);
                await this.$rooms.addQueue(track, false);
            },
            // dc from ws (crappy)
            leave() {
                this.$rooms.leave();
                window.location.reload();
            }
        },
        mounted() {
            this.loadRooms();
        },
        watch: {
            '$rooms.chat.messages'() {
                setTimeout(() => {
                    this.$refs.chat.$el.scrollBy(0, 1000);
                }, 50);
            }
        }
    }
    </script>