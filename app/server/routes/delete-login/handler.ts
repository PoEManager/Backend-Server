import express from 'express';

async function handler(req: express.Request, res: express.Response) {
    req.locals.logger.info(`Logging out user with id ${req.user.getId()}.`);
    await req.user.invalidateSessionId();
    req.locals.logger.info(`Logout successful.`);
    res.send();
}

export = handler;
