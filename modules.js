'use strict';

const {logger} = require('sentinel-common');

function Modules() {

    let modules = {};

    const k8s = require('./kubernetes');
    const devices = require('./devices');

    const that = this;

    this.find = (module) => {
        if (!module || !module.name)
            return null;

        return modules[module.name];
    };

    function load(module) {

        return new Promise((fulfill, reject) => {

            if (!module.active)
                return reject(new Error('module not active'));

            if (modules[module.name]) {
                modules[module.name]['deleted'] = true;
                delete modules[module.name];
            }

            modules[module.name] = module;

            module['kill'] = () => {
                clearInterval(this['timerId']);
            };

            devices.load(module)
                .then(() => {
                    fulfill();
                })
                .catch((err) => {
                    reject(err);
                })

        });
    }

    function loadModules() {

        return new Promise( async (fulfill, reject) => {

            try {
                let services = await k8s.getServices('sentinel', 'home-sentinel.ai/type=module');

                for (const   service of services) {

                    let moduleName = await service.metadata.labels['home-sentinel.ai/name'];

                    logger.info(`found service '${service.metadata.name}' matching labels, module name => ${moduleName}`);

                    if (moduleName) {

                        let module = {
                            name: moduleName,
                            active: true,
                            endpoint: `http://${service.metadata.name}.${service.metadata.namespace}:${service.spec.ports[0].port}`
                        };

                        if (process.env.DEBUG) {
                            if (service.spec.type === 'LoadBalancer') {
                                module.endpoint = `http://${service.status.loadBalancer.ingress[0].ip}:${service.spec.ports[0].port}`
                            } else {
                                module.active = false;
                            }
                        }

                        let endPointSlices = await k8s.getEndPointSlices(service.metadata.namespace, service.metadata.name);

                        if (endPointSlices[0].endpoints === null) {
                            logger.info(`service '${service.metadata.name}' does not have any endpoints available, module will be deactivated`);
                            module.active = false;
                        }

                        logger.debug(`module info => ${JSON.stringify(module, null, '\t')}`);

                        if (module.active) {
                            if (!that.find(module)) {
                                await load(module);
                                logger.info(`loaded module ${module.name} at endpoint ${module.endpoint}`);
                            }
                        }
                    }

                    fulfill();
                }
            }catch (err) {
                logger.error(err);
                reject(err);
            }
        });

    }

    loadModules()

        .then(() => {

            function pollKubernetes() {
                loadModules()
                    .then(() => {
                        setTimeout(pollKubernetes, 10000);
                    })
                    .catch((err) => {
                        logger.error(err);
                        setTimeout(pollKubernetes, 60000);
                    });

            }

            setTimeout(pollKubernetes, 10000);

        })
        .catch((err) => {
            logger.error(err);
            process.exit(1);
        });

}

exports = module.exports = new Modules();
