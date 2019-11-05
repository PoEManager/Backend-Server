
import DatabaseConnection from '../core/database-connection';
import DefaultLogin from './default-login';
import errors from './errors';
import Password from './password';
import User from './user';
import UserChanges from './user-changes';

/**
 * A namespace that gives access to the user system.
 *
 * This namespace can be used to create new users, get references to them, get references to logins and validate
 * account changes.
 */
namespace UserManager {

    /**
     * Create a new user with a default login.
     *
     * @param createData The data that is used to create the new user.
     * @returns A reference to the new user.
     *
     * @throws **DuplicateEmailError** An account with the passed E-Mail address already exists. Only thrown if the
     *         'loginData' field in the user create data is 'IDefaultLoginCreateData'.
     * @throws **InvalidEmailError** The passed email is invalid.
     * @throws **InvalidNicknameError** The passed nickname is invalid.
     */
    export async function createWithDefaultLogin(createData: UserManager.IDefaultLoginUserCreateData): Promise<User> {
        const password = await Password.encryptPassword(createData.loginData.unencryptedPassword);

        let result: any;

        await DatabaseConnection.transaction(async conn => {
            result = await conn.query('INSERT INTO `WalletRestrictions` () VALUES ()');

            const walletId = result.insertId;

            result = await conn.query(
                'INSERT INTO `DefaultLogins` (`password`) VALUES (?)', {
                    parameters: [
                        password.getEncrypted()
                    ],
                    expectedErrors: [
                    ]
                });

            const loginId = result.insertId;

            result = await conn.query(
                'INSERT INTO `Users` (`wallet_restriction_id`, `defaultlogin_id`, `nickname`, `verified`, ' +
                '`change_uid`, `change_expire_date`, `email`) VALUES ' +
                '(?, ?, ?, ?, POEM_UUID(), POEM_DATE_INFINITY(), ?)', {
                    parameters: [
                        walletId,
                        loginId,
                        createData.nickname,
                        false,
                        createData.loginData.email
                    ],
                    expectedErrors: [
                        {
                            code: DatabaseConnection.ErrorCodes.DATA_TOO_LONG,
                            error: new errors.InvalidNicknameError(createData.nickname)
                        },
                        {
                            code: DatabaseConnection.ErrorCodes.DUPLICATE_ENTRY,
                            error: new errors.DuplicateEmailError(createData.loginData.email)
                        },
                        {
                            callback: error => {
                                return error.errno === DatabaseConnection.ErrorCodes.CONSTRAINT_FAIL
                                && error.message.includes('CHECK_nickname');
                            },
                            error: new errors.InvalidNicknameError(createData.nickname)
                        },
                        {
                            callback: error => {
                                return error.errno === DatabaseConnection.ErrorCodes.CONSTRAINT_FAIL
                                && error.message.includes('CHECK_email');
                            },
                            error: new errors.InvalidEmailError(createData.loginData.email)
                        }
                    ]
                });
        });

        return new User(result.insertId);
    }

    /**
     * Create a new user wit a Google login.
     *
     * @param googleID The Google user ID.
     * @returns A reference to the new user.
     *
     * @throws **LoginAlreadyPresentError** An account with the same Google user ID already exists.
     */
    // todo LoginAlreadyPresentError wont be thrown, fix this
    /*
    export async function createWithGoogleUID(googleID: string): Promise<User> {
        let result: any;

        await DatabaseConnection.transaction(async conn => {
            result = await conn.query('INSERT INTO `WalletRestrictions` () VALUES ()');

            const walletId = result.insertId;

            result = await conn.query(
                'INSERT INTO `Users` (`wallet_restriction_id`, `google_uid`, `nickname`, `verified`, ' +
                '`change_uid`, `change_expire_date`) VALUES (?, ?, ?, ?, NULL, NULL)', {
                    parameters: [
                        walletId,
                        googleID,
                        'todo-todo', // todo query nickname from google
                        true
                    ]
                });
        });

        return new User(result.insertId);
    }*/

    /**
     * Get the reference to a user.
     *
     * @param id The ID of the user to obtain.
     * @returns The User reference.
     *
     * @throws **UserNotFoundError** The user with the passed ID does not exist.
     */
    export async function get(id: User.ID): Promise<User> {
        const result = await DatabaseConnection.query('SELECT 1 FROM `Users` WHERE `Users`.`user_id` = ?', {
            parameters: [
                id
            ],
            expectedErrors: []
        });

        if (result.length === 1) {
            return new User(id);
        } else {
            throw new errors.UserNotFoundError(id);
        }
    }

