import JSONValidator from '../../core/json-validator';
import ServerUtils from '../server-utils';
import MiddlewareFunction from './middleware-function';

/**
 * Generates a parameter validator middleware for a particular schema.
 *
 * @param schema The required schema.
 * @returns The middleware function.
 */
function makeHeaderValidator(schema: object): MiddlewareFunction {
    return async (req, res, next) => {
        try {
            req.locals.logger.info('Validating URL parameters.');
            await JSONValidator.validate(req.body, schema);
            req.locals.logger.info('URL parameter validation successful.');
            next();
        } catch (error) {
            req.locals.logger.info('URL parameter validation failed.');
            ServerUtils.sendRESTError(req, res, error);
        }
    };
}

export = makeHeaderValidator;
