import express from 'express';
import SessionTokenManager from '../../../core/session-token-manager';
import RouteConfiguration from '../../route-configuration';

async function handler(req: express.Request, res: express.Response) {
    req.locals.logger.info(`Logging out user with id ${req.locals.user.getId()}.`);
    await SessionTokenManager.invalidate(req.header('x-auth-token')!); // always defined, b/c auth is required
    req.locals.logger.info(`Logout successful.`);
    res.send();
}

export = handler;
