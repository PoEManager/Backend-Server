import express from 'express';

async function handler(req: express.Request, res: express.Response) {
    req.locals.logger.info(`Querying Google user ID for user with ID '${req.params.id}'.`);

    const googleLogin = await req.user.getGoogleLogin();
    const uid = googleLogin.getGoogleUID();

    req.locals.logger.info('Query successful.');
    res.send({
        uid
    });
}

export = handler;
