import express from 'express';
import http from 'http';
import morgan from 'morgan';
import config from '../core/config';
import DatabaseConnection from '../core/database-connection';
import logger from '../core/logger';
import requestLogger from './middleware/logger';
import requestId from './middleware/request-id';
import RouteLoader from './route-loader';

namespace Server {
    let app: express.Express | null = null;
    let server: http.Server;

    function addMiddleWare() {
        logger.info('Setting up middleware...');
        app!.use(requestId());
        app!.use(requestLogger.setupRequestLogger());
        app!.use(requestLogger.logRequests());
        app!.use(express.json());
        app!.use(express.urlencoded({extended: false}));
        logger.info('Done setting up middleware.');
    }

    function logMeta() {
        const dbConfig = DatabaseConnection.getPublicConfiguration();

        logger.info(`Using database ${dbConfig.user}@${dbConfig.host}:${dbConfig.port}/${dbConfig.database}.`);
    }

    function setupRouterAndRoutes() {
        const router = express.Router();
        app!.use(`/${config.basic.basePath}`, router);

        RouteLoader.addRoutes(router)
        .then(() => {
            server = http.createServer(app!);
            server.listen(config.basic.port);

            server.on('close', () => {
                logger.info('Server is closing down.');
            });

            server.on('error', error => {
                logger.error(`Error in server: ${error.message}`);
            });

            server.on('listening', () => {
                logger.info('Server is now listening.');
            });
        })
        .catch(e => {
            console.log('ERROR');
            console.log(e);
        });
    }

    export function start() {
        logger.info('Starting server...');
        if (app !== null) {
            logger.warn('Server is already started.');
            return;
        }

        app = express();

        addMiddleWare();
        logMeta();
        setupRouterAndRoutes();
    }

    export async function stop(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!app) {
                logger.warn('Server is not running.');
                reject('Server is not running');
                return;
            }

            server.close(err => {
                app = null;
                if (err) {
                    reject(new Error(`Server could not be stopped gracefully: ${err}`));
                } else {
                    resolve();
                }
            });
        });
    }
}

export = Server;
