
import _ from 'lodash';
import DatabaseConnection from '../core/database-connection';
import DefaultLogin from './default-login';
import errors from './errors';
import GoogleLogin from './google-login';
import Password from './password';
import UserChanges from './user-changes';
import UserManager from './user-manager';
import WalletRestrictions from './wallet-restrictions';

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
     * @returns `true`, if the user has a default login, `false` if not.
     *
     * @throws **UserNotFoundError** If the user does not exist.
     */
    public async hasDefaultLogin(): Promise<boolean> {
        try {
            // check if this function throws or not
            await this.getDefaultLogin();
            return true;
        } catch (error) {
            if (error instanceof errors.LoginNotPresentError) {
                return false;
            }

            throw error;
        }
    }

    /**
     * @returns A reference to the default login of the user.
     *
     * @throws **UserNotFoundError** If the user does not exist.
     * @throws **DefaultLoginNotFoundError** If the user does not have a default login.
     */
    public async getDefaultLogin(): Promise<DefaultLogin> {
        const result = await DatabaseConnection.query('SELECT `defaultlogin_id` FROM `Users` WHERE `Users`.`user_id` = ?', {
                parameters: [
                    this.id
                ]
            });

        if (result.length === 1 && result[0].defaultlogin_id !== null) {
            return new DefaultLogin(result[0].defaultlogin_id);
        } else if (result[0] === undefined) {
            throw this.makeUserNotFoundError();
        } else {
            throw new errors.DefaultLoginNotPresentError(this.id);
        }
    }

    /**
     * Removes the default login from the User.
     *
     * @throws **UserNotFoundError** If the user does not exist.
     * @throws **DefaultLoginNotPresentError** If the user does not have a default login.
     * @throws **InvalidLoginStateError** If the user only has this login.
     */
    public async removeDefaultLogin(): Promise<void> {
        if (!await this.hasDefaultLogin()) {
            throw new errors.DefaultLoginNotPresentError(this.id);
        }

        const result = await DatabaseConnection.query(
            'DELETE FROM \`DefaultLogins\` WHERE \`DefaultLogins\`.\`defaultlogin_id\` = ?', {
                parameters: [
                    (await this.getDefaultLogin()).getId() // sub-query does not work
                ],
                expectedErrors: [
                    {
                        code: DatabaseConnection.ErrorCodes.CONSTRAINT_FAIL,
                        error: new errors.InvalidLoginStateError(this.id)
                    },
                    {
                        // 45002 is the state INVALID_LOGIN_STATE
                        callback: e => e.errno === DatabaseConnection.ErrorCodes.SIGNAL_EXCEPTION &&
                                       e.sqlState === '45002',
                        error: new errors.InvalidLoginStateError(this.id)
                    }
                ]
            });

        // should not happen, this is already caught by .hasDefaultLogin()
        /* istanbul ignore if */
        if (result.affectedRows !== 1) {
            throw this.makeUserNotFoundError();
        }
    }

    /**
     * Adds a default login to a user.
     *
     * @param password The unencrypted password of the login.
     *
     * @throws **UserNotFoundError** If the user does not exist.
     * @throws **DefaultLoginAlreadyPresentError** If the user already has a default login.
     */
    public async addDefaultLogin(password: string): Promise<void> {
        if (await this.hasDefaultLogin()) {
            throw new errors.DefaultLoginAlreadyPresentError(this.id);
        }

        const encrypted = await Password.encryptPassword(password);

        await DatabaseConnection.transaction(async conn => {
            const result = await conn.query('INSERT INTO `DefaultLogins` (`password`) VALUES (?);' +
                'UPDATE `Users` SET `Users`.`defaultlogin_id` = LAST_INSERT_ID() WHERE `Users`.`user_id` = ?', {
                parameters: [
                    encrypted.getEncrypted(),
                    this.id
                ]
            });

            // should not happen, this is already caught by .hasDefaultLogin()
            /* istanbul ignore if */
            if (result[0].affectedRows !== 1 || result[1].affectedRows !== 1) {
                throw this.makeUserNotFoundError();
            }
        });
    }

    /**
     * @returns `true`, if the user has a Google login, `false` if not.
     *
     * @throws **UserNotFoundError** If the user does not exist.
     */
    public async hasGoogleLogin(): Promise<boolean> {
        try {
            // check if this function throws or not
            await this.getGoogleLogin();
            return true;
        } catch (error) {
            if (error instanceof errors.LoginNotPresentError) {
                return false;
            }

            throw error;
        }
    }

    /**
     * @returns A reference to the Google login of the user.
     *
     * @throws **UserNotFoundError** If the user does not exist.
     * @throws **GoogleLoginNotPresentError** If the user does not have a default login.
     */
    public async getGoogleLogin(): Promise<GoogleLogin> {
        const result = await DatabaseConnection.query(
            'SELECT `googlelogin_id` FROM `Users` WHERE `Users`.`user_id` = ?', {
                parameters: [
                    this.id
                ]
            });

        if (result.length === 1 && result[0].googlelogin_id !== null) {
            return new GoogleLogin(result[0].googlelogin_id);
        } else if (result[0] === undefined) {
            throw this.makeUserNotFoundError();
        } else {
            throw new errors.GoogleLoginNotPresentError(this.id);
        }
    }

    /**
     * Removes the Google login from the User.
     *
     * @throws **UserNotFoundError** If the user does not exist.
     * @throws **GoogleLoginNotPresentError** If the user does not have a Google login.
     * @throws **InvalidLoginStateError** If the user only has this login.
     */
    public async removeGoogleLogin(): Promise<void> {
        if (!await this.hasGoogleLogin()) {
            throw new errors.GoogleLoginNotPresentError(this.id);
        }

        const result = await DatabaseConnection.query(
            'DELETE FROM \`GoogleLogins\` WHERE \`GoogleLogins\`.\`googlelogin_id\` = ?', {
                parameters: [
                    (await this.getGoogleLogin()).getId() // sub-query does not work
                ],
                expectedErrors: [
                    {
                        code: DatabaseConnection.ErrorCodes.CONSTRAINT_FAIL,
                        error: new errors.InvalidLoginStateError(this.id)
                    },
                    {
                        // 45002 is the state INVALID_LOGIN_STATE
                        callback: e => e.errno === DatabaseConnection.ErrorCodes.SIGNAL_EXCEPTION &&
                                       e.sqlState === '45002',
                        error: new errors.InvalidLoginStateError(this.id)
                    }
                ]
            });

        // should not happen, this is already caught by .hasGoogleLogin()
        /* istanbul ignore if */
        if (result.affectedRows !== 1) {
            throw this.makeUserNotFoundError();
        }
    }

    /**
     * Adds a Google login to a user.
     *
     * @param googleUID The Google user ID of the user.
     *
     * @throws **UserNotFoundError** If the user does not exist.
     * @throws **DefaultLoginAlreadyPresentError** If the user already has a default login.
     */
    public async addGoogleLogin(googleUID: string): Promise<void> {
        if (await this.hasGoogleLogin()) {
            throw new errors.GoogleLoginAlreadyPresentError(this.id);
        }

        await DatabaseConnection.transaction(async conn => {
            const result = await conn.query('INSERT INTO `GoogleLogins` (`google_uid`) VALUES (?);' +
            'UPDATE `Users\` SET `Users`.`googlelogin_id` = LAST_INSERT_ID() WHERE `Users`.`user_id` = ?', {
                parameters: [
                    googleUID,
                    this.id
                ]
            });

            // should not happen, this is already caught by .hasGoogleLogin()
            /* istanbul ignore if */
            if (result[0].affectedRows !== 1 || result[1].affectedRows !== 1) {
                throw this.makeUserNotFoundError();
            }
        });
    }

    /**
     * @returns A reference to the wallet restriction of the user.
     *
     * @throws **UserNotFoundError** If the user does not exist.
     */
    public async getWalletRestrictions(): Promise<WalletRestrictions> {
        const result = await DatabaseConnection.query(
            'SELECT `wallet_restriction_id` FROM `Users` WHERE `Users`.`user_id` = ?', {
                parameters: [
                    this.id
                ]
            });

        if (result.length === 1) {
            return new WalletRestrictions(result[0].wallet_restriction_id);
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
            'SELECT `Users`.`change_expire_date` FROM `Users` WHERE `Users`.`user_id` = ?', {
                parameters: [
                    this.id
                ]
            });

        if (result.length === 1) {
            return result[0].change_expire_date;
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
     * @returns The current avatar state of the user.
     *
     * @throws **UserNotFoundError** If the user does not exist.
     */
    public async getAvatarState(): Promise<User.AvatarState> {
        const result = await DatabaseConnection.query(
            'SELECT `Users`.`avatar_state` FROM `Users` WHERE `Users`.`user_id` = ?', {
                parameters: [
                    this.id
                ]
            });

        if (result.length === 1) {
            return result[0].avatar_state;
        } else {
            throw this.makeUserNotFoundError();
        }
    }

    /**
     * Sets a new avatar state.
     *
     * @throws **UserNotFoundError** If the user does not exist.
     */
    public async setAvatarState(avatarState: User.AvatarState): Promise<void> {
        const result = await DatabaseConnection.query(
            'UPDATE `Users` SET `avatar_state`= ? WHERE `Users`.`user_id` = ?', {
                parameters: [
                    avatarState,
                    this.id
                ]
            });

        if (result.affectedRows !== 1) {
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
     * @returns The E-Mail that the login has.
     *
     * @throws **DefaultLoginNotFoundError** If the default login does not exist.
     */
    public async getEmail(): Promise<string> {
        const result = await DatabaseConnection.query(
            'SELECT `email` FROM `Users` WHERE `Users`.`user_id` = ?', {
                parameters: [
                    this.id
                ]
            });

        if (result.length === 1) {
            return result[0].email;
        } else {
            throw this.makeUserNotFoundError();
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
            if (await UserChanges.getChangeState(this.id) !== null) {
                throw new errors.ChangeAlreadyInProgressError(this.id);
            }

            // needs to be before the update of new_email, or the system thinks is already in progress
            const changeId = await UserChanges.newChange(this.id, false);

            const result = await conn.query(
                'UPDATE `Users` SET `new_email` = ? WHERE `Users`.`user_id` = ?', {
                    parameters: [
                        email,
                        this.id
                    ]
                });

            /* istanbul ignore if */
            if (result.affectedRows === 0) {
                // only for safety, should not happen
                throw new errors.UserNotFoundError(this.id);
            }

            return changeId;
        });
    }

    /**
     * @returns The new E-Mail, if a change is in progress, or `null` if there is no change.
     */
    public async getNewEmail(): Promise<string | null> {
        const result = await DatabaseConnection.query(
            'SELECT `new_email` FROM `Users` WHERE `Users`.`user_id` = ?', {
                parameters: [
                    this.id
                ]
            });

        if (result.length === 1) {
            return result[0].new_email;
        } else {
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
        case User.QueryData.GOOGLE_LOGIN_ID:
            return '`Users`.`googlelogin_id`';
        case User.QueryData.CHANGE_UID:
            return 'TO_BASE64(\`Users\`.\`change_uid\`) AS change_uid';
        case User.QueryData.SESSION_ID:
            return '\`Users\`.\`session_id\`';
        case User.QueryData.CREATED_TIME:
            return '\`Users\`.\`created_time\`';
        case User.QueryData.AVATAR_STATE:
            return '\`Users\`.\`avatar_state\`';
        case User.QueryData.EMAIL:
            return '\`Users\`.\`email\`';
        case User.QueryData.NEW_EMAIL:
            return '\`Users\`.\`new_email\`';
        /* istanbul ignore next */
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
        googleLoginId: queryData.includes(User.QueryData.GOOGLE_LOGIN_ID) ? result.googlelogin_id : undefined,
        nickname: queryData.includes(User.QueryData.NICKNAME) ? result.nickname : undefined,
        changeUid: queryData.includes(User.QueryData.CHANGE_UID) ? result.change_uid : undefined,
        sessionId: queryData.includes(User.QueryData.SESSION_ID) ? result.session_id : undefined,
        createdTime: queryData.includes(User.QueryData.CREATED_TIME) ? result.created_time : undefined,
        avatarState: queryData.includes(User.QueryData.AVATAR_STATE) ? result.avatar_state : undefined,
        email: queryData.includes(User.QueryData.EMAIL) ? result.email : undefined,
        newEmail: queryData.includes(User.QueryData.NEW_EMAIL) ? result.new_email : undefined
    };
}

/* istanbul ignore next ; weird typescript behavior, the namespace will be turned into an (uncovered) branch*/
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
         * The user's Google login ID.
         */
        GOOGLE_LOGIN_ID,

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
        CREATED_TIME,

        /**
         * The current state of the user's avatar.
         */
        AVATAR_STATE,

        /**
         * Query the E-Mail of the login. Equivalent to User.getEmail().
         */
        EMAIL,

        /**
         * Query the new E-Mail of the login. Equivalent to User.getNewEmail().
         */
        NEW_EMAIL
    }

    export enum AvatarState {
        DEFAULT = 'default',
        CUSTOM = 'custom'
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
         * The default login ID of the user. If the user does not have a default login, this will be set to `null`.
         */
        defaultLoginId?: DefaultLogin.ID | null;

        /**
         * The Google login ID of the user. If the user does not have a default login, this will be set to `null`.
         */
        googleLoginId?: GoogleLogin.ID;

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

        /**
         * The current state of the user's avatar.
         */
        avatarState?: AvatarState;

        /**
         * The E-Mail of the login.
         */
        email?: string;

        /**
         * The new E-Mail of the login. If no change is in progress, this will be set to ```null```.
         */
        newEmail?: string;
    }
}

export = User;
