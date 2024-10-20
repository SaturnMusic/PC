module.exports = {
    transpileDependencies: [
        "vuetify"
    ],

    configureWebpack: config => {
        // Set the app title based on the environment
        config.plugins.push(
            new(require('webpack')).DefinePlugin({
                'process.env.APP_TITLE': JSON.stringify(
                    process.env.NODE_ENV === 'canary' ? 'Saturn Canary' : 'Saturn'
                ),
                'process.env.APP_FAVICON': JSON.stringify(
                    process.env.NODE_ENV === 'canary' ? 'favicon-canary.ico' : 'favicon.ico'
                )
            })
        );

        if (process.env.NODE_ENV === 'development') {
            config.devtool = 'source-map';
            config.optimization = {
                minimize: false
            };
        }
    },

    pluginOptions: {
        i18n: {
            locale: 'en',
            fallbackLocale: 'en',
            localeDir: 'locales',
            enableInSFC: true
        }
    }
};