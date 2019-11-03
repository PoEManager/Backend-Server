import express from 'express';
import fileUpload from 'express-fileupload';
import fs from 'fs';
import http from 'http';
import https from 'https';
import passport from 'passport';
import path from 'path';
import config from '../core/config';
import DatabaseConnection from '../core/database-connection';
import logger from '../core/logger';
import RootDirectory from '../core/root-directory';
import BasicAuthConfig from './authentication/basic';
import BearerAuthConfig from './authentication/bearer';
import GoogleAuthConfig from './authentication/google';
import UserSerializerSetup from './authentication/user-serializer';
import errors from './errors';
import requestLogger from './middleware/logger';
import requestId from './middleware/request-id';
import RouteLoader from './route-loader';
import ServerUtils from './server-utils';

namespace Server {
    let app: express.Express | null = null;
    let server: http.Server;

    function initAuthMethods() {
        logger.info('Setting authentication methods...');
        GoogleAuthConfig.run();
        BasicAuthConfig.run();
        BearerAuthConfig.run();
        UserSerializerSetup.run();
        logger.info('Done setting up authentication methods.');
    }

    function addMiddleWare() {
        logger.info('Setting up middleware...');
        app!.use(requestId());
        app!.use(requestLogger.setupRequestLogger());
        app!.use(requestLogger.logRequests());
        app!.use(express.json());
        app!.use(express.urlencoded({extended: false}));
        app!.use(fileUpload({limits: { fileSize: config.basic.avatarUploadMaxInKb * 1024 }}));
        app!.use(passport.initialize());
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

    function createServer(requestListener: http.RequestListener): http.Server | https.Server {
        if (!config.security.sslSettings.useSSL) {
            return http.createServer(requestListener);
        } else {
            const keyPath = path.resolve(RootDirectory.getSync(), config.security.sslSettings.keyFile);
            const certPath = path.resolve(RootDirectory.getSync(), config.security.sslSettings.certFile);

            if (!fs.existsSync(keyPath)) {
                throw new Error(`File ${keyPath} was not found.`);
            }

            if (!fs.existsSync(certPath)) {
                throw new Error(`File ${certPath} was not found.`);
            }

            const options = {
                key: fs.readFileSync(keyPath),
                cert: fs.readFileSync(certPath)
            };

            return https.createServer(options, requestListener);
        }
    }

    async function setupRouterAndRoutes() {
        const router = express.Router();

        // these two need to be in this order
        app!.use(`/${config.basic.basePath}`, router);
        setupErrorRoute();
        // ======

        await RouteLoader.addRoutes(router);
    }

    export function start() {
        logger.info('Starting server...');
        if (app !== null) {
            logger.warn('Server is already started.');
            return;
        }

        app = express();

        initAuthMethods();
        addMiddleWare();
        logMeta();
        setupRouterAndRoutes()
        .then(() => {
            try {
                server = createServer(app!);
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
            } catch (error) {
                logger.error('Unexpected error occurred while setting up the server.');
                logger.error(error.message);
                logger.error('The server has not been started.');
            }
        })
        .catch(e => {
            logger.error('Unexpected error occurred while setting up the routes.');
            logger.error(e.message);
            logger.error('The server has not been started.');
        });
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
