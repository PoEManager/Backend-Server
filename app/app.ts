import server from './server/server';


function main() {
server.start();

async function handler() {
    try {
        await server.stop();
    } finally {
        process.exit();
    }
}

process.on('SIGINT', handler);
process.on('SIGTERM', handler);
}

main();
