import LoggerCreator from '../../core/logger-creator';
import MiddlewareFunction from './middleware-function';

/**
 * Sets up a logger for the route in `req.locals.logger`.
 *
 * @returns The middleware function.
 */
function setupRequestLogger(): MiddlewareFunction {
    return async (req, res, next) => {
        req.locals.logger = LoggerCreator.newLogger(req.locals.requestId);
        next();
    };
}

/**
 * Generates a middleware that logs incoming requests.
 * Stores the authenticated user in `req.user`.
 *
 * @returns The middleware function.
 */
function logRequests(): MiddlewareFunction {
    return async (req, res, next) => {
        const ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
        req.locals.startTime = new Date();
        req.locals.logger.info(`Incoming request ${req.method} ${req.path} from ${ip}.`);

        res.on('finish', () => {
            const duration = new Date().getTime() - req.locals.startTime.getTime();
            req.locals.logger.info(`Request is done. Returned status code ${res.statusCode}. Took ${duration} ms.`);
        });
        next();
    };
}

export = {
    setupRequestLogger,
    logRequests
};
