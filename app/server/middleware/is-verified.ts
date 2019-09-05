import errors from '../errors';
import ServerUtils from '../server-utils';
import MiddlewareFunction from './middleware-function';

/**
 * Generates a middleware that checks if a user is authenticated.
 *
 * @returns The middleware function.
 */
function makeAuth(): MiddlewareFunction {
    return async (req, res, next) => {
        try {
            req.locals.logger.info(`Making sure user with ID ${req.locals.user.getId()} is verified...`);

            if (await req.locals.user.isVerified()) {
                req.locals.logger.info('User is verified.');
                next();
            } else {
                req.locals.logger.info('User is not verified.');
                throw new errors.NotVerifiedError(req.locals.user.getId());
            }
        } catch (error) {
            req.locals.logger.info('User is not verified.');
            ServerUtils.sendRESTError(req, res, error);
        }
    };
}

export = makeAuth;
