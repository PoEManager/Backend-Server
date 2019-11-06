import DatabaseConnection from '../core/database-connection';
import errors from './errors';

/**
 * The representation of a single user login.
 *
 * In order to get such a reference, see UserManager.getGoogleLogin() or User.getGoogleLogin().
 */
class GoogleLogin {
    /**
     * The ID of the login.
     */
    private readonly id: number;

    /**
     * Constructs a new instance. Should not be used directly, use UserManager.getGoogleLogin() instead.
     *
     * @param id The ID of the login.
     */
    public constructor(id: GoogleLogin.ID) {
        this.id = id;
    }

    /**
     * @returns The ID of the login.
     */
    public getId(): GoogleLogin.ID {
        return this.id;
    }

    /**
     * @returns The Google user ID.
     *
     * @throws **GoogleLoginNotFoundError** If the default login does not exist.
     */
    public async getGoogleUID(): Promise<string> {
        const result = await DatabaseConnection.query(
            'SELECT `google_uid` FROM `GoogleLogins` WHERE `GoogleLogins`.`googlelogin_id` = ?', {
                parameters: [
                    this.id
                ]
            });

        if (result.length === 1) {
            return result[0].google_uid;
        } else {
            throw this.makeLoginNotFoundError();
        }
    }

    /**
     * @returns A GoogleLoginNotFoundError with the proper ID.
     */
    private makeLoginNotFoundError(): errors.GoogleLoginNotFoundError {
        return new errors.GoogleLoginNotFoundError(this.id);
    }
}

/* istanbul ignore next ; weird typescript behavior, the namespace will be turned into an (uncovered) branch*/
namespace GoogleLogin {
    /**
     * The type of a login ID.
     */
    export type ID = number;
}

export = GoogleLogin;
