import Joi from '@hapi/joi';
import express from 'express';
import makeBodyValidator from './middleware/body-validator';
import makeHeaderValidator from './middleware/header-validator';
import MiddlewareFunction from './middleware/middleware-function';
import makeQueryValidator from './middleware/query-validator';

interface IRouteConfiguration {
    path: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    handler: (req: express.Request, res: express.Response) => Promise<void> | void;
    querySchema?: Joi.Schema;
    headers?: string[];
    bodySchema?: Joi.Schema;
    auth?: boolean;
    verified?: boolean;
}

namespace IRouteConfiguration {
    export function addRoute(router: express.Router, route: IRouteConfiguration): void {
        // todo auth & verification

        if (!route.auth && route.verified) {
            throw new Error('Verification requires authentication');
        }

        const middleware: MiddlewareFunction[] = [];

        if (route.headers) {
            middleware.push(makeHeaderValidator(route.headers));
        }

        if (route.querySchema) {
            middleware.push(makeQueryValidator(route.querySchema));
        }

        if (route.bodySchema) {
            middleware.push(makeBodyValidator(route.bodySchema));
        }

        switch (route.method) {
            case 'GET':
                router.get(route.path, middleware, route.handler);
                break;
            case 'POST':
                router.post(route.path, middleware, route.handler);
                break;
            case 'PUT':
                router.put(route.path, middleware, route.handler);
                break;
            case 'DELETE':
                router.delete(route.path, middleware, route.handler);
                break;
            default:
                throw new Error('Invalid method.');
        }
    }
}

export = IRouteConfiguration;
