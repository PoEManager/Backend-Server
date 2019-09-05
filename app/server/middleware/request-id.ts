import winston from 'winston';
import SessionTokenManager from '../../core/session-token-manager';
import errors from '../../model/errors';
import User from '../../model/user';
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

        req.locals = {
            logger: undefined as unknown as winston.Logger,
            requestId: '',
            startTime: undefined as unknown as Date,
            user: undefined as unknown as User
        };

        req.locals.requestId = `${milliseconds}-${subCounter++}`;

        if (subCounter > 9999) {
            subCounter = 1000;
        }

        next();
    };
}

export = makeRequestId;
