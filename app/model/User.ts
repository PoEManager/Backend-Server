
import DatabaseConnection from '../core/DatabaseConnection';
import DefaultLogin from './DefaultLogin';
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
     */
    public async getNickname(): Promise<string> {
        const result = await DatabaseConnection.query('SELECT `nickname` FROM `Users` WHERE `Users`.`id` = ?', {
            parameters: [
                this.id
            ],
            expectedErrors: []
        });

        return result.nickname;
    }

    /**
     * Sets a new nickname.
     *
     * @param nickname The new nickname.
     */
    public async setNickname(nickname: string): Promise<void> {
        const result = await DatabaseConnection.query(
            'UPDATE `Users` SET `Users`.`nickname` = ? WHERE `Users`.`id` = ?', {
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
    }

    /**
     * @returns ```true```, if the user has a default login. ```false``` if he/she does not.
     */
    public hasDefaultLogin(): boolean {
        return false;
    }

    /**
     * @returns A reference to the default login of the user, or ```null``` if the user does not have a default login.
     */
    public getDefaultLogin(): DefaultLogin | null {
        return null;
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
     */
    public query(queryData: User.QueryData[]): User.IQueryResult {
        return {};
    }

    /**
     * Delete the user account.
     *
     * @returns ```true```, if the user was successfully deleted. ```false``` if it was not (does the user even exist?).
     */
    public delete(): boolean {
        return false;
    }
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
