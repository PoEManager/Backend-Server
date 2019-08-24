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
            await Joi.validate(req.query, schema);
            next();
        } catch (error) {
            ServerUtils.sendRESTError(res, new errors.InvalidQueryFormatError(schema));
        }
    };
}

export = makeQueryValidator;
