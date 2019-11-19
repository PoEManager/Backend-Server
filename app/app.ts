import server from './server/server';

function doneCb() {
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

function main() {
    server.start({ doneCb });
}

main();
