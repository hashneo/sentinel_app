'use strict';

module.exports.getSystem = (req, res) => {
    global.module.getSystem()
        .then( (devices) => {
            res.status(200).json( { data: devices, result : 'ok'  } );
        })
        .catch( (err) => {
            res.status(err.code >= 400 && err.code <= 451 ? err.code : 500).json( { code: err.code || 0, message: err.message } );
        });
};

module.exports.getDevices = (req, res) => {
    global.module.getDevices()
        .then( (devices) => {
            res.status(200).json( { devices: devices, result : 'ok'  } );
        })
        .catch( (err) => {
            res.status(err.code >= 400 && err.code <= 451 ? err.code : 500).json( { code: err.code || 0, message: err.message } );
        });
};

module.exports.getDeviceStatus2 = (req, res) => {

    let result = {};

    global.module.getDevice(req.swagger.params.id.value)
        .then( (device) => {
            if (device === null)
                return Promise.reject({code:404, message:'not found'});
            result = device;
            return global.module.getDeviceStatus(req.swagger.params.id.value);
        })
        .then( (status) => {
            if ( status === null || status === undefined || status.length === 0 ){
                status = {};
            } else if ( status.length === 1 ){
                status = status[0];
            }

            result['state'] = { current: status };

            res.status(200).json( { data: result, result : 'ok' } );
        })
        .catch( (err) => {
            res.status(err.code >= 400 && err.code <= 451 ? err.code : 500).json( { code: err.code || 0, message: err.message } );
        });
};

module.exports.getDeviceStatus = (req, res) => {
    global.module.getDeviceStatus(req.swagger.params.id.value)
        .then( (status) => {
            res.status(200).json( { data: status, result : 'ok' } );
        })
        .catch( (err) => {
            res.status(err.code >= 400 && err.code <= 451 ? err.code : 500).json( { code: err.code || 0, message: err.message } );
        });
};

module.exports.deleteDevice = (req, res) => {
    global.module.deleteDevice(req.swagger.params.id.value)
        .then( (status) => {
            res.status(200).json( { data: status, result : 'ok' } );
        })
        .catch( (err) => {
            res.status(err.code >= 400 && err.code <= 451 ? err.code : 500).json( { code: err.code || 0, message: err.message } );
        });
};


module.exports.patchDevice = (req, res) => {

    let id = req.swagger.params.id.value;
    let data = req.swagger.params.data.value;

    let state = data.state;

    delete data.state;

    global.module.updateDevice(id, data)
        .then( (status) =>{
            return global.module.patchDevice(id, state);
        })
        .then( (status) => {
            res.status(200).json( { data: status, result : 'ok' } );
        })
        .catch( (err) => {
            res.status(err.code >= 400 && err.code <= 451 ? err.code : 500).json( { code: err.code || 0, message: err.message } );
        });
};

module.exports.hideDevice = (req, res) => {
    global.module.updateDevice(req.swagger.params.id.value, { visible: false } )
        .then( (status) => {
            res.status(200).json( { data: status, result : 'ok' } );
        })
        .catch( (err) => {
            res.status(err.code >= 400 && err.code <= 451 ? err.code : 500).json( { code: err.code || 0, message: err.message } );
        });
};

module.exports.showDevice = (req, res) => {
    global.module.updateDevice(req.swagger.params.id.value, { visible : true } )
        .then( (status) => {
            res.status(200).json( { data: status, result : 'ok' } );
        })
        .catch( (err) => {
            res.status(err.code >= 400 && err.code <= 451 ? err.code : 500).json( { code: err.code || 0, message: err.message } );
        });
};
