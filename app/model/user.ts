
import _ from 'lodash';
import DatabaseConnection from '../core/database-connection';
import DefaultLogin from './default-login';
import errors from './errors';
import UserManager from './user-manager';

/**
 * The representation of a single user account.
 *
 * In order to get such a reference, see UserManager.get().
 */
class User {

    /**
     * The ID of the user.
     */
    private readonly id: User.ID;

    /**
     * Constructs a new instance. Should not be used directly, use UserManager.get() instead.
     *
     * @param id The ID of the user.
     */
    public constructor(id: User.ID) {
        this.id = id;
    }

    /**
     * @returns The ID of the user.
     */
    public getId(): User.ID {
        return this.id;
    }

    /**
     * @returns The nickname of the user.
     *
     * @throws **UserNotFoundError** If the user does not exist.
     */
    public async getNickname(): Promise<string> {
        const result = await DatabaseConnection.query('SELECT `nickname` FROM `Users` WHERE `Users`.`user_id` = ?', {
            parameters: [
                this.id
            ]
        });

        if (result.length !== 1) {
            throw this.makeUserNotFoundError();
        }

        return result[0].nickname;
    }

    /**
     * Sets a new nickname.
     *
     * @param nickname The new nickname.
     *
     * @throws **UserNotFoundError** If the user does not exist.
     * @throws **InvalidNicknameError** The new nickname is invalid.
     */
    public async setNickname(nickname: string): Promise<void> {
        const result = await DatabaseConnection.query(
            'UPDATE `Users` SET `Users`.`nickname` = ? WHERE `Users`.`user_id` = ?', {
            parameters: [
                nickname,
                this.id
            ],
            expectedErrors: [
                {
                    code: DatabaseConnection.ErrorCodes.CONSTRAINT_FAIL, // invalid format for nickname
                    error: new errors.InvalidNicknameError(nickname)
                }
            ]
        });

        if (result.affectedRows !== 1) {
            throw this.makeUserNotFoundError();
        }
    }

    /**
     * @returns ```true```, if the user has a default login, ```false``` if not.
     *
     * @throws **UserNotFoundError** If the user does not exist.
     */
    public async hasDefaultLogin(): Promise<boolean> {
        try {
            // check if this function throws or not
            await this.getDefaultLogin();
            return true;
        } catch (error) {
            if (error instanceof errors.LoginNotFoundError) {
                return false;
            }

            throw error;
        }
    }

    /**
     * @returns A reference to the default login of the user.
     *
     * @throws **UserNotFoundError** If the user does not exist.
     */
    public async getDefaultLogin(): Promise<DefaultLogin> {
        const result = await DatabaseConnection.query('SELECT `defaultlogin_id` FROM `Users` WHERE `Users`.`user_id` = ?', {
                parameters: [
                    this.id
                ]
            });

        if (result.length === 1) {
            return new DefaultLogin(result[0].defaultlogin_id);
        } else {
            throw this.makeUserNotFoundError();
        }
    }

    /**
     * @returns The current change uid.
     *
     * @throws **UserNotFoundError** If the user does not exist.
     */
    public async getChangeUID(): Promise<string | null> {
        const result = await DatabaseConnection.query(
            'SELECT TO_BASE64(\`Users\`.\`change_uid\`) as change_uid FROM `Users` WHERE `Users`.`user_id` = ?', {
                parameters: [
                    this.id
                ]
            });

        if (result.length === 1) {
            return result[0].change_uid;
        } else {
            throw this.makeUserNotFoundError();
        }
    }

    /**
     * @returns The current expire date.
     *
     * @throws **UserNotFoundError** If the user does not exist.
     */
    public async getChangeExpireDate(): Promise<Date> {
        const result = await DatabaseConnection.query(
            'SELECT UNIX_TIMESTAMP(\`Users\`.\`change_expire_date\`) FROM `Users` WHERE `Users`.`user_id` = ?', {
                parameters: [
                    this.id
                ]
            });

        if (result.length === 1) {
            return new Date(result[0].change_expire_date);
        } else {
            throw this.makeUserNotFoundError();
        }
    }

