import express from 'express';

async function handler(req: express.Request, res: express.Response) {
    res.redirect('auth/default/email');
}

export = handler;
