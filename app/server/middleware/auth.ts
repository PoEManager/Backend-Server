import SessionTokenManager from '../../core/session-token-manager';
import errors from '../../model/errors';
import ServerUtils from '../server-utils';
import MiddlewareFunction from './middleware-function';

/**
 * Generates a middleware that authenticates users.
 * Stores the authenticated user in `req.locals.user`.
 *
 * @returns The middleware function.
 */
function makeAuth(): MiddlewareFunction {
    return async (req, res, next) => {
        try {
            req.locals.logger.info('Authenticating user...');
            const token = req.header('x-auth-token');

            if (token) {
                req.locals.user = await SessionTokenManager.verify(token);
                req.locals.logger.info(`Authentication successful. Authenticated as user with ID ${req.locals.user.getId()}.`);
                next();
            } else {
                req.locals.logger.info('Authentication failed.');
                throw new errors.InvalidCredentialsError();
            }
        } catch (error) {
            ServerUtils.sendRESTError(req, res, error);
        }
    };
}

export = makeAuth;
