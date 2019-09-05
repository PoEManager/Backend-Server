import Joi from '@hapi/joi';
import errors from '../errors';
import ServerUtils from '../server-utils';
import MiddlewareFunction from './middleware-function';

/**
 * Generates a body validator middleware for a particular schema.
 *
 * @param schema The required schema.
 * @returns The middleware function.
 */
function makeBodyValidator(schema: Joi.Schema): MiddlewareFunction {
    return async (req, res, next) => {
        try {
            req.locals.logger.info('Validating body.');
            await Joi.validate(req.body, schema);
            req.locals.logger.info('Body validation successful.');
            next();
        } catch (error) {
            req.locals.logger.info('Body validation failed.');
            ServerUtils.sendRESTError(req, res, new errors.InvalidBodyFormatError(schema));
        }
    };
}

export = makeBodyValidator;
