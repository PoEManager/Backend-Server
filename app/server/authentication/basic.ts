import passport from 'passport';
import HTTPAuth from 'passport-http';
import errors from '../../model/errors';
import UserManager from '../../model/user-manager';

function run() {
    const callback: HTTPAuth.BasicVerifyFunction = async (email, inPassword, done) => {
        try {
            const user = await UserManager.searchForUserWithEmail(email);
            const login = await user.getDefaultLogin();
            const password = await login.getPassword();

            if (await password.compareTo(inPassword)) {
                done(undefined, user);
            } else {
                throw new errors.InvalidCredentialsError();
            }
        } catch (error) {
            done(error);
        }
    };

    const strategy = new HTTPAuth.BasicStrategy(callback);

    passport.use(strategy);
}

export = {run};
