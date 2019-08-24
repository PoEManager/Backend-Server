import express from 'express';
import logger from '../../../core/Logger';
import UserManager from '../../../model/UserManager';
import RouteConfiguration from '../../RouteConfiguration';
import ServerUtils from '../../serverUtils';

const route: RouteConfiguration = {
    method: 'POST',
    path: '/users',
    handler
};

async function handler(req: express.Request, res: express.Response): Promise<void> {
    try {
        const user = await UserManager.create({
            nickname: req.body.nickname,
            loginData: {
                email: req.body.loginData.email,
                unencryptedPassword: req.body.loginData.password
            }
        });

        logger.info(`Created new user: id=${user.getId()};` +
            `nickname=${req.body.nickname};email=${req.body.loginData.email}`);
        res.send();
    } catch (error) {
        ServerUtils.sendRESTError(res, error);
    }
}

export = route;
