import express from 'express';

async function handler(req: express.Request, res: express.Response): Promise<void> {
    req.locals.logger.info(`Removing Google login from user with ID ${req.user.getId()}.`);
    await req.user.removeGoogleLogin();
    req.locals.logger.info('Successfully removed Google login');
    res.send();
}

export = handler;
