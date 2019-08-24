
import Error from '../core/Error';
import DefaultLogin from './DefaultLogin';
import User from './User';
import UserManager from './UserManager';

namespace errors {
    /**
     * Thrown if a user account does not exist.
     *
     * The data layout is the following:
     * ```typescript
     * {
     *     id: "<the ID of the user that was not found>"
     * }
     * ```
     */
    export class UserNotFoundError extends Error {
        public constructor(id: User.ID) {
            super('USER_NOT_FOUND_ERROR', `User with ID '${id}' does not exist.`, {
                id
            });
        }
    }

    /**
     * Thrown if a user account with the same E-Mail already exists.
     *
     * The data layout is the following:
     * ```typescript
     * {
     *     email: "<the E-Mail address of the user that already exists>"
     * }
     * ```
     */
    export class DuplicateEmailError extends Error {
        public constructor(email: string) {
            super('DUPLICATE_EMAIL_ERROR', `An account with the E-Mail address ${email} already exists.`, {
                email
            });
        }
    }

    /**
     * Thrown if a login method does not exist.
     *
     * The data layout is the following:
     * ```typescript
     * {
     *     id: "<the ID of the login that was not found>",
     *     type: "DEFAULT"
     * }
     * ```
     */
    export class LoginNotFoundError extends Error {
        public constructor(id: DefaultLogin.ID, type: LoginNotFoundError.LoginType) {
            super('LOGIN_NOT_FOUND_ERROR', `Login of type ${type} with ID '${id}' does not exist.`, {
                id,
                type
            });
        }
    }

    /**
     * The types of logins that are supported by LoginNotFoundError.
     */
    export namespace LoginNotFoundError {
        /**
         * The identifiers of the different login types.
         */
        export enum LoginType {
            DEFAULT = 'DEFAULT'
        }
    }

    /**
     * Thrown if a default login does not exist.
     *
     * The data layout is the following:
     * ```typescript
     * {
     *     id: "<the ID of the login that was not found>",
     *     type: "DEFAULT"
     * }
     * ```
     */
    export class DefaultLoginNotFoundError extends LoginNotFoundError {
        constructor(id: DefaultLogin.ID) {
            super(id, LoginNotFoundError.LoginType.DEFAULT);
        }
    }

    /**
     * Thrown if a change ID does not exist.
     *
     * The data layout is the following:
     * ```typescript
     * {
     *     id: "<the invalid change ID>"
     * }
     * ```
     */
    export class InvalidChangeIDError extends Error {
        public constructor(id: UserManager.ChangeID) {
            super('INVALID_CHANGE_ID_ERROR', `Change ID ${id} is invalid.`, {
                id
            });
        }
    }

    /**
     * Thrown if a nickname is invalid.
     *
     * The data layout is the following:
     * ```typescript
     * {
     *     nickname: "<the invalid nickname>"
     * }
     * ```
     */
    export class InvalidNicknameError extends Error {
        public constructor(nickname: string) {
            super('INVALID_NICKNAME_ERROR', `Nickname ${nickname} is invalid.`, {
                nickname
            });
        }
    }

    /**
     * Thrown if an E-Mail is invalid.
     *
     * The data layout is the following:
     * ```typescript
     * {
     *     email: "<the invalid E-Mail>"
     * }
     * ```
     */
    export class InvalidEmailError extends Error {
        public constructor(email: string) {
            super('INVALID_EMAIL_ERROR', `Nickname ${email} is invalid.`, {
                email
            });
        }
    }
}

export = errors;
