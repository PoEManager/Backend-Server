import express from 'express';

async function handler(req: express.Request, res: express.Response) {
    req.locals.logger.info(`Querying logins for user with ID '${req.params.id}'.`);

    const result = {
        default: await req.user.hasDefaultLogin(),
        google: await req.user.hasGoogleLogin()
    };
    req.locals.logger.info('Query successful.');

    res.send(result);
}

export = handler;
