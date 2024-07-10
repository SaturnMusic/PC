import Vue from 'vue';
import Vuetify from 'vuetify/lib';

import 'roboto-fontface/css/roboto/roboto-fontface.css';
import '@mdi/font/css/materialdesignicons.css';

Vue.use(Vuetify);

export default new Vuetify({
    theme: {
        dark: true,
        options: {
            customProperties: true
        },
    }
});
