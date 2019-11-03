import express from 'express';

async function handler(req: express.Request, res: express.Response) {
    req.locals.logger.info('Querying user wallet restrictions.');
    const walletRestrictions = await req.user.getWalletRestrictions();
    await walletRestrictions.update(req.body); // body is already in the correct format, made sure by schema

    res.send();
}

export = handler;
