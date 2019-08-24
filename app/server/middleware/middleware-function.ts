import express from 'express';

type MiddlewareFunction = (req: express.Request, res: express.Response, next: express.NextFunction)
    => Promise<void> | void;

export = MiddlewareFunction;
