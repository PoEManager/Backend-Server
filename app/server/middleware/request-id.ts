import winston from 'winston';
import User from '../../model/user';
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

        req.user = undefined as unknown as User;
        req.locals = {
            logger: undefined as unknown as winston.Logger,
            requestId: '',
            startTime: undefined as unknown as Date
        };

        req.locals.requestId = `${milliseconds}-${subCounter++}`;

        if (subCounter > 9999) {
            subCounter = 1000;
        }

        next();
    };
}

export = makeRequestId;