    /**
     * @returns The current change state of the user, or ```null``` if no change is currently going on.
     */
    public async getChangeState(): Promise<User.ChangeType | null> {
        return await DatabaseConnection.multiQuery(async conn => {
            const result = await conn.query(
                'SELECT `change_uid`, UNIX_TIMESTAMP(`change_expire_date`) as `change_expire_date` ' +
                'FROM `Users` WHERE `Users`.`user_id` = ?', {
                    parameters: [
                        this.id
                    ]
                });

            if (result.length !== 1) {
                throw this.makeUserNotFoundError();
            }

            if (result[0].change_uid) {
                const changeType = await this.getChangeType(conn);

                if (result[0].change_expire_date < new Date().getTime()) {
                    // change is still valid, change is going on (has not expired yet)
                    return changeType;
                } else {
                    // change has expired; clean up and return false
                    await this.resetChange(conn, changeType);

                    // reset change_uid and change_expire_date
                    await conn.query(
                        'UPDATE `Users` SET `change_uid` = NULL, `change_expire_date` = NULL ' +
                        'WHERE `Users`.`user_id` = ?', {
                            parameters: [
                                this.id
                            ]
                        });

                    if (result.affectedRows !== 1) {
                        throw this.makeUserNotFoundError();
                    }

                    return null;
                }
            } else { // when change_uid is null, no change is in progress
                return null;
            }
        });
    }

    /**
     * @returns ```true``` if the user is verified, ```false``` if not.
     *
     * @throws **UserNotFoundError** If the user does not exist.
     */
    public async isVerified(): Promise<boolean> {
        const result = await DatabaseConnection.query('SELECT `verified` FROM `Users` WHERE `Users`.`user_id` = ?', {
                parameters: [
                    this.id
                ]
            });

        if (result.length === 1) {
            return result[0].verified;
        } else {
            throw this.makeUserNotFoundError();
        }
    }

    /**
     * Query data about the user. This method unites all of the other getters (such as getNickname() and getId()) into
     * one. This can improve the performance, because it reduces the amount of SQL calls to the database.
     *
     * @param queryData A list of the data that should be queried.
     * @returns The queried data.
     *
     * @throws **UserNotFoundError** If the user does not exist.
     */
    public async query(queryData: User.QueryData[]): Promise<User.IQueryResult> {

        let columns: string;

        // if no data is queried, just check if the user exists (if not, an error will be thrown)
        if (queryData.length === 0) {
            columns = '1';
        } else {
            let columnsList  = _.map(queryData, queryDataToColumn); // convert QueryData to actual SQL columns
            columnsList = _.map(columnsList, str => `\`${str}\``); // surround columns with backticks (`)
            columns = columnsList.join(','); // make comma separated list
        }

        const sql = `SELECT ${columns} FROM \`Users\` WHERE \`Users\`.\`user_id\` = ?`;

        const result = await DatabaseConnection.query(sql, {
            parameters: [
                this.id
            ]
        });

        if (result.length === 1) {
            return sqlResultToQueryResult(result[0], queryData);
        } else {
            throw this.makeUserNotFoundError();
        }
    }

    /**
     * Delete the user account.
     *
     * @throws **UserNotFoundError** If the user does not exist (i.e. no user could be deleted).
     */
    public async delete(): Promise<void> {
        const result = await DatabaseConnection.query('DELETE FROM `Users` WHERE `Users`.`user_id` = ?', {
            parameters: [
                this.id
            ]
        });

        if (result.affectedRows !== 1) {
            throw this.makeUserNotFoundError();
        }
    }

