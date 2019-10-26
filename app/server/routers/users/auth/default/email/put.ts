import Joi from '@hapi/joi';
import express from 'express';
import EmailManager from '../../../../../../core/email-manager';
import logger from '../../../../../../core/logger';
import UserManager from '../../../../../../model/user-manager';
import RouteConfiguration from '../../../../../route-configuration';

const route: RouteConfiguration = {
    method: 'PUT',
    path: '/users/auth/default/email',
    auth: true,
    verified: true,
    handler,
    bodySchema: Joi.object({
        email: Joi.string().required()
    })
};

async function handler(req: express.Request, res: express.Response): Promise<void> {
    req.locals.logger.info(`Starting a E-Mail change for user with ID ${req.locals.user.getId()}.`);
    const defaultLogin = await req.locals.user.getDefaultLogin();
    await defaultLogin.updateEMail(req.body.email);
    await EmailManager.sendEmailVerificationMail(req.locals.user);
    req.locals.logger.info('E-Mail change initiated.');
    res.send();
}

export = route;
