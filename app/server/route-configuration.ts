import Joi from '@hapi/joi';
import express from 'express';
import makeAuth from './middleware/auth';
import makeBodyValidator from './middleware/body-validator';
import makeHeaderValidator from './middleware/header-validator';
import MiddlewareFunction from './middleware/middleware-function';
import makeQueryValidator from './middleware/query-validator';
import ServerUtils from './server-utils';

type RouteHandler = (req: express.Request, res: express.Response) => Promise<void> | void;

interface IRouteConfiguration {
    path: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    handler: RouteHandler;
    querySchema?: Joi.Schema;
    headers?: string[];
    bodySchema?: Joi.Schema;
    auth?: boolean;
    verified?: boolean;
}

namespace IRouteConfiguration {
    function genRouteWrapper(handler: RouteHandler): RouteHandler {
        return async (req, res) => {
            try {
                await handler(req, res);
            } catch (error) {
                ServerUtils.sendRESTError(req, res, error);
            }
        };
    }

    export function addRoute(router: express.Router, route: IRouteConfiguration): void {
        // todo auth & verification

        if (!route.auth && route.verified) {
            throw new Error('Verification requires authentication');
        }

        const middleware: MiddlewareFunction[] = [];

        if (route.auth) {
            middleware.push(makeAuth());
        }

        if (route.headers) {
            middleware.push(makeHeaderValidator(route.headers));
        }

        if (route.querySchema) {
            middleware.push(makeQueryValidator(route.querySchema));
        }

        if (route.bodySchema) {
            middleware.push(makeBodyValidator(route.bodySchema));
        }

        const handler = genRouteWrapper(route.handler);

        switch (route.method) {
            case 'GET':
                router.get(route.path, middleware, handler);
                break;
            case 'POST':
                router.post(route.path, middleware, handler);
                break;
            case 'PUT':
                router.put(route.path, middleware, handler);
                break;
            case 'DELETE':
                router.delete(route.path, middleware, handler);
                break;
            default:
                throw new Error('Invalid method.');
        }
    }
}

export = IRouteConfiguration;
