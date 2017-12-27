'use strict';

const request = require('request');

const modules = require('../../modules');
const devices = require('../../devices');

module.exports.proxyCall = (req, res) => {

    let id = req.swagger.params.id.value;

    devices.find({id})
        .then( (devices) => {

            if (devices.length != 1)
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
/*
                let options = {
                    url: endpoint + rawUrl,
                    timeout: 90000
                };
*/
                http.get(endpoint + rawUrl, (resp) => {
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
                    return res.status(500).json( { code: 500, message: err.message } );
                });
/*

                request(options, (err, response, body) => {
                    if (err)
                        return res.status(500).json( { code: 500, message: err.message } );

                    if (response.statusCode == 200) {

                        const fs = require('fs');
                        const stream = fs.createWriteStream('/Users/staylor/test.jpg');
                        stream.write(body, () => {
                            stream.close();
                        })

                        res.type(response.headers['content-type']);
                        res.send(new Buffer(body, 'binary'));
                        res.status(200).end();
                    }else{
                        res.status(response.statusCode).json( { code: response.statusCode, message: '' } );
                    }
                });
*/
            } else {
                return res.status(500).json( { code: 500, message: 'No plugin found for device' } );
            }
        })
        .catch( (err) => {
            res.status(err.code >= 400 && err.code <= 451 ? err.code : 500).json( { code: err.code || 0, message: err.message } );
        });

};
