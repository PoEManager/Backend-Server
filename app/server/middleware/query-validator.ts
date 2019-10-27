import JSONValidator from '../../core/json-validator';
import ServerUtils from '../server-utils';
import MiddlewareFunction from './middleware-function';

/**
 * Generates a query validator middleware for a particular schema.
 *
 * @param schema The required schema.
 * @returns The middleware function.
 */
function makeQueryValidator(schema: object): MiddlewareFunction {
    return async (req, res, next) => {
        try {
            req.locals.logger.info('Validating query parameters.');
            await JSONValidator.validate(req.query, schema);
            req.locals.logger.info('Query validation successful.');
            next();
        } catch (error) {
            req.locals.logger.info('Query validation failed.');
            ServerUtils.sendRESTError(req, res, error);
        }
    };
}

export = makeQueryValidator;
