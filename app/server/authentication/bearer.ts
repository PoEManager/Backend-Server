import passport from 'passport';
import BearerAuth from 'passport-http-bearer';
import SessionTokenManager from '../../core/session-token-manager';
import errors from '../../model/errors';

function run() {
    const callback: BearerAuth.VerifyFunction = async (token, done) => {
        try {
            if (token) {
                const user = await SessionTokenManager.verify(token);
                done(undefined, user);
            } else {
                throw new errors.InvalidCredentialsError();
            }
        } catch (error) {
            done(error);
        }
    };

    const strategy = new BearerAuth.Strategy(callback);

    passport.use(strategy);
}

export = {run};
