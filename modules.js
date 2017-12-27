'use strict';

function modules() {

    let modules = {};

    const devices = require('./devices');

    this.find = (module) => {
        if ( !module || !module.name )
            return null;

        return modules[module.name];
    };

    this.load = (module) => {

        return new Promise( (fulfill, reject) => {

            if (!module.active)
                return reject( new Error('module not active'));

            if (modules[module.name]) {
                modules[module.name]['deleted'] = true;
                delete modules[module.name];
            }

            modules[module.name] = module;

            module['kill'] = function () {
                clearInterval(this['timerId']);
            };

            devices.load(module)
                .then(()=>{
                    fulfill();
                })
                .catch((err)=>{
                    reject(err);
                })

        });
    }
}

exports = module.exports = new modules();