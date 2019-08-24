import Joi from '@hapi/joi';
import express from 'express';

interface IRouteConfiguration {
    path: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    handler: (req: express.Request, res: express.Response) => Promise<void> | void;
    bodySchema?: Joi.Schema;
    headers?: string[];
    querySchema?: Joi.Schema;
    auth?: boolean;
    verified?: boolean;
}

namespace IRouteConfiguration {
    export function addRoute(router: express.Router, route: IRouteConfiguration): void {
        // todo validators & auth

        if (!route.auth && route.verified) {
            throw new Error('Verification requires authentication');
        }

        switch (route.method) {
            case 'GET':
                router.get(route.path, route.handler);
                break;
            case 'POST':
                router.post(route.path, route.handler);
                break;
            case 'PUT':
                router.put(route.path, route.handler);
                break;
            case 'DELETE':
                router.delete(route.path, route.handler);
                break;
            default:
                throw new Error('Invalid method.');
        }
    }
}

export = IRouteConfiguration;
