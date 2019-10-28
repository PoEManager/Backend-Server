import express from 'express';
import fileUpload from 'express-fileupload';
import http from 'http';
import config from '../core/config';
import DatabaseConnection from '../core/database-connection';
import logger from '../core/logger';
import errors from './errors';
import requestLogger from './middleware/logger';
import requestId from './middleware/request-id';
import RouteLoader from './route-loader';
import ServerUtils from './server-utils';

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
        app!.use(fileUpload({limits: { fileSize: config.basic.avatarUploadMaxInKb * 1024 }}));
        logger.info('Done setting up middleware.');
    }

    function logMeta() {
        const dbConfig = DatabaseConnection.getPublicConfiguration();

        logger.info(`Using database ${dbConfig.user}@${dbConfig.host}:${dbConfig.port}/${dbConfig.database}.`);
    }

    function setupErrorRoute() {
        app!.use((req, res, next) => {
            ServerUtils.sendRESTError(req, res, new errors.InvalidRouteError(req.method, req.path));
        });
    }

    function setupRouterAndRoutes() {
        const router = express.Router();

        // these two need to be in this order
        app!.use(`/${config.basic.basePath}`, router);
        setupErrorRoute();
        // ======

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
            logger.error('Unexpected error occurred while setting up the routes.');
            logger.error(e.message);
            logger.error('The server has not been started.');
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
