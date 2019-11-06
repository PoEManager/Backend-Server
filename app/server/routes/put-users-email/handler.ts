import express from 'express';

async function handler(req: express.Request, res: express.Response): Promise<void> {
    res.redirect('auth/default/email');
}

export = handler;
