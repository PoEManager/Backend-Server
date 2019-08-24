import server from './server/server';

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
