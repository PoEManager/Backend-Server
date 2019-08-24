import errors from '../errors';
import ServerUtils from '../server-utils';
import MiddlewareFunction from './middleware-function';

/**
 * Generates a header validator middleware for the passed keys.
 *
 * @param keys The required keys.
 * @returns The middleware function.
 */
function makeHeaderValidator(keys: string[]): MiddlewareFunction {
    return (req, res, next) => {
        const missingKeys: string[] = [];

        for (const key in keys) {
            if (!req.header(key)) {
                missingKeys.push(key);
            }
        }

        if (missingKeys.length > 0) {
            ServerUtils.sendRESTError(res, new errors.InvalidHeaderFormatError(missingKeys));
        } else {
            next();
        }
    };
}

export = makeHeaderValidator;
