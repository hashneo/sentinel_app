'use strict';

const {logger} = require('sentinel-common');

function Kubernetes() {

    const k8s = require('@kubernetes/client-node');

    function makeApiClient(apiClientType) {

        return new Promise( (fulfill, reject) => {

            const kubeConfig = new k8s.KubeConfig();

            if (process.env.KUBERNETES_SERVICE_HOST) {
                kubeConfig.loadFromCluster();
            } else {
                let homeDir = require('os').homedir();
                kubeConfig.loadFromFile(homeDir + '/.kube/config');
            }

            logger.info('loaded Kubernetes api spec from swagger');
            let _client = kubeConfig.makeApiClient(apiClientType);

            if ( !_client ) {
                return reject('unable to load Kubernetes api');
            }

            fulfill(_client);
        });

    }


    function getCoreV1Api() {
        return makeApiClient(k8s.CoreV1Api);
    }

    function getDiscoveryV1Api() {
        return makeApiClient(k8s.DiscoveryV1Api);
    }



    this.getServices = (namespace, labelSelector) => {
        return new Promise( (fulfill, reject) => {
            getCoreV1Api()
                .then( (client) => {
                    return client.listNamespacedService(namespace, null, null, null, null, labelSelector);
                })
                .then((response) => {
                    fulfill(response.body.items);
                })
                .catch( (err) =>{
                    reject(err);
                });
        });
    };

    this.getEndPointSlices =(namespace, serviceName) => {
        return new Promise( (fulfill, reject) => {
            return getDiscoveryV1Api()
                .then((client)=>{
                    return client.listNamespacedEndpointSlice(namespace, null, null, null, null, `kubernetes.io/service-name=${serviceName}`);
                })
                .then((response) => {
                    fulfill(response.body.items);
                })
                .catch((err) => {
                    reject(err);
                });
        });
    }
/*
    this.addPort = ( (name, targetPort) => {
        return patchService( 'add', name, targetPort );
    });

    this.delPort = ( (name) => {
        return patchService( 'del', name, null );
    });
*/

/*
    function patchService ( op, name, targetPort ){
        return new Promise( (fulfill, reject) => {
            getClient()
                .then((client) => {

                    logger.info(`looking for service ${process.env.KUBERNETES_SERVICE} in namespace ${process.env.NAMESPACE || 'default'}`);

                    client.apis.v1.namespace(process.env.NAMESPACE || 'default').service(process.env.KUBERNETES_SERVICE).get()
                        .then((response) => {

                            if (response.statusCode === 200) {

                                logger.info( 'kubernetes responded with a service definition');

                                let service = response.body;

                                let newPorts = [];

                                service.spec.ports.forEach( (port) =>{
                                    if (port.name !== name)
                                        newPorts.push(port);
                                });

                                if ( op === 'add' ) {
                                    newPorts.push(
                                        {
                                            name: name,
                                            protocol: 'TCP',
                                            port: targetPort,
                                            targetPort: targetPort
                                        }
                                    );
                                }

                                logger.info( `adding target port ${targetPort} to service`);

                                delete service.metadata.creationTimestamp;
                                delete service.status;

                                service.spec.ports = newPorts;

                                logger.info( `patching service on kubernetes`);

                                return client.apis.v1.namespace(process.env.NAMESPACE || 'default').service(process.env.KUBERNETES_SERVICE).put({body: service});

                            } else {
                                logger.info( `get service failed, kubernetes responded with status code => ${response.statusCode}`);
                                reject(response.body);
                            }
                        })
                        .then((response) => {
                            if ( response.statusCode === 200 ){
                                logger.info( `service patched`);
                                fulfill()
                            } else {
                                logger.info( `patching failed, kubernetes responded with status code => ${response.statusCode}`);
                                reject(response.body);
                            }
                        })
                        .catch((err) => {
                            logger.error(err);
                        });

                })
                .catch( (err) =>{
                    reject(err);
                })
        });
    }
 */


}

module.exports = new Kubernetes();
