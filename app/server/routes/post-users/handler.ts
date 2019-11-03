import express from 'express';
import UserManager from '../../../model/user-manager';

async function handler(req: express.Request, res: express.Response): Promise<void> {
    req.locals.logger.info(`Creating new user with nickname ${req.body.nickname}.`);
    const user = await UserManager.createWithDefaultLogin({
        nickname: req.body.nickname,
        loginData: {
            email: req.body.loginData.email,
            unencryptedPassword: req.body.loginData.password
        }
    });

    req.locals.logger.info(`Created new user: id=${user.getId()};` +
        `nickname=${req.body.nickname};email=${req.body.loginData.email}`);
    req.locals.logger.info(`User creation successful. User ID is ${user.getId()}.`);
    res.send();
}

export = handler;
