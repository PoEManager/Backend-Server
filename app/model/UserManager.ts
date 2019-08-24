
import DatabaseConnection from '../core/DatabaseConnection';
import DefaultLogin from './DefaultLogin';
import errors from './Errors';
import Password from './Password';
import User from './User';

/**
 * A namespace that gives access to the user system.
 *
 * This namespace can be used to create new users, get references to them, get references to logins and validate
 * account changes.
 */
namespace UserManager {

    /**
     * Create a new user.
     *
     * @param createData The data that is used to create the new user.
     * @returns A reference to the new user.
     *
     * @throws **DuplicateEmailError** An account with the passed E-Mail address already exists. Only thrown if the
     *         'loginData' field in the user create data is 'IDefaultLoginCreateData'.
     * @throws **InvalidEmailError** The passed email is invalid.
     * @throws **InvalidNicknameError** The passed nickname is invalid.
     */
    export async function create(createData: UserManager.IUserCreateData): Promise<User> {
        const password = Password.encryptPassword(createData.loginData.unencryptedPassword);

        let result: any;

        await DatabaseConnection.transaction(async conn => {
            result = await conn.query(
                'INSERT INTO `DefaultLogins` (`email`, `password`) VALUES (?, ?)', {
                    parameters: [
                        createData.loginData.email,
                        password
                    ],
                    expectedErrors: [
                        {
                            code: DatabaseConnection.ErrorCodes.DUPLICATE_ENTRY,
                            error: new errors.DuplicateEmailError(createData.loginData.email)
                        },
                        {
                            code: DatabaseConnection.ErrorCodes.CONSTRAINT_FAIL,
                            error: new errors.InvalidEmailError(createData.loginData.email)
                        }
                    ]
                });

            result = await conn.query(
                'INSERT INTO `Users` (`defaultlogin_id`, `nickname`) VALUES (?, ?)', {
                    parameters: [
                        result.insertId,
                        createData.nickname
                    ],
                    expectedErrors: [
                        {
                            code: DatabaseConnection.ErrorCodes.CONSTRAINT_FAIL,
                            error: new errors.InvalidNicknameError(createData.nickname)
                        },
                        {
                            code: DatabaseConnection.ErrorCodes.DATA_TOO_LONG,
                            error: new errors.InvalidNicknameError(createData.nickname)
                        }
                    ]
                });
        });

        return new User(result.insertId);
    }

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
     * Validates the a change with the passed , if one is going on.
     *
     * @param changeId The ID of the change that should be verified.
     * @throws **InvalidChangeIDError** If the passed ID is invalid.
     */
    export function validateChange(changeId: UserManager.ChangeID): void {

    }

    /**
     * Get the reference to a user.
     *
     * @param id The ID of the login to obtain.
     * @returns The User reference.
     *
     * @throws **LoginNotFoundError** The login with the passed ID does not exist.
     */
    export function getDefaultLogin(id: DefaultLogin.ID): DefaultLogin {
        throw new errors.LoginNotFoundError(id, errors.LoginNotFoundError.LoginType.DEFAULT);
    }

    /**
     * The data that is used to create new user account with email+password authentication.
     */
    export interface IDefaultLoginCreateData {
        /**
         * The E-Mail address of the new user.
         */
        email: string;

        /**
         * The (unencrypted) password of the new user.
         */
        unencryptedPassword: string;
    }

    /**
     * The data that is used to create a new user.
     */
    export interface IUserCreateData {
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
        loginData: IDefaultLoginCreateData;
    }

    /**
     * The ID of a user change.
     */
    export type ChangeID = string;
}

export = UserManager;
