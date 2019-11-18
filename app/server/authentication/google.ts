import config from 'cascading-config';
import passport from 'passport';
import Google from 'passport-google-oauth20';
import UserManager from '../../model/user-manager';
import redirectRouteDefinition from '../routes/get-login-google-redirect/route-definition.json';
import ServerUtils from '../server-utils';

type Callback =
    (accessToken: string, refreshToken: string, profile: Google.Profile, done: Google.VerifyCallback) => void;

function run() {
    const options: Google.StrategyOptions = {
        clientID: config.security.auth.google.clientId,
        clientSecret: config.security.auth.google.clientSecret,
        callbackURL: ServerUtils.makeRoutePath(redirectRouteDefinition.path),
        scope: ['profile', 'email']
    };

    const callback: Callback = (accessToken, refreshToken, profile, done) => {
        UserManager.getFromGoogleID(profile.id)
        .then(user => {
            done(undefined, user);
        })
        .catch(e => {
            done(ServerUtils.makeRESTableError(e).asRESTError());
        });
    };

    const strategy = new Google.Strategy(options, callback);

    passport.use(strategy);
}

export = {run};