    /**
     * Queries a user account with a specific Google ID or creates a new account if one does not exist yet.
     *
     * @param googleID The Google user ID.
     * @returns The queried or created user.
     */
    export async function getFromGoogleID(googleID: string): Promise<User> {
        const sql = 'SELECT `Users`.`user_id` FROM `Users` WHERE `Users`.`google_uid` = ?';

        const result = await DatabaseConnection.query(sql, {
            parameters: [
                googleID
            ]
        });

        if (result.length === 1) {
            return new User(result[0].user_id);
        } else {
            return null as unknown as User; // await createWithGoogleUID(googleID);
        }
    }

    /**
     * Validates the a change with the passed , if one is going on.
     *
     * @param changeId The ID of the change that should be verified.
     * @throws **InvalidChangeIDError** If the passed ID is invalid.
     */
    export async function validateChange(changeId: UserManager.ChangeID): Promise<void> {
        return await UserChanges.validateChange(changeId);
    }

    /**
     * Returns a user with a specific change ID.
     *
     * @param changeId The change ID.
     * @returns The user that has the passed change ID.
     *
     * @throws **InvalidChangeIDError** If there is not user with the passed change ID.
     */
    export async function getUserFromChangeId(changeId: UserManager.ChangeID): Promise<User> {
        return new User(await UserChanges.getUserFromChangeId(changeId));
    }

    /**
     * Get the reference to a user.
     *
     * @param id The ID of the login to obtain.
     * @returns The User reference.
     *
     * @throws **LoginNotFoundError** The login with the passed ID does not exist.
     */
    export async function getDefaultLogin(id: DefaultLogin.ID): Promise<DefaultLogin> {
        const result = await DatabaseConnection.query(
            'SELECT 1 FROM `DefaultLogins` WHERE `DefaultLogins`.`defaultlogin_id` = ?', {
            parameters: [
                id
            ],
            expectedErrors: []
        });

        if (result.length === 1) {
            return new DefaultLogin(id);
        } else {
            throw new errors.DefaultLoginNotFoundError(id);
        }
    }

    /**
     * Searches for a user that has a default login with the passed E-Mail.
     *
     * @param email The E-Mail address of the user.
     * @returns The user.
     *
     * @throws **InvalidCredentialsError** If there is no user with the passed credentials.
     */
    export async function searchForUserWithEmail(email: string): Promise<User> {
        const result = await DatabaseConnection.query(
            'SELECT `Users`.`user_id` FROM `Users` WHERE `Users`.`email` = ?', {
                parameters: [
                    email
                ],
                expectedErrors: []
            }
        );

        if (result.length === 1) {
            return new User(result[0].user_id);
        } else {
            throw new errors.InvalidCredentialsError();
        }
    }

    /**
     * Searches for a user with a specific session ID.
     *
     * @param sessionId The session ID.
     * @returns The user.
     *
     * @throws **InvalidCredentialsError** If there is no user with the passed session ID.
     */
    export async function searchForUserWithSessionId(sessionId: string): Promise<User> {
        const result = await DatabaseConnection.query(
            'SELECT `Users`.`user_id` FROM `Users` WHERE `Users`.`session_id` = ?', {
                parameters: [
                    sessionId
                ],
                expectedErrors: []
            }
        );

        if (result.length === 1) {
            return new User(result[0].user_id);
        } else {
            throw new errors.InvalidCredentialsError();
        }
    }

    /**
     * The data that is used to create a new user.
     */
    export interface IDefaultLoginUserCreateData {
        /**
         * The nickname of the new user.
         */
        nickname: string;

        /**
         * The data that is used to create the authentication method of the user.
         *
         * In the future, when new authentication methods are implemented, this field will also hold the create data
         * of the other authentication methods.
         */
        loginData: {
            /**
             * The E-Mail address of the new user.
             */
            email: string;

            /**
             * The (unencrypted) password of the new user.
             */
            unencryptedPassword: string;
        };
    }

    /**
     * The ID of a user change.
     */
    export type ChangeID = string;
}

export = UserManager;
