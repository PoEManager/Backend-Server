import DatabaseConnection from '../core/DatabaseConnection';
import errors from './Errors';
import Password from './Password';
import UserManager from './UserManager';

/**
 * The representation of a single user login.
 *
 * In order to get such a reference, see UserManager.getDefaultLogin() or User.getDefaultLogin().
 */
class DefaultLogin {
    /**
     * The ID of the login.
     */
    private readonly id: number;

    /**
     * Constructs a new instance. Should not be used directly, use UserManager.getDefaultLogin() instead.
     *
     * @param id The ID of the login.
     */
    public constructor(id: DefaultLogin.ID) {
        this.id = id;
    }

    /**
     * @returns The ID of the login.
     */
    public getId(): DefaultLogin.ID {
        return this.id;
    }

    /**
     * @returns The E-Mail that the login has.
     *
     * @throws **DefaultLoginNotFoundError** If the default login does not exist.
     */
    public async getEmail(): Promise<string> {
        const result = await DatabaseConnection.query(
            'SELECT `email` FROM `DefaultLogins` WHERE `DefaultLogins`.`defaultlogin_id` = ?', {
                parameters: [
                    this.id
                ]
            });

        if (result.length === 1) {
            return result[0].email;
        } else {
            throw this.makeLoginNotFoundError();
        }
    }

    /**
     * Updates the E-Mail of the login.
     *
     * This method only initiates the change of the E-Mail. The actual change has to be confirmed with
     * UserManager.validateChange().
     *
     * @param email The new E-Mail.
     */
    public updateEMail(email: string): UserManager.ChangeID {
        return '';
    }

    /**
     * @returns The encrypted password of the user.
     *
     * @throws **DefaultLoginNotFoundError** If the default login does not exist.
     */
    public async getPassword(): Promise<Password> {
        const result = await DatabaseConnection.query(
            'SELECT `password` FROM `DefaultLogins` WHERE `DefaultLogins`.`defaultlogin_id` = ?', {
                parameters: [
                    this.id
                ]
            });

        if (result.length === 1) {
            return new Password(result[0].password);
        } else {
            throw this.makeLoginNotFoundError();
        }
    }

    /**
     * Updates the password of the login.
     *
     * This method only initiates the change of the password. The actual change has to be confirmed with
     * UserManager.validateChange().
     *
     * @param password The new password.
     */
    public updatePassword(password: Password): UserManager.ChangeID {
        return '';
    }

    /**
     * @returns The new E-Mail, if a change is in progress, or ```null``` if there is no change.
     */
    public async getNewEmail(): Promise<string | null> {
        const result = await DatabaseConnection.query(
            'SELECT `new_email` FROM `DefaultLogins` WHERE `DefaultLogins`.`defaultlogin_id` = ?', {
                parameters: [
                    this.id
                ]
            });

        if (result.length === 1) {
            return result[0].new_email;
        } else {
            throw this.makeLoginNotFoundError();
        }
    }

    /**
     * @returns The new password, if a change is in progress, or ```null``` if there is no change.
     */
    public async getNewPassword(): Promise<Password | null> {
        const result = await DatabaseConnection.query(
            'SELECT `new_password` FROM `DefaultLogins` WHERE `DefaultLogins`.`defaultlogin_id` = ?', {
                parameters: [
                    this.id
                ]
            });

        if (result.length === 1) {
            return new Password(result[0].new_password);
        } else {
            throw this.makeLoginNotFoundError();
        }
    }

    /**
     * Query data about the login. This method unites all of the other getters (such as getEmail() and getPassword())
     * into one. This can improve the performance, because it reduces the amount of SQL calls to the database.
     *
     * @param queryData A list of the data that should be queried.
     * @returns The queried data.
     */
    public query(queryData: DefaultLogin.DefaultLoginQueryData): DefaultLogin.IDefaultLoginQueryResult {
        return {};
    }

    /**
     * @returns A DefaultLoginNotFoundError with the proper user ID.
     */
    private makeLoginNotFoundError(): errors.DefaultLoginNotFoundError {
        return new errors.DefaultLoginNotFoundError(this.id);
    }
}

namespace DefaultLogin {
    /**
     * The type of a login ID.
     */
    export type ID = number;

    /**
     * The data that can be queried by DefaultLogin.query().
     */
    export enum DefaultLoginQueryData {
        /**
         * Query the ID of the login. Equivalent to User.getId().
         */
        ID,
        /**
         * Query the E-Mail of the login. Equivalent to User.getEmail().
         */
        EMAIL,
        /**
         * Query the password of the login. Equivalent to User.getPassword().
         */
        PASSWORD,
        /**
         * Query the new E-Mail of the login. Equivalent to User.getNewEmail().
         */
        NEW_EMAIL,
        /**
         * Query the new password of the login. Equivalent to User.getNewPassword().
         */
        NEW_PASSWORD
    }

    /**
     * The result of DefaultLogin.query().
     *
     * For data that was not queried, the fields will be ```undefined```.
     */
    export interface IDefaultLoginQueryResult {
        /**
         * The ID of the login.
         */
        id?: ID;

        /**
         * The E-Mail of the login.
         */
        email?: string;

        /**
         * The encrypted password of the login.
         */
        password?: Password;

        /**
         * The new E-Mail of the login. If no change is in progress, this will be set to ```null```.
         */
        newEmail?: string;

        /**
         * The new password of the login. If no change is in progress, this will be set to ```null```.
         */
        newPassword?: Password;
    }
}

export = DefaultLogin;
