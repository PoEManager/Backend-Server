import express from 'express';
import makeAuth from './middleware/auth';
import makeBodyValidator from './middleware/body-validator';
import makeHeaderValidator from './middleware/header-validator';
import makeIsVerified from './middleware/is-verified';
import MiddlewareFunction from './middleware/middleware-function';
import makeParameterValidator from './middleware/parameter-validator';
import makeQueryValidator from './middleware/query-validator';
import RouteLoader from './route-loader';
import ServerUtils from './server-utils';

namespace IRouteConfiguration {
    function genRouteWrapper(handler: RouteLoader.RouteHandler): RouteLoader.RouteHandler {
        return async (req, res) => {
            try {
                await handler(req, res);
            } catch (error) {
                ServerUtils.sendRESTError(req, res, error);
            }
        };
    }

    export function addRoute(router: express.Router, route: RouteLoader.IRoute): void {
        const middleware: MiddlewareFunction[] = [];

        if (route.authorizationLevel === 'AUTHORIZED' || route.authorizationLevel === 'VERIFIED') {
            middleware.push(makeAuth());
        }

        if (route.authorizationLevel === 'VERIFIED') {
            middleware.push(makeIsVerified());
        }

        if (route.parameterSchema) {
            middleware.push(makeParameterValidator(route.parameterSchema));
        }

        if (route.headerSchema) {
            middleware.push(makeHeaderValidator(route.headerSchema));
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
