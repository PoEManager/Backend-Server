import Joi from '@hapi/joi';
import errors from '../errors';
import ServerUtils from '../server-utils';
import MiddlewareFunction from './middleware-function';

/**
 * Generates a query validator middleware for a particular schema.
 *
 * @param schema The required schema.
 * @returns The middleware function.
 */
function makeQueryValidator(schema: Joi.Schema): MiddlewareFunction {
    return async (req, res, next) => {
        try {
            req.locals.logger.info('Validating query parameters.');
            await Joi.validate(req.query, schema);
            req.locals.logger.info('Query validation successful.');
            next();
        } catch (error) {
            req.locals.logger.info('Query validation failed.');
            ServerUtils.sendRESTError(req, res, new errors.InvalidQueryFormatError(schema));
        }
    };
}

export = makeQueryValidator;
