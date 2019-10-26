import _ from 'lodash';
import DatabaseConnection from '../core/database-connection';
import errors from './errors';
import Password from './password';
import User from './user';
import UserChanges from './user-changes';
import UserManager from './user-manager';

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
    public async updateEMail(email: string): Promise<UserManager.ChangeID> {
        return await DatabaseConnection.transaction(async conn => {
            const id = await this.getUserId(conn);

            if (await UserChanges.getChangeState(id) !== null) {
                throw new errors.ChangeAlreadyInProgressError(id);
            }

            // needs to be before the update of new_email, or the system thinks is already in progress
            const changeId = await UserChanges.newChange(id, false);

            const result = await conn.query(
                'UPDATE `DefaultLogins` SET `new_email` = ? WHERE `DefaultLogins`.`defaultlogin_id` = ?', {
                    parameters: [
                        email,
                        this.id
                    ]
                });

            if (result.affectedRows === 0) {
                // only for safety, should not happen
                throw new errors.UserNotFoundError(id);
            }

            return changeId;
        });
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
    public async updatePassword(password: Password): Promise<UserManager.ChangeID> {
        return await DatabaseConnection.transaction(async conn => {
            const id = await this.getUserId(conn);

            if (await UserChanges.getChangeState(id) !== null) {
                throw new errors.ChangeAlreadyInProgressError(id);
            }

            // needs to be before the update of new_email, or the system thinks is already in progress
            const changeId = await UserChanges.newChange(id, false);

            const result = await conn.query(
                'UPDATE `DefaultLogins` SET `new_password` = ? WHERE `DefaultLogins`.`defaultlogin_id` = ?', {
                    parameters: [
                        password.getEncrypted(),
                        this.id
                    ]
                });

            if (result.affectedRows === 0) {
                // only for safety, should not happen
                throw new errors.UserNotFoundError(id);
            }

            return changeId;
        });
    }

    /**
     * @returns The new E-Mail, if a change is in progress, or `null` if there is no change.
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
     * @returns The new password, if a change is in progress, or `null` if there is no change.
     */
    public async getNewPassword(): Promise<Password | null> {
        const result = await DatabaseConnection.query(
            'SELECT `new_password` FROM `DefaultLogins` WHERE `DefaultLogins`.`defaultlogin_id` = ?', {
                parameters: [
                    this.id
                ]
            });

        if (result.length === 1) {
            return result[0].new_password ? new Password(result[0].new_password) : null;
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
    public async query(queryData: DefaultLogin.QueryData[]): Promise<DefaultLogin.IQueryResult> {

        let columns: string;

        // if no data is queried, just check if the user exists (if not, an error will be thrown)
        if (queryData.length === 0) {
            columns = '1';
        } else {
            let columnsList  = _.map(queryData, queryDataToColumn); // convert QueryData to actual SQL columns
            columnsList = _.map(columnsList, str => `\`${str}\``); // surround columns with backticks (`)
            columns = columnsList.join(','); // make comma separated list
        }
        const sql = `SELECT ${columns} FROM \`DefaultLogins\` WHERE \`DefaultLogins\`.\`defaultlogin_id\` = ?`;

        const result = await DatabaseConnection.query(sql, {
            parameters: [
                this.id
            ]
        });

        if (result.length === 1) {
            return sqlResultToQueryResult(result[0], queryData);
        } else {
            throw this.makeLoginNotFoundError();
        }
    }

    /**
     * @returns A DefaultLoginNotFoundError with the proper user ID.
     */
    private makeLoginNotFoundError(): errors.DefaultLoginNotFoundError {
        return new errors.DefaultLoginNotFoundError(this.id);
    }

    /**
     * Queries the ID of the user, that the login belongs to.
     *
     * @param conn The connection that will be used for the query. When not passed, a new connection will be created.
     */
    private async getUserId(conn?: DatabaseConnection.Connection): Promise<User.ID> {
        const handler = async (innerConn: DatabaseConnection.Connection): Promise<User.ID> =>  {
            // get user ID of the login
            const result = await innerConn.query(
                'SELECT `Users`.`user_id` FROM `Users` NATURAL JOIN `DefaultLogins` ' +
                'WHERE `DefaultLogins`.`defaultlogin_id` = ?', {
                    parameters: [
                        this.id
                    ]
                });

            // should not happen; there is never a default login without a user that it belongs to
            if (result.length === 0) {
                throw new errors.UserNotFoundError(-1);
            }

            return result[0].user_id;
        };

        if (conn) {
            return await handler(conn);
        } else {
            return await DatabaseConnection.multiQuery(handler);
        }
    }
}

/**
 * Maps the elements in User.QueryData to their SQL column counterparts.
 *
 * @param queryData The data to map.
 * @returns The SQL column.
 */
function queryDataToColumn(queryData: DefaultLogin.QueryData): string {
    switch (queryData) {
        case DefaultLogin.QueryData.ID:
            return 'defaultlogin_id';
        case DefaultLogin.QueryData.EMAIL:
            return 'email';
        case DefaultLogin.QueryData.PASSWORD:
            return 'password';
        case DefaultLogin.QueryData.NEW_EMAIL:
            return 'new_email';
        case DefaultLogin.QueryData.NEW_PASSWORD:
            return 'new_password';
        default:
            return ''; // does not happen
    }
}

/**
 * Converts a SQL query result to User.IQueryResult.
 *
 * @param result The SQL query result.
 * @returns The converted result.
 */
function sqlResultToQueryResult(result: any, queryData: DefaultLogin.QueryData[]): DefaultLogin.IQueryResult {
    return {
        id: queryData.includes(DefaultLogin.QueryData.ID) ? result.defaultlogin_id : undefined,
        email: queryData.includes(DefaultLogin.QueryData.EMAIL) ? result.email : undefined,
        password: queryData.includes(DefaultLogin.QueryData.PASSWORD) ? result.password : undefined,
        newEmail: queryData.includes(DefaultLogin.QueryData.NEW_EMAIL) ? result.new_email : undefined,
        newPassword: queryData.includes(DefaultLogin.QueryData.NEW_PASSWORD) ? result.new_password : undefined
    };
}

namespace DefaultLogin {
    /**
     * The type of a login ID.
     */
    export type ID = number;

    /**
     * The data that can be queried by DefaultLogin.query().
     */
    export enum QueryData {
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
    export interface IQueryResult {
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