    /**
     * Creates a new change for the user by setting a change uid and change expire date.
     *
     * @param infiniteDuration If ```true```, the change will never expire. Otherwise, it expires after two weeks.
     *
     * @throws **ChangeAlreadyInProgressError** If there is already another change in progress.
     */
    private async newChange(infiniteDuration: boolean): Promise<UserManager.ChangeID> {
        if (await this.getChangeState() !== null) { // also throws user not found error
            throw new errors.ChangeAlreadyInProgressError(this.id);
        }

        const dateFn = infiniteDuration ? 'POEM_DATE_INFINITY()' : 'POEM_DATE_TWO_WEEKS()';

        const result = await DatabaseConnection.query(`UPDATE \`Users\` ` +
            `SET \`Users\`.\`change_uid\` = POEM_UUID(), \`Users\`.\`change_expire_date\` = ${dateFn}` +
            `WHERE \`User\`.\`user_id\` = ?;` +
            `SELECT TO_BASE64(\`Users\`.\`change_uid\`) AS change_uid FROM \`Users\` ` +
            `WHERE \`Users\`.\`user_id\` = ?;`, {
                parameters: [
                    this.id,
                    this.id
                ]
            });

        if (result[0].affectedRows !== 1 || result[1].length !== 1) {
            throw new errors.UserNotFoundError(this.id);
        }

        return result[1][0].change_uid;
    }

    /**
     * Resets an ongoing change (in a ROLLBACK sort of way).
     *
     * @param conn The connection that will be used for the query.
     * @param change The change to reset.
     */
    private async resetChange(conn: DatabaseConnection.Connection, change: User.ChangeType | null): Promise<void> {
        switch (change) {
            case User.ChangeType.VERIFY_ACCOUNT:
                // verification needs no reset
                break;
        }
    }

    /**
     * Queries the current change type.
     * This method ignores the change_uid and change_expire_date.
     *
     * @param conn The connection that will be used for the query.
     */
    private async getChangeType(conn: DatabaseConnection.Connection): Promise<User.ChangeType | null> {
        const result = await conn.query('SELECT `Users`.`verified` FROM `Users` WHERE `Users`.`user_id` = ?', {
            parameters: [
                this.id
            ]
        });

        if (result.length !== 1) {
            throw this.makeUserNotFoundError();
        }

        if (!result[0].verified) { // if the user is not verified yet, this change takes precedence
            return User.ChangeType.VERIFY_ACCOUNT;
        } else {
            return null;
        }
    }

    /**
     * @returns A UserNotFoundError with the proper user ID.
     */
    private makeUserNotFoundError(): errors.UserNotFoundError {
        return new errors.UserNotFoundError(this.id);
    }
}

/**
 * Maps the elements in User.QueryData to their SQL column counterparts.
 *
 * @param queryData The data to map.
 * @returns The SQL column.
 */
function queryDataToColumn(queryData: User.QueryData): string {
    switch (queryData) {
        case User.QueryData.ID:
            return 'user_id';
        case User.QueryData.NICKNAME:
            return 'nickname';
        case User.QueryData.DEFAULT_LOGIN_ID:
            return 'defaultlogin_id';
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
function sqlResultToQueryResult(result: any, queryData: User.QueryData[]): User.IQueryResult {
    return {
        id: queryData.includes(User.QueryData.ID) ? result.user_id : undefined,
        defaultLoginId: queryData.includes(User.QueryData.DEFAULT_LOGIN_ID) ? result.defaultlogin_id : undefined,
        nickname: queryData.includes(User.QueryData.NICKNAME) ? result.nickname : undefined
    };
}

namespace User {
    /**
     * An enum with the possible types of account changes.
     */
    export enum ChangeType {
        /**
         * The account requires verification.
         */
        VERIFY_ACCOUNT,
        /**
         * The E-Mail is being changed.
         */
        NEW_EMAIL,
        /**
         * The password is being changed.
         */
        NEW_PASSWORD
    }

    /**
     * The type of a user ID.
     */
    export type ID = number;

    /**
     * The data that can be queried by User.query().
     */
    export enum QueryData {
        /**
         * Query the ID of the user. Equivalent to User.getId().
         */
        ID,
        /**
         * The user's nickname.
         */
        NICKNAME,
        /**
         * The user's default login ID.
         */
        DEFAULT_LOGIN_ID
    }

    /**
     * The result of User.query().
     *
     * For data that was not queried, the fields will be ```undefined```.
     */
    export interface IQueryResult {
        /**
         * The ID of the login.
         */
        id?: ID;

        /**
         * The nickname of the user.
         */
        nickname?: string;

        /**
         * The default login ID of the user. If the user does not have a default login, this will be set to ```null```.
         */
        defaultLoginId?: DefaultLogin.ID;
    }
}

export = User;
