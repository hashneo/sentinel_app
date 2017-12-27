'use strict';

function devices(){

    let mysql = require( './mysql');
    let db;

    const devices = require('./db/collections/devices');
    const statusCache = require('./statusCache');

    const request = require('request');

    const uuid = require('uuid');

    const that = this;

    this.init = () => {
        return new Promise((fulfill, reject) => {

            if ( db !== undefined )
                return fulfill(this);

            mysql.connect(global.config.db)
                .then((connection) => {
                    console.log('connection established to database server');
                    return connection.createDatabase('sql/1.0.sql');
                })
                .then((connection) => {
                    console.log('database has been created');
                    return connection.useDatabase('sentinel');
                })
                .then((database) => {
                    console.log('now using the sentinel database');
                    db = database;
                    fulfill(this);
                })
                .catch((err) => {
                    reject(err);
                });

        });
    };

    function getLocationId(location){
        return new Promise( (fulfill, reject) =>{
            if (location === undefined){
                location = { name: 'default' }
            }

            db.query( 'select id from location where lower(name) = ?', [location.name.toLowerCase()])
                .then( (rows) =>{
                    if ( rows[0] === undefined ){
                        db.insert( 'location', {name:location.name} )
                            .then( (id) =>{
                                fulfill(id);
                            })
                            .catch( (err) =>{
                                reject(err);
                            });
                    } else {
                        fulfill(rows[0].id);
                    }
                })
                .catch( (err) =>{
                    reject(err);
                });
        });
    }

    this.add = (device) => {
        getLocationId(device.location);
    };
/*
    this.getDeviceStatus = ( nameOrId ) => {

        let result = undefined;

        devices.findOne({$or: [{id: nameOrId}, {_id: nameOrId}, {name: nameOrId}]}, function (err, doc) {
            if (doc == null)
                result = null;
            else {
                statusCache.get(doc.id, function (err, value) {
                    if (!err && result) {
                        result = value;
                    } else {
                        result = null;
                    }
                });
            }
        });

        require('deasync').loopWhile(function () {
            return result === undefined;
        });

        return result;
    };

    this.findDevice = (nameOrId) => {

        let result = undefined;

        devices.findOne({$or: [{id: nameOrId}, {_id: nameOrId}, {name: nameOrId}]}, function (err, doc) {
            if (doc == null)
                result = null;
            else
                result = doc;
        });

        require('deasync').loopWhile(function () {
            return result === undefined;
        });

        return result;
    };
*/
    this.findDeviceByType = (type) => {

        let results = undefined;

        devices.find({type: type}).toArray(function (err, docs) {
            if (docs == null || (docs.length == 0))
                results = null;
            else {
                let v = [];
                for( let i = 0 ; i < docs.length ; i++) {
                    if ( docs[i].active )
                        v.push( docs[i] );
                }
                if ( v.length > 0 )
                    results = v;
                else
                    results = null;
            }
        });

        require('deasync').loopWhile(function () {
            return results === undefined;
        });

        return results;
    };

    this.find = (criteria) => {

        return new Promise( ( fulfill, reject ) => {

            devices.find(null, criteria)

                .then( (docs) => {

                    if (docs == null || (docs.length == 0))
                        return fulfill([]);

                    let v = [];

                    for (let i = 0; i < docs.length; i++) {
                        if (docs[i].active)
                            v.push(docs[i]);
                    }

                    fulfill(v.length > 0 ? v : []);
                })
                .catch( (err) => {
                    reject(err);
                });
        });

    };

    this.insert = (data) => {

        if ( !data.plugin.name ){
            return;
        }

        function findOrInsert(device) {

            return new Promise( (fulfill, reject) => {

                devices.find( null, {$or : [ {id: device.id}, { plugin : device.plugin } ] } )

                    .then( (docs) => {

                        delete device.status;

                        if (!docs || docs.length == 0) {

                            delete device.id;
                            delete device.current;

                            devices.save(null, device )
                                .then( (doc) => {
                                    console.log('Inserted device => %s, id => %s, name => %s', doc.plugin.name + '.' + doc.plugin.id, doc.id, doc.name);
                                    fulfill(doc);
                                })
                                .catch( (err) => {
                                    reject(err);
                                });

                        } else {
                            let doc = docs.length ? docs[0] : docs;

                            delete doc.status;
                            delete doc.current;

                            doc.name = device.name;
                            doc.type = device.type;
                            doc.where = device.where;
                            doc.active = true;
                            doc.plugin = device.plugin;

                            devices.update(null, doc)
                                .then( (doc) => {
                                    console.log('Updated device => %s, id => %s, name => %s', doc.plugin.name + '.' + doc.plugin.id, doc.id, doc.name);
                                    fulfill(doc);
                                })
                                .catch( (err) => {
                                     reject(err);
                                });
                        }
                    })
                    .catch( (err) => {
                        reject(err);
                    });
            });
        }

        let d = data;

        if (!d['plugin'] && data.module ) {
            d['plugin'] = {'name': d.module, 'id': d.id};
            delete d.module;
            delete d.id;
        }

        if ( !d.id )
            d['id'] = uuid.v4();

        d['visible'] = true;
        d['active'] = true;

        findOrInsert(d)
            .then( (doc) => {

                const modules = require('./modules');

                let module = modules.find(doc.plugin);

                if (!module) {
                    return;
                }

                let options = {
                    url : module.endpoint + '/device/' + doc.plugin.id + '/status',
                    timeout : 90000
                };

                try {
                    request(options, (err, response, body) => {
                        if (!err && response.statusCode == 200) {
                            body = JSON.parse(body);

                            let data = body.data;

                            statusCache.set(doc.id, data.status);
                        }
                    });
                }catch(err){
                    console.error(err);
                    //reject(e);
                }


            })
            .catch( (err) =>{
                console.log(err);
            })

    };

    this.load = (module) => {

        return new Promise( ( fulfill, reject ) => {

            console.log('Loading devices for module => %s', module.name);

            let options = {
                url: module.endpoint + '/devices',
                timeout: 90000
            };

            request(options, (err, response, body) => {

                if (err)
                    return reject(err);

                if (response.statusCode == 200) {

                    let response = JSON.parse(body);

                    let data = response.data;

                    for (let i in data) {
                        let device = data[i];

                        device['plugin'] = {
                            id: device.id,
                            name: module.name
                        };

                        delete device.id;

                        that.insert(device);
                    }

                    fulfill();
                }else{
                    reject(response.statusCode);
                }
            });
        });
    }

}

exports = module.exports = new devices();