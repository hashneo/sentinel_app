"use strict";

const db = require('sentinel-common').db;

let c = null;

function getCollection(){

    return new Promise( (fulfill, reject) => {

        if ( c == null ) {
            db.createCollection('devices')
                .then((collection) => {

                    collection.createIndex( { "value.plugin.id" : 1, "value.plugin.name" : 1 } )
                        .then( () =>{
                            c = collection;
                            fulfill(c);
                        })
                        .catch ( (err) => {
                            reject(err);
                        })
                })
                .catch ( (err) => {
                    reject(err);
                })
        } else {
            fulfill(c);
        }
    });
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
                        if (err.code === 11000) {/*
                            collection.update(uuid, data)
                                .then(() => {
                                    fulfill(data);
                                })
                                .catch((err) => {
                                    reject(err);
                                });
                                */
                            reject(err);
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
