import express from 'express';

async function handler(req: express.Request, res: express.Response): Promise<void> {
    req.locals.logger.info(`Removing default login from user with ID ${req.user.getId()}.`);
    await req.user.removeDefaultLogin();
    req.locals.logger.info('Successfully removed default login');
    res.send();
}

export = handler;
