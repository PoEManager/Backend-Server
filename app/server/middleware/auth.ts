import passport from 'passport';
import errors from '../../model/errors';
import ServerUtils from '../server-utils';
import MiddlewareFunction from './middleware-function';

/**
 * Generates a middleware that authenticates users.
 * Stores the authenticated user in `req.user`.
 *
 * @returns The middleware function.
 */
function makeAuth(): MiddlewareFunction {
    return async (req, res, next) => {
        req.locals.logger.info('Authenticating user...');
        passport.authenticate('bearer', {session: false}, async (error, user) => {
            if (error || !user) {
                req.locals.logger.info('Authentication failed.');
                ServerUtils.sendRESTError(req, res, new errors.InvalidCredentialsError());
            } else {
                req.locals.logger.info(`Authentication successful. Authenticated as user with ID ${user.getId()}.`);
                req.logIn(user, err => {
                    if (err) {
                        req.locals.logger.info('Authentication failed.');
                        ServerUtils.sendRESTError(req, res, err);
                    } else {
                        next();
                    }
                });
            }
        })(req, res);
    };
}

export = makeAuth;
