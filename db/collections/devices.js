"use strict";

const db = require('sentinel-common').db;


function getCollection(){
    return db.createCollection('devices2');
}

module.exports.find = (uuid, criteria) => {

    return new Promise( function( fulfill, reject ){

        let id = null;

        if ( criteria && criteria.id ){
            id = criteria.id;
            delete criteria.id;
        }

        getCollection()
            .then( (collection) => {
                collection.find(uuid, id, criteria)
                    .then(function (docs) {
                        if (docs) {
                            fulfill(docs);
                        } else {
                            fulfill([]);
                        }
                    })
                    .catch(function (err) {
                        reject(err);
                    });
            })
            .catch(function (err) {
                reject(err);
            });
    });
};

module.exports.save = (uuid, data) => {

    return new Promise( (fulfill, reject) => {

        getCollection()
            .then( (collection) => {
                collection.insert(uuid, data)
                    .then(() => {
                        fulfill(data);
                    })
                    .catch((err) => {
                        if (err.code === 11000) {
                            collection.update(uuid, data)
                                .then(() => {
                                    fulfill(data);
                                })
                                .catch((err) => {
                                    reject(err);
                                });
                        } else {
                            reject(err);
                        }
                    });
            })
            .catch(function (err) {
                reject(err);
            });
    });
};

module.exports.update = (uuid, data) => {

    return new Promise( (fulfill, reject) => {

        getCollection()
            .then( (collection) => {
                collection.update(uuid, data)
                    .then(() => {
                        fulfill(data);
                    })
                    .catch((err) => {
                        reject(err);
                    });
            })
            .catch(function (err) {
                reject(err);
            });
    });
};

module.exports.delete = (uuid, data) => {

    return new Promise( (fulfill, reject) => {
        getCollection()
            .then( (collection) => {
                collection.delete(uuid, data)
                    .then(() => {
                        fulfill(data);
                    })
                    .catch((err) => {
                        reject(err);
                    });
            })
            .catch(function (err) {
                reject(err);
            });
    });
};
