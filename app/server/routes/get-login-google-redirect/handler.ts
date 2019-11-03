import express from 'express';
import passport from 'passport';
import SessionTokenManager from '../../../core/session-token-manager';
import errors from '../../../model/errors';
import User from '../../../model/user';
import ServerUtils from '../../server-utils';

async function handler(req: express.Request, res: express.Response): Promise<void> {
    req.locals.logger.info('Logging in User using Google.');
    passport.authenticate('google', {session: false}, async (error, user) => {
        if (error || !user) {
            ServerUtils.sendRESTError(req, res, new errors.InvalidCredentialsError());
        } else {
            req.locals.logger.info(`Login successful for user with ID ${user.getId()}.`);
            res.send({
                token: await SessionTokenManager.create(user as User)
            });
        }
    })(req, res);
}

export = handler;
