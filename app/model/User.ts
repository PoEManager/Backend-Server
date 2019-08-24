
import _ from 'lodash';
import DatabaseConnection from '../core/DatabaseConnection';
import DefaultLogin, { IDefaultLoginQueryResult } from './DefaultLogin';
import errors from './Errors';

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
     * @returns The current change state of the user, or ```null``` if no change is currently going on.
     */
    public getChangeState(): User.ChangeType {
        return null;
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
            columnsList = _.map(columnsList, surroundByBackticks); // surround columns with backticks (`)
            columns = columnsList.join(','); // make comma separated list
        }
        const sql = `SELECT ${columns} FROM \`Users\` WHERE \`Users\`.\`user_id\` = ?`;

        const result = await DatabaseConnection.query(sql, {
            parameters: [
                this.id
            ]
        });

        if (result.length === 1) {
            return sqlResultToQueryResult(result[0]);
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
     * @returns A UserNotFoundError with the proper user ID.
     */
    private makeUserNotFoundError(): errors.UserNotFoundError {
        return new errors.UserNotFoundError(this.id);
    }
}

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

function surroundByBackticks(str: string): string {
    return `\`${str}\``;
}

function sqlResultToQueryResult(result: any): User.IQueryResult {
    return {
        id: result.user_id ? result.user_id : undefined,
        defaultLoginId: result.defaultlogin_id ? result.defaultlogin_id : undefined,
        nickname: result.nickname ? result.nickname : undefined
    };
}

namespace User {
    /**
     * An enum with the possible types of account changes.
     */
    export enum _ChangeType {
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
     * A combination of the actual ChangeType enum and ```null``` (the latter indicates no change).
     */
    export type ChangeType = _ChangeType | null;

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
