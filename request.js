'use strict';

var rp = require('request-promise');

function Request() {

    this.get = (path) => {
        return this.call(path, 'get');
    };

    this.call = (url, method, data) => {

        return new Promise( (fulfill, reject) => {

            let options = {
                uri: url,
                timeout: 30000,
                resolveWithFullResponse: true
            };

            console.log('calling url => ' + url);

            rp(options)
                .then ( (response) => {

                    if (response.statusCode == 200) {
                        if (response.headers['content-type'].toLowerCase().indexOf('/json') != -1) {
                            var result = JSON.parse(response.body).data;
                            fulfill(result);
                        } else {
                            fulfill({type: response.headers['content-type'], data: response.body});
                        }
                    } else {
                        reject('');
                    }
                })
                .catch( (err) => {
                    reject(err);
                })
        });
    }
}

module.exports = new Request();