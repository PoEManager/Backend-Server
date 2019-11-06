import express from 'express';

async function handler(req: express.Request, res: express.Response): Promise<void> {
    req.locals.logger.info(`Adding default login to user with ID ${req.user.getId()}.`);
    await req.user.addDefaultLogin(req.body.password);
    req.locals.logger.info('Successfully added default login');
    res.send();
}

export = handler;
