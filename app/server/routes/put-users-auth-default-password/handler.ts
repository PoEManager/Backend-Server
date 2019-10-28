import express from 'express';
import EmailManager from '../../../core/email-manager';
import Password from '../../../model/password';

async function handler(req: express.Request, res: express.Response): Promise<void> {
    req.locals.logger.info(`Starting a password change for user with ID ${req.locals.user.getId()}.`);
    const defaultLogin = await req.locals.user.getDefaultLogin();
    await defaultLogin.updatePassword(await Password.encryptPassword(req.body.password));
    await EmailManager.sendPasswordVerificationMail(req.locals.user);
    req.locals.logger.info('Password change initiated.');
    res.send();
}

export = handler;