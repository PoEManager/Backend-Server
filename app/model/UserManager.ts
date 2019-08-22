
import DefaultLogin from './DefaultLogin';
import errors from './Errors';
import User from './User';

/**
 * A class that gives access to the user system.
 *
 * This class can be used to create new users and obtain references to them.
 */
class UserManager {
    /**
     * Create a new user.
     *
     * @param createData The data that is used to create the new user.
     * @returns A reference to the new user.
     *
     * @throws **DuplicateEmailError** An account with the passed E-Mail address already exists. Only thrown if the
     *         'loginData' field in the user create data is 'IDefaultLoginCreateData'.
     */
    public create(createData: UserManager.IUserCreateData): User {
        throw new errors.DuplicateEmailError(createData.loginData.email);
    }

    /**
     * Get the reference to a user.
     *
     * @param id The ID of the user to obtain.
     * @returns The User reference.
     *
     * @throws **UserNotFoundError** The user with the passed ID does not exist.
     */
    public get(id: User.ID): User {
        throw new errors.UserNotFoundError(id);
    }

    /**
     * Validates the a change with the passed , if one is going on.
     *
     * @param changeId The ID of the change that should be verified.
     * @throws **InvalidChangeIDError** If the passed ID is invalid.
     */
    // todo implement error
    public validateChange(changeId: UserManager.ChangeID): void {

    }

    /**
     * Get the reference to a user.
     *
     * @param id The ID of the login to obtain.
     * @returns The User reference.
     *
     * @throws **LoginNotFoundError** The login with the passed ID does not exist.
     */
    public getDefaultLogin(id: DefaultLogin.ID): DefaultLogin {
        throw new errors.LoginNotFoundError(id, errors.LoginNotFoundError.LoginType.DEFAULT);
    }

}

namespace UserManager {

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
