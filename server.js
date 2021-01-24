'use strict';
require('array.prototype.find');

function server(config) {

    if ( !(this instanceof server) ){
        return new server(config);
    }

    let that = this;

    const modules = require('./modules');
    const messageHandler = require('./messageHandler');

    const logger = require('sentinel-common').logger;

    const request = require('request');

    const statusCache = require('./statusCache');
    const intendedState = require('./intendedState');
    const devices = require('./devices');

    intendedState.on( 'set', function( key, value ){

    });

    this.getDeviceStatus = (id) => {

        return new Promise( ( fulfill, reject ) => {
            statusCache.get(id, (err, value) => {
                if (err)
                    return reject(err);

                if (!value) {
                    devices.find( { id } )
                        .then( (devices) => {
                            if (devices.length === 0)
                                return reject(new Error(404));
                            else
                                fulfill([]);
                        })
                        .catch( (err) => {
                            reject(err);
                        })
                } else {
                    delete value._ts;
                    fulfill([value]);
                }

            });
        });
    };

    this.deleteDevice = (id) => {

        return new Promise( ( fulfill, reject ) => {

            devices.delete( { id } )
                .then( () => {
                    fulfill([]);
                })
                .catch( (err) => {
                    reject(err);
                })
        });
    };

    this.patchDevice = (id, value) => {

        return new Promise((fulfill, reject) => {

            devices.find({ id })
                .then( (devices) => {

                    if ( devices.length !== 1 ){
                        return reject( { code: 404, message: `no device for id '${id}'` });
                    }

                    let device = devices[0];

                    let module = modules.find(device.plugin);

                    if (!module) {
                        return reject( { code: 500, message: 'No plugin found for device' });
                    }

                    let now = new Date().toISOString();

                    let url = `api/device/${device.plugin.id}`;

                    let endpoint = module.endpoint;

                    let options = {
                        url : `${endpoint}/${url}`,
                        method : 'PATCH',
                        encoding : null,
                        json: value,
                        headers : {
                            'accept' : 'application/json'
                        },
                        timeout : 90000,
                        followRedirect: false
                    };

                    logger.debug( options.url );

                    request(options, (err, response, body) => {

                        if (err || response.statusCode >= 500 ) {
                            // TODO: Check values exist in current model. reject if not.
                            intendedState.set(id, {inserted: now, value: value}, (err) => {
                                if (err)
                                    return reject(err);

                                return fulfill();
                            });
                        }

                        if ( response.statusCode >= 400 ){
                            return reject( { code: response.statusCode, message: '' } )
                        }

                        fulfill();
                    });
                })
                .catch( (err) =>{
                    reject(err);
                })
        });
    };

    this.updateDevice = (id, value) => {

        return new Promise( ( fulfill, reject ) => {

            devices.update( { id }, value )
                .then( () => {
                    fulfill([]);
                })
                .catch( (err) => {
                    reject(err);
                })
        });
    };

    this.getDevice = (id) => {

        return new Promise( ( fulfill, reject ) => {

            devices.find({ id })
                .then( (devices) => {
                    let d = [];

                    devices.forEach ( (device) =>  {

//                        delete device.plugin;
                        delete device.current;

                        let keys = Object.keys(device);

                        keys.forEach( (key) =>{
                            if ( key[0] === '_' )
                                delete device[key];
                        });

                        let current = statusCache.get(device.id);

                        if (current) {

                            if (current._ts) {
                                /*
                                let _ts = new Date(current._ts);
                                let diff = Math.floor((new Date() - _ts) / (1000 * 60 * 60 * 24));

                                device.active = (diff < 7);
                                */
                            }

                            if (device.active) {
                                delete device.active;
                                d.push(device);
                            }
                        }
                    });

                    if ( d.length === 1 ) {
                        fulfill(d[0]);
                    } else {
                        fulfill(null);
                    }
                })
                .catch( (err) =>{
                    reject(err);
                })
        });

    };

    this.getDevices = () => {

        return new Promise( ( fulfill, reject ) => {

            devices.find()
                .then( (devices) => {
                    let d = [];

                    devices.forEach ( (device) =>  {

                        //delete device.plugin;
                        delete device.current;

                        let keys = Object.keys(device);

                        keys.forEach( (key) =>{
                            if ( key[0] === '_' )
                                delete device[key];
                        });

                        let current = statusCache.get(device.id);

                        if (current) {

                            if (current._ts) {
                                /*
                                let _ts = new Date(current._ts);
                                let diff = Math.floor((new Date() - _ts) / (1000 * 60 * 60 * 24));

                                device.active = (diff < 7);
                                */
                            }

                            if (device.active) {
                                delete device.active;
                                d.push(device);
                            }
                        }
                    });

                    fulfill(d);
                })
                .catch( (err) =>{
                    reject(err);
                })
        });

    };

    this.getSystem = () => {

        return new Promise( ( fulfill, reject ) => {

            devices.find()
                .then( (devices) => {
                    let d = [];

                    devices.forEach ( (device) =>  {

                        delete device.plugin;
                        delete device.current;

                        let keys = Object.keys(device);

                        keys.forEach( (key) =>{
                            if ( key[0] === '_' )
                                delete device[key];
                        });

                        let current = statusCache.get(device.id);

                        if (current) {

                            if (current._ts) {
                                /*
                                let _ts = new Date(current._ts);
                                let diff = Math.floor((new Date() - _ts) / (1000 * 60 * 60 * 24));

                                device.active = (diff < 7);
                                */
                            }

                            if (device.active) {
                                delete device.active;
                                d.push(device);
                            }
                        }
                    });

                    fulfill({layout: global.config.layout, devices: d});
                })
                .catch( (err) =>{
                    reject(err);
                })
        });

    };


}

exports = module.exports = server;
