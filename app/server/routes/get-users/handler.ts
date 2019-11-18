import express from 'express';
import ServerUtils from '../../server-utils';

async function handler(req: express.Request, res: express.Response): Promise<void> {
    const params = Object.keys(req.query);

    res.redirect(ServerUtils.makeRoutePath(`/users/${req.user.getId()}?${params.join('&')}`));
}

export = handler;
