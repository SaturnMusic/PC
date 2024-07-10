const winston = require('winston');
const path = require('path');
const {Settings} = require('./settings');
const { Transform } = require('stream');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.simple(),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({filename: path.join(Settings.getDir(), "saturn-server.log")}),
    ]
});

//Node errors
process.on('uncaughtException', (err) => {
    logger.error('Unhandled Exception: ' + err + "\nStack: " + err.stack);
});
process.on('unhandledRejection', (err) => {
    logger.error('Unhandled Rejection: ' + err + "\nStack: " + err.stack);
});

module.exports = logger;