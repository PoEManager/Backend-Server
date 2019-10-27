import express from 'express';

async function handler(req: express.Request, res: express.Response): Promise<void> {
    req.locals.logger.info('User is querying if they are verified.');
    const verified = await req.locals.user.isVerified();
    req.locals.logger.info('Query successful.');
    res.send({verified});
}

export = handler;
