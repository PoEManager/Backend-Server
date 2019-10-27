import Ajv from 'ajv';
import _ from 'lodash';
import errors from './errors';

namespace JSONValidator {
    export async function validate(o: any, schema: object) {
        const ajv = new Ajv();
        const validationFunction = ajv.compile(schema);
        const valid = validationFunction(o);

        if (!valid) {
            throw new errors.ObjectValidationError(ajv);
        }
    }
}

export = JSONValidator;
