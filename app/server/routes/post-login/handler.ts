import express from 'express';
import SessionTokenManager from '../../../core/session-token-manager';
import errors from '../../../model/errors';
import UserManager from '../../../model/user-manager';

async function handler(req: express.Request, res: express.Response) {
    req.locals.logger.info('Logging in user.');
    const user = await UserManager.searchForUserWithEmail(req.body.email);
    const login = await user.getDefaultLogin();
    const password = await login.getPassword();

    if (await password.compareTo(req.body.password)) {
        req.locals.logger.info(`Login successful for user with ID ${user.getId()}.`);
        res.send({token: await SessionTokenManager.create(user)});
    } else {
        throw new errors.InvalidCredentialsError();
    }
}

export = handler;
