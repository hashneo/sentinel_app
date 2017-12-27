
var wsClients = [];

this.app.ws('/', function (ws, req) {
    ws['id'] = uuid.v4();
    wsClients.push(ws);

    ws.on('message', function (msg) {
        //console.log(msg);
    });
    ws.on('close', function () {
        var removeIndex = -1;
        for (var i in wsClients) {
            if (this.id === wsClients[i].id) {
                removeIndex = i;
                break;
            }
        }

        if (removeIndex != -1)
            wsClients.splice(removeIndex, 1);
    });
});


statusCache.on("set", function (key, value) {

    devices.findOne({id: key}, function (err, device) {

        if (device) {

            for (let i in wsClients) {
                wsClients[i].send(JSON.stringify({'device': device.id, 'status': value}));
            }

            //device['status'] = value;
            /*
             states.update({_id: device.id}, {_id: device.id, current: value}, {upsert:true}, function () {
             });
             */
            if (automation.devices[device.id] !== undefined) {

                statusCache.get(key, function (err, value) {
                    let _a = automation.devices[device.id];
                    try {
                        console.log('Device id => ' + device.id + ' "' + device.name + '", is triggering an event.');
                        automation.run(_a, value);
                    }
                    catch (e) {
                        console.log('automation id ' + _a.id + ' exception => ' + e.message);
                    }
                });

            }
        }

    });
});
