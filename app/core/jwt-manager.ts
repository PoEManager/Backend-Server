
import jwt from 'jsonwebtoken';
import User from '../model/user';
import UserManager from '../model/user-manager';
import config from './config';
import errors from './errors';

namespace JWTManager {
    /**
     * The contents of a JWT payload.
     */
    interface IPayload {
        userId: number;
        jwtId: number;
    }

    /**
     * Creates a new JWT for the current user.
     *
     * @param user The user to create the JWT for.
     */
    export async function createJWT(user: User): Promise<string> {
        const queryResult = await user.query([User.QueryData.ID, User.QueryData.JWT_ID]);

        const payload: IPayload = {
            userId: queryResult.id!,
            jwtId: queryResult.jwtId!
        };

        const secret = config.security.jwt.secret;

        const options = {
            expiresIn: config.security.jwt.expiration
        };

        return jwt.sign(payload, secret, options);
    }

    /**
     * Verifies a JWT and returns the user that it belongs to.
     *
     * @param token The JWT.
     * @returns The user that the JWT belongs to.
     *
     * @throws **InvalidJWTError** If there is something wrong with the JWT.
     */
    export async function verifyJWT(token: string): Promise<User> {
        const secret = config.security.jwt.secret;

        try {
            const obj = jwt.verify(token, secret) as IPayload;

            if (!('userId' in obj) || !('jwtId' in obj)) { // payload is invalid
                throw new errors.InvalidJWTError(token);
            }

            const user = await UserManager.get(obj.userId);
            const jwtId = await user.getJwtID();

            if (obj.jwtId !== jwtId) { // JWT IDs do not match
                throw new errors.InvalidJWTError(token);
            }

            return user;
        } catch (error) { // catch error while decoding JWT or while UserManager.get()
            throw new errors.InvalidJWTError(token);
        }
    }

    /**
     * Invalidates the current JWTs of a user.
     *
     * @param token The JWT.
     *
     * @throws **InvalidJWTError** See `verifyJWT()`.
     */
    export async function invalidateJWT(token: string): Promise<void> {
        const user = await verifyJWT(token);

        await user.incrementJwtId();
    }
}

export = JWTManager;
