import Joi from '@hapi/joi';
import Error from '../core/Error';

namespace errors {
    /**
     * Thrown if a request is missing one ore more header keys.
     *
     * The data layout is the following:
     * ```typescript
     * {
     *     keys: [
     *         "<an array of missing keys>"
     *     ]
     * }
     * ```
     */
    export class InvalidHeaderFormatError extends Error {
        public constructor(keys: string[]) {
            super('INVALID_HEADER_FORMAT_ERROR',
                `The header misses the following keys: ${keys.join(', ')}`, 400, {
                keys
            });
        }
    }

    /**
     * Thrown if a request body is in an invalid format.
     *
     * The data layout is the following:
     * ```typescript
     * {
     *     schema: {
     *         <the expected schema>
     *     }
     * }
     * ```
     */
    export class InvalidBodyFormatError extends Error {
        public constructor(schema: Joi.Schema) {
            super('INVALID_BODY_FORMAT_ERROR',
                `The body is in an invalid format`, 400, {
                // todo
            });
        }
    }

    /**
     * Thrown if a request body is in an invalid format.
     *
     * The data layout is the following:
     * ```typescript
     * {
     *     schema: {
     *         <the expected schema>
     *     }
     * }
     * ```
     */
    export class InvalidQueryFormatError extends Error {
        public constructor(schema: Joi.Schema) {
            super('INVALID_QUERY_FORMAT_ERROR',
                `The query parameters are in an invalid format`, 400, {
                // todo
            });
        }
    }
}

export = errors;
