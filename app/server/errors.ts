import Joi from '@hapi/joi';
import Error from '../core/error';
import User from '../model/user';

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

    /**
     * Thrown if a verified user accesses GET /user/verification
     *
     * The data layout is the following:
     * ```typescript
     * {
     *     id: "<the ID of the user>"
     * }
     * ```
     */
    export class UserAlreadyVerifiedError extends Error {
        public constructor(id: User.ID) {
            super('USER_ALREADY_VERIFIED_ERROR', `The user with the ID '${id}' is already verified.`, 400, {
                id
            });
        }
    }

    /**
     * Thrown if an unverified user attempts to access a route that requires verification.
     *
     * The data layout is the following:
     * ```typescript
     * {
     *     id: "<the ID of the user>"
     * }
     * ```
     */
    export class NotVerifiedError extends Error {
        public constructor(id: User.ID) {
            super('NOT_VERIFIED_ERROR', `The user with the ID '${id}' is not verified.`, 403, {
                id
            });
        }
    }

    /**
     * Thrown if an URL parameter (not to be confused with an URL query) is invalid.
     *
     * The data layout is the following:
     * ```typescript
     * {
     *     param: "<the invalid parameter>"
     * }
     * ```
     */
    export class InvalidParamError extends Error {
        public constructor(param: string) {
            super('INVALID_PARAM_ERROR', `The URL parameter ${param}.`, 400, {
                param
            });
        }
    }
}

export = errors;
