import base64url from 'base64-url';
import express from 'express';
import User from '../../../model/user';
import UserManager from '../../../model/user-manager';

async function handler(req: express.Request, res: express.Response): Promise<void> {
    req.locals.logger.info('Validating user change.');

    const changeId = base64url.unescape(req.params.changeId);

    const user = await UserManager.getUserFromChangeId(changeId);
    const state = await user.getChangeState();

    await UserManager.validateChange(changeId);

    if (state === User.ChangeType.NEW_EMAIL || state === User.ChangeType.NEW_PASSWORD) {
        await user.invalidateSessionId();
    }

    req.locals.logger.info('User change validation successful.');
    res.send();
}

export = handler;
