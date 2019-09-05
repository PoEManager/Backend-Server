
import crypto from 'crypto';
import User from '../model/user';
import UserManager from '../model/user-manager';

namespace SessionTokenManager {
    function makeSessionId(): string {
        // makes 64 char string
        return crypto.randomBytes(32).toString('base64');
    }

    /**
     * Creates a new session ID for the current user or returns the existing one (if one does exist).
     *
     * @param user The user to create the session ID for.
     * @returns The session ID.
     */
    export async function create(user: User): Promise<string> {
        const oldSessionId = await user.getSessionID();

        if (oldSessionId) {
            return oldSessionId;
        } else {
            const sessionId = makeSessionId();
            await user.setSessionId(sessionId);
            return sessionId;
        }
    }

    /**
     * Verifies a session ID and returns the user that it belongs to.
     *
     * @param token The session ID.
     * @returns The user that the session ID belongs to.
     *
     * @throws **InvalidCredentialsError** If there is no user with the passed session ID.
     */
    export async function verify(token: string): Promise<User> {
        return await UserManager.searchForUserWithSessionId(token);
    }

    /**
     * Invalidates the current session ID of a user.
     *
     * @param token The session ID.
     *
     * @throws **InvalidCredentialsError** See `verify()`.
     */
    export async function invalidate(token: string): Promise<void> {
        const user = await verify(token);

        await user.invalidateSessionId();
    }
}

export = SessionTokenManager;
