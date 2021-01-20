'use strict';

const request = require('request');

const modules = require('../../modules');
const devices = require('../../devices');

const logger = require('sentinel-common').logger;

module.exports.proxyCall = (req, res) => {

    let id = req.swagger.params.id.value;

    devices.find({id})
        .then( (devices) => {

            if (devices.length !== 1)
                return res.status(404).json({code: 404, message: 'not found'});

            let device = devices[0];

            let module = modules.find(device.plugin);

            if (module) {

                let rawUrl = req.url;

                rawUrl = rawUrl.replace( `/${id}/`, `/${device.plugin.id}/` );

                rawUrl = rawUrl.replace( `/api/`, `/` );

                let endpoint = module.endpoint;

                // either http or https
                const http = require( endpoint.split(':')[0] );

                logger.info(`calling => ${endpoint + rawUrl}`);

                let u = new URL(endpoint + rawUrl);

                const options = {
                    method: 'GET',
                    hostname: u.hostname,
                    port: u.port,
                    path: rawUrl
                };

                if ( req.headers['authorization'] )
                    options.headers['authorization'] = req.headers['authorization'];

                http.get(options, (resp) => {
                    let data = new Buffer(0);

                    resp.on('data', (chunk) => {
                        data = Buffer.concat([data, chunk]);
                    });

                    resp.on('end', () => {
                        res.type(resp.headers['content-type']);
                        res.send(new Buffer(data, 'binary'));
                        res.status(200).end();
                    });

                }).on('error', (err) => {

                    logger.error(`error in proxy call => ${err}`);

                    return res.status(500).json( { code: 500, message: err.message } );
                });

            } else {
                return res.status(500).json( { code: 500, message: 'No plugin found for device' } );
            }
        })
        .catch( (err) => {
            res.status(err.code >= 400 && err.code <= 451 ? err.code : 500).json( { code: err.code || 0, message: err.message } );
        });

};
