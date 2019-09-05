import SessionTokenManager from '../../core/session-token-manager';
import errors from '../../model/errors';
import ServerUtils from '../server-utils';
import MiddlewareFunction from './middleware-function';

/**
 * Generates an ID for each request in order to track them.
 * Stores the ID in `req.locals.requestId`.
 *
 * @returns The middleware function.
 */
function makeRequestId(): MiddlewareFunction {
    let subCounter = 1000;

    return async (req, res, next) => {
        const milliseconds = new Date().getTime();

        req.locals.requestId = `${milliseconds}-${subCounter++}`;

        if (subCounter > 9999) {
            subCounter = 1000;
        }

        next();
    };
}

export = makeRequestId;
