'use strict';

function messageHandler() {

    const redis = require('redis');

    const devices = require('./devices');
    const modules = require('./modules');
    const statusCache = require('./statusCache');
    const merge = require('deepmerge');

    const uuid = require('uuid');

    let pub = redis.createClient(
        {
            host: process.env.REDIS || global.config.redis || '127.0.0.1',
            socket_keepalive: true,
            retry_unfulfilled_commands: true
        }
    );

    let sub = redis.createClient(
        {
            host: process.env.REDIS || global.config.redis || '127.0.0.1',
            socket_keepalive: true,
            retry_unfulfilled_commands: true
        }
    );

    let ignoreUpdate = false;

    statusCache.on( 'set', function( key, value ){
        if ( !ignoreUpdate ) {
            delete value._ts;
            let data = JSON.stringify({module: 'server', id: key, value: value});
            console.log('sentinel.device.update => ' + data);
            pub.publish('sentinel.device.update', data);
        }
    });

    sub.on('end', function (e) {
        console.log('Redis hung up, committing suicide');
        process.exit(1);
    });

    sub.on('pmessage', function (channel, pattern, message) {

        let data = JSON.parse(message);

        // Ignore from me
        if ( data.name === 'server')
            return;

        switch (pattern) {
            case 'sentinel.module.start':
            case 'sentinel.module.running':
                let i = modules.find(data);

                if (!i) {
                    //global.config.modules.push(data);
                    modules.load(data, false)
                        .then(()=>{
                            module['active'] = true;
                            module['loaded'] = true;
                        })
                        .catch((err) =>{
                            if ( err === 404 )
                                module['active'] = true;
                            else {
                                console.log(err);
                                module['active'] = false;
                            }
                            module['loaded'] = false;
                        });
                } else {
                    i.address = data.address;
                    i.port = data.port;
                    i.endpoint = data.endpoint;
                    i.active = true;
                }
                break;

            case 'sentinel.device.insert':

                let device = data.value;

                device['plugin'] = {
                    id: data.id,
                    name: data.module
                };

                devices.insert( device );

                break;

            case 'sentinel.device.update':

                devices.find({ plugin : { name: data.module, id: data.id} } )
                    .then( (doc) => {
                        if (doc) {

                            doc = doc[0];

                            if ( doc ) {
                                let current = statusCache.get(doc.id);

                                if (current === undefined || current === null) {
                                    statusCache.set(doc.id, data.value);
                                } else {
                                    let status = merge(current, data.value);

                                    if (JSON.stringify(current) !== JSON.stringify(status)) {
                                        statusCache.set(doc.id, status);

                                        status['_ts'] = new Date().toISOString();

                                        ignoreUpdate = true;
                                        statusCache.set(doc.id, status);
                                        ignoreUpdate = false;
                                    }
                                }
                            }
                        }
                    })
                    .catch( (err) => {
                        console.trace(err);
                        process.exit(1);
                    });

                break;
        }
    });

    sub.psubscribe("sentinel.*");
}

module.exports = new messageHandler();