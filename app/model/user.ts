
import _ from 'lodash';
import DatabaseConnection from '../core/database-connection';
import DefaultLogin from './default-login';
import errors from './errors';
import UserChanges from './user-changes';
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
            'SELECT TO_BASE64(`Users`.`change_uid`) as change_uid FROM `Users` WHERE `Users`.`user_id` = ?', {
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
            'SELECT UNIX_TIMESTAMP(`Users`.`change_expire_date`) FROM `Users` WHERE `Users`.`user_id` = ?', {
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
     * @returns The current session ID.
     *
     * @throws **UserNotFoundError** If the user does not exist.
     */
    public async getSessionID(): Promise<string | null> {
        const result = await DatabaseConnection.query(
            'SELECT `Users`.`session_id` FROM `Users` WHERE `Users`.`user_id` = ?', {
                parameters: [
                    this.id
                ]
            });

        if (result.length === 1) {
            return result[0].session_id;
        } else {
            throw this.makeUserNotFoundError();
        }
    }

    /**
     * Increments the current session ID by one.
     *
     * @throws **UserNotFoundError** If the user does not exist.
     */
    public async invalidateSessionId(): Promise<void> {
        const result = await DatabaseConnection.query(
            'UPDATE `Users` SET `session_id`=NULL WHERE `Users`.`user_id` = ?', {
                parameters: [
                    this.id
                ]
            });

        if (result.affectedRows !== 1) {
            throw this.makeUserNotFoundError();
        }
    }

    /**
     * Increments the current session ID by one.
     *
     * @throws **UserNotFoundError** If the user does not exist.
     */
    public async setSessionId(sessionId: string): Promise<void> {
        const result = await DatabaseConnection.query(
            'UPDATE `Users` SET `session_id`= ? WHERE `Users`.`user_id` = ?', {
                parameters: [
                    sessionId,
                    this.id
                ]
            });

        if (result.affectedRows !== 1) {
            throw this.makeUserNotFoundError();
        }
    }

    /**
     * @returns The current change state of the user, or ```null``` if no change is currently going on.
     */
    public async getChangeState(): Promise<User.ChangeType | null> {
        return await UserChanges.getChangeState(this.id);
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
     * @returns The date-time at which the user account was created.
     *
     * @throws **UserNotFoundError** If the user does not exist.
     */
    public async getCreatedTime(): Promise<Date> {
        const result = await DatabaseConnection.query(
            'SELECT `Users`.`created_time` FROM `Users` WHERE `Users`.`user_id` = ?', {
                parameters: [
                    this.id
                ]
            });

        if (result.length === 1) {
            return result[0].created_time;
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
            const columnsList  = _.map(queryData, queryDataToColumn); // convert QueryData to actual SQL columns
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
    public async newChange(infiniteDuration: boolean): Promise<UserManager.ChangeID> {
        return await UserChanges.newChange(this.id, infiniteDuration);
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
            return '`Users`.`user_id`';
        case User.QueryData.NICKNAME:
            return '`Users`.`nickname`';
        case User.QueryData.DEFAULT_LOGIN_ID:
            return '`Users`.`defaultlogin_id`';
        case User.QueryData.CHANGE_UID:
            return 'TO_BASE64(\`Users\`.\`change_uid\`) AS change_uid';
        case User.QueryData.SESSION_ID:
            return '\`Users\`.\`session_id\`';
        case User.QueryData.CREATED_TIME:
            return '\`Users\`.\`created_time\`';
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
        nickname: queryData.includes(User.QueryData.NICKNAME) ? result.nickname : undefined,
        changeUid: queryData.includes(User.QueryData.CHANGE_UID) ? result.change_uid : undefined,
        sessionId: queryData.includes(User.QueryData.SESSION_ID) ? result.session_id : undefined,
        createdTime: queryData.includes(User.QueryData.CREATED_TIME) ? result.created_time : undefined
    };
}

namespace User {
    export const ChangeType = UserChanges.ChangeType;
    export type ChangeType = UserChanges.ChangeType;

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
        DEFAULT_LOGIN_ID,

        /**
         * The user's change UID.
         */
        CHANGE_UID,

        /**
         * The user's session ID.
         */
        SESSION_ID,

        /**
         * The timestamp of the account creation.
         */
        CREATED_TIME
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

        /**
         * The current change UID. If there is no change going on, this will be set to `null`.
         */
        changeUid?: string;

        /**
         * The current session ID.
         */
        sessionId?: number;

        /**
         * The timestamp of the account creation.
         */
        createdTime?: Date;
    }
}

export = User;
