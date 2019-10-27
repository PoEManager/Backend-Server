import express from 'express';
import config from '../../../core/config';

async function handler(req: express.Request, res: express.Response): Promise<void> {
    const params = Object.keys(req.query);

    res.redirect(`/${config.basic.basePath}/users/${req.locals.user.getId()}?${params.join('&')}`);
}

export = handler;
