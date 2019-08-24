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
            await Joi.validate(req.body, schema);
            next();
        } catch (error) {
            ServerUtils.sendRESTError(res, new errors.InvalidBodyFormatError(schema));
        }
    };
}

export = makeBodyValidator;
