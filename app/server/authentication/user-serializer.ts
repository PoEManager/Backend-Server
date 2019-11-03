import passport from 'passport';
import SessionManager from '../../core/session-token-manager';
import User from '../../model/user';
import ServerUtils from '../server-utils';

function run() {
    passport.serializeUser<User, string>(async (user, done) => {
        done(undefined, await SessionManager.create(user));
    });

    passport.deserializeUser<User, string>(async (id, done) => {
        try {
            done(undefined, await SessionManager.verify(id));
        } catch (error) {
            done(ServerUtils.makeRESTableError(error).asRESTError());
        }
    });
}

export = {run};
