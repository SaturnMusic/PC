import Vue from 'vue';
import VueRouter from 'vue-router';

import Login from '@/views/Login.vue';
import HomeScreen from '@/views/HomeScreen.vue';
import Search from '@/views/Search.vue';
import Library from '@/views/Library.vue';
import AlbumPage from '@/views/AlbumPage.vue';
import PlaylistPage from '@/views/PlaylistPage.vue';
import ArtistPage from '@/views/ArtistPage.vue';
import Settings from '@/views/Settings.vue';
import DeezerPage from '@/views/DeezerPage.vue';
import DownloadsPage from '@/views/DownloadsPage.vue';
import About from '@/views/About.vue';

Vue.use(VueRouter);

const routes = [
    {
        path: '/home',
        component: HomeScreen
    },
    {
        path: '/login',
        component: Login
    },
    {
        path: '/search',
        component: Search,
        props: (route) => {
            return {query: route.query.q}
        }
    },
    {
        path: '/library',
        component: Library,
    },
    //Library short links
    {path: '/library/tracks', component: Library, props: () => {return {routeTab: 'tracks'}}},
    {path: '/library/albums', component: Library, props: () => {return {routeTab: 'albums'}}},
    {path: '/library/artists', component: Library, props: () => {return {routeTab: 'artists'}}},
    {path: '/library/playlists', component: Library, props: () => {return {routeTab: 'playlists'}}},
    {
        path: '/album',
        component: AlbumPage,
        props: (route) => {
            return {albumData: JSON.parse(route.query.album)}
        }
    },
    {
        path: '/playlist',
        component: PlaylistPage,
        props: (route) => {
            return {playlistData: JSON.parse(route.query.playlist)}
        }
    },
    {
        path: '/artist',
        component: ArtistPage,
        props: (route) => {
            return {artistData: JSON.parse(route.query.artist)}
        }
    },
    {
        path: '/settings',
        component: Settings
    },
    {
        path: '/page',
        component: DeezerPage,
        props: (route) => {
            return {target: route.query.target}
        }
    },
    {
        path: '/downloads',
        component: DownloadsPage,
    },
    {
        path: '/about',
        component: About
    },
];

const router = new VueRouter({
    mode: 'hash',
    base: process.env.BASE_URL,
    routes
});

export default router;
