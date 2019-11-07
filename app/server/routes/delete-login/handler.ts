import express from 'express';
import SessionTokenManager from '../../../core/session-token-manager';

async function handler(req: express.Request, res: express.Response) {
    req.locals.logger.info(`Logging out user with id ${req.user.getId()}.`);
    await SessionTokenManager.invalidate(req.user);
    req.locals.logger.info(`Logout successful.`);
    res.send();
}

export = handler;
