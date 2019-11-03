import express from 'express';
import config from '../../../core/config';
import ServerUtils from '../../server-utils';

async function handler(req: express.Request, res: express.Response): Promise<void> {
    const params: string[] = [];

    for (const key in req.query) {
        if (key) {
            params.push(`${key}=${req.query[key]}`);
        }
    }

    res.redirect(ServerUtils.makeRoutePath(`/users/avatars/${req.user.getId()}?${params.join('&')}`));
}

export = handler;
