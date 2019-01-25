'use strict';

module.exports.getSystem = (req, res) => {
    global.module.getDevices()
        .then( (devices) => {
            res.json( { data: devices, result : 'ok'  } );
        })
        .catch( (err) => {
            res.status(err.code >= 400 && err.code <= 451 ? err.code : 500).json( { code: err.code || 0, message: err.message } );
        });
};

module.exports.getStatus = (req, res) => {

};

module.exports.getDeviceStatus = (req, res) => {
    global.module.getDeviceStatus(req.swagger.params.id.value)
        .then( (status) => {
            res.json( { data: status, result : 'ok' } );
        })
        .catch( (err) => {
            res.status(err.code >= 400 && err.code <= 451 ? err.code : 500).json( { code: err.code || 0, message: err.message } );
        });
};

module.exports.deleteDevice = (req, res) => {
    global.module.deleteDevice(req.swagger.params.id.value)
        .then( (status) => {
            res.json( { data: status, result : 'ok' } );
        })
        .catch( (err) => {
            res.status(err.code >= 400 && err.code <= 451 ? err.code : 500).json( { code: err.code || 0, message: err.message } );
        });
};

module.exports.hideDevice = (req, res) => {
    global.module.updateDevice(req.swagger.params.id.value, { visible: false } )
        .then( (status) => {
            res.json( { data: status, result : 'ok' } );
        })
        .catch( (err) => {
            res.status(err.code >= 400 && err.code <= 451 ? err.code : 500).json( { code: err.code || 0, message: err.message } );
        });
};

module.exports.showDevice = (req, res) => {
    global.module.updateDevice(req.swagger.params.id.value, { visible : true } )
        .then( (status) => {
            res.json( { data: status, result : 'ok' } );
        })
        .catch( (err) => {
            res.status(err.code >= 400 && err.code <= 451 ? err.code : 500).json( { code: err.code || 0, message: err.message } );
        });
};
