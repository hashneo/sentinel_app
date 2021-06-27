'use strict';

function Config(path) {

    if ( !(this instanceof Config) ){
        return new Config(path);
    }

    const consul = require('consul')( {
        host: process.env.CONSUL || '127.0.0.1',
        promisify: true
    });

    function addHelpers (d, k){

        d.save = () => {
            return new Promise((fulfill, reject) => {
                consul.kv.set(k, JSON.stringify(config, null, '\t'), (err, result) => {
                    if (err)
                        return reject(err);
                    fulfill(result);
                })
            });
        };

        return d;
    }

    this.get = (key) => {

        return new Promise((fulfill, reject) => {
            let p = path + (key || '');

            consul.kv.get(p, (err, result) => {
                if (err)
                    return reject(err);

                if (!result)
                    result = {Value: null};

                let _data = JSON.parse(result.Value);

                if (!_data)
                    _data = {};

                fulfill( addHelpers(_data, p) );
            });

        });
    }
}

module.exports = Config;

