import Error from '../core/error';
import User from '../model/user';

namespace errors {
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
