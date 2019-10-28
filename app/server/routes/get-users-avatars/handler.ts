import express from 'express';
import config from '../../../core/config';

async function handler(req: express.Request, res: express.Response): Promise<void> {
    const params: string[] = [];

    for (const key in req.query) {
        if (key) {
            params.push(`${key}=${req.query[key]}`);
        }
    }

    res.redirect(`/${config.basic.basePath}/users/avatars/${req.locals.user.getId()}?${params.join('&')}`);
}

export = handler;
