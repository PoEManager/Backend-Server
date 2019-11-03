import Error from '../core/error';
import DefaultLogin from './default-login';
import User from './user';
import UserManager from './user-manager';
import WalletRestrictions from './wallet-restrictions';

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
            super('USER_NOT_FOUND_ERROR', `User with ID '${id}' does not exist.`, 404, {
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
            super('DUPLICATE_EMAIL_ERROR', `An account with the E-Mail address ${email} already exists.`, 400, {
                email
            });
        }
    }

    /**
     * Thrown if a default login does not exist.
     *
     * The data layout is the following:
     * ```typescript
     * {
     *     id: "<the ID of the login that was not found>",
     * }
     * ```
     */
    export class DefaultLoginNotFoundError extends Error {
        constructor(id: DefaultLogin.ID) {
            super('DEFAULT_LOGIN_NOT_FOUND_ERROR', `Default Login with ID ${id} does not exist`, 404, {
                id
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
    export class LoginNotPresentError extends Error {
        public constructor(id: DefaultLogin.ID, type: LoginNotPresentError.LoginType) {
            super('LOGIN_NOT_FOUND_ERROR',
                `Login of type ${type} for the user with the ID '${id}' does not exist.`, 404, {
                id,
                type
            });
        }
    }

    /**
     * The types of logins that are supported by LoginNotFoundError.
     */
    export namespace LoginNotPresentError {
        /**
         * The identifiers of the different login types.
         */
        export enum LoginType {
            DEFAULT = 'DEFAULT',
            GOOGLE = 'GOOGLE'
        }
    }

    /**
     * Thrown if a default login does not exist.
     *
     * The data layout is the following:
     * ```typescript
     * {
     *     id: "<ID of the user that does not have the Default login>",
     *     type: "DEFAULT"
     * }
     * ```
     */
    export class DefaultLoginNotPresentError extends LoginNotPresentError {
        constructor(id: User.ID) {
            super(id, LoginNotPresentError.LoginType.DEFAULT);
        }
    }

    /**
     * Thrown if a Google login does not exist.
     *
     * The data layout is the following:
     * ```typescript
     * {
     *     id: "<ID of the user that does not have the Google login>",
     *     type: "GOOGLE"
     * }
     * ```
     */
    export class GoogleLoginNotPresentError extends LoginNotPresentError {
        constructor(id: User.ID) {
            super(id, LoginNotPresentError.LoginType.GOOGLE);
        }
    }

    /**
     * Thrown if a wallet restriction does not exist.
     *
     * The data layout is the following:
     * ```typescript
     * {
     *     id: "<the ID of the wallet restriction that was not found>",
     * }
     * ```
     */
    export class WalletRestrictionsNotFoundError extends Error {
        constructor(id: WalletRestrictions.ID) {
            super('WALLET_RESTRICTIONS_NOT_FOUND_ERROR', `Wallet Restriction with the ID ${id} does not exist`, 404, {
                id
            });
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
            super('INVALID_CHANGE_ID_ERROR', `Change ID ${id} is invalid.`, 404, {
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
            super('INVALID_NICKNAME_ERROR', `Nickname ${nickname} is invalid.`, 400, {
                nickname
            });
        }
    }

    /**
     * An E-Mail is in an invalid format.
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
            super('INVALID_EMAIL_ERROR', `Email ${email} is invalid.`, 400, {
                email
            });
        }
    }

    /**
     * A change is already in progress.
     *
     * The data layout is the following:
     * ```typescript
     * {
     *     id: "<the ID of the user>"
     * }
     * ```
     */
    export class ChangeAlreadyInProgressError extends Error {
        public constructor(id: User.ID) {
            super('CHANGE_ALREADY_IN_PROGRESS_ERROR',
                `Another change is already in progress for the user with the id='${id}'.`, 409, {
                id
            });
        }
    }

    /**
     * The user is already verified.
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
            super('USER_ALREADY_VERIFIED_ERROR', `The user with the id='${id}' is already verified.`, 400, {
                id
            });
        }
    }

    /**
     * The user is in an invalid state.
     *
     * The data layout is the following:
     * ```typescript
     * {
     *     is: "<current change>",
     *     expected: "<expected change>"
     * }
     * ```
     */
    export class InvalidChangeState extends Error {
        public constructor(is: User.ChangeType | null, expected: User.ChangeType) {
            super('INVALID_CHANGE_STATE', `The user is in an invalid change state.`, 400, {
                is,
                expected
            });
        }
    }

    /**
     * Passed credentials are invalid
     *
     * The data layout is the following:
     * ```typescript
     * {
     *
     * }
     * ```
     */
    export class InvalidCredentialsError extends Error {
        public constructor() {
            super('INVALID_CREDENTIALS_ERROR', `The credentials do not identify a user.`, 404, {});
        }
    }
}

export = errors;
