'use strict';
require('array.prototype.find');

function server(config) {

    if ( !(this instanceof server) ){
        return new server(config);
    }

    let that = this;

    const modules = require('./modules');
    const messageHandler = require('./messageHandler');

    const statusCache = require('./statusCache');
    const devices = require('./devices');

    this.getDeviceStatus = (id) => {

        return new Promise( ( fulfill, reject ) => {
            statusCache.get(id, (err, value) => {
                if (err)
                    return reject(err);

                if (!value) {
                    devices.find( { id } )
                        .then( (devices) => {
                            if (devices.length == 0)
                                return reject(new Error(404));
                            else
                                fulfill([]);
                        })
                        .catch( (err) => {
                            reject(err);
                        })
                } else {
                    fulfill([value]);
                }

            });
        });
    };

    this.getDevices = () => {

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

                        if (device.active) {
                            delete device.active;
                            d.push(device);
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
