require('dotenv/config');
const { v4: uuid } = require('uuid');
const AmiClient = require('asterisk-ami-client');
const PORT = process.env.ASTERISK_MANAGER_PORT;
const USER = process.env.ASTERISK_MANAGER_USER;
const PASS = process.env.ASTERISK_MANAGER_PASS;
const HOST = process.env.ASTERISK_MANAGER_HOST;
let localClient = new AmiClient({
    reconnect: true,
    keepAlive: true
});

const startup = () => {
    // Connect to the manager websocket
    localClient.connect(USER, PASS, { host: HOST, port: PORT })
        .then(() => {
            // Setup actions for all events and execute a simple ping action
            localClient
                .on('connect', () => console.log(`Connected to ${HOST}:${PORT}`))
                .on('event', async (event) => await newAmiEvent(event))
                .on('response', response => parseResponse(response, HOST))
                .on('disconnect', () => console.log(`Disconnected from ${HOST}:${PORT}`))
                .on('reconnection', () => console.log(`Reconnecting to ${HOST}:${PORT}`))
                .on('internalError', error => {
                    console.log(`Internal error on ${HOST}: ${error}`);
                })
                .action({
                    Action: 'Ping'
                });

            // Execute action to retrieve the current channels
            localClient.action({
                Action: 'CoreShowChannels',
                ActionID: uuid(),
            });
        })
        .catch(err => {
            console.log(err);
            process.exit(1);
        });
}


startup();

async function newAmiEvent(event) {
    if (/^CoreShowChannel/.test(event.Event))
        console.log("\nNew event: ", event);
}

function parseResponse(response, host) {
    console.log(`Got response from ${host}: ${JSON.stringify(response)}`);
}
