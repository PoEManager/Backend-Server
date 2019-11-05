import express from 'express';

async function handler(req: express.Request, res: express.Response) {
    req.locals.logger.info(`Query E-Mail for user with ID '${req.params.id}'.`);

    const email = await req.user.getEmail();

    req.locals.logger.info('Query successful.');
    res.send({
        email
    });
}

export = handler;
