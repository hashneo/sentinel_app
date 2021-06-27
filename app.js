'use strict';

require('newrelic');

const SwaggerExpress = require('swagger-express-mw');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');

const {logger, pubsub} = require('sentinel-common');

let moduleName = 'server';

let config = require('./config')(`config/sentinel/${moduleName}`);

global.app = app;

app.use(bodyParser.json({limit: '50mb'}));
app.use(cookieParser());

config.get()
    .then( ( data ) => {

        global.config = data;
        global.config.save();

        app.use(session({secret: 'sentinel', saveUninitialized: true, resave: true}));

        const securityHandlers = require('sentinel-common').securityHandlers;

        let appConfig = {
            appRoot: __dirname, // required config
            swaggerSecurityHandlers: {
                Oauth:  (req, authOrSecDef, scopesOrApiKey, cb) => {
                    securityHandlers.Oauth(req, authOrSecDef, scopesOrApiKey, cb);
                }
            }
        };

        SwaggerExpress.create(appConfig, function (err, swaggerExpress) {

            if (err) {
                throw err;
            }

            // install middleware
            swaggerExpress.register(app);

            app.use( function(req, res, next) {
                if ( req.jwt ){

                } else {
                    next();
                }
            });

            let port = process.env.PORT || undefined;
            let server = app.listen(port, () => {

                if (swaggerExpress.runner.swagger.paths['/health']) {
                    logger.info(`you can get /health on port ${port}`);
                }

                global.module = require(`./${moduleName}.js`)(config);

            });
        });
    })
    .catch((err) => {
        logger.error(err);
    });

process.on('unhandledRejection', (reason, p) => {
    logger.error(`Unhandled Rejection: ${reason.stack}`);
    process.exit(1);
});

module.exports = app;
