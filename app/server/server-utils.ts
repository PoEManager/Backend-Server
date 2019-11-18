
import config from 'cascading-config';
import express from 'express';
import Error from '../core/error';
import InternalError from '../core/internal-error';

namespace ServerUtils {
    /**
     * An internal error that will be used if an unexpected error is encountered in a route.
     *
     * The error contains no additional data, but makeRESTError() will print more information about it.
     */
    export class UnexpectedError extends InternalError {
        public constructor() {
            super('UNEXPECTED_ERROR', {});
        }
    }

    /**
     * Create an error that can be converted to a REST error.
     *
     * @param error The error.
     * @returns The passed error, if it is an instance of `Error`, or `UnexpectedError` if it is not.
     */
    export function makeRESTableError(error: any): Error {
        if (error instanceof Error) {
            return error;
        } else {
            return new UnexpectedError();
        }
    }

    /**
     * Converts any thrown error into a Error.IRESTError object and sends it to the passed response object.
     *
     * Regular errors (those that inherit from the Error class) will be converted using Error.asRESTError().
     * If other errors are encountered, an instance of UnexpectedError will be used to create the Error.IRESTError
     * object. Additional information about an unexpected error will be logged.
     *
     * @param error The error object that will be converted.
     * @param res The response object to send the error to.
     */
    export function sendRESTError(req: express.Request, res: express.Response, error: any): void {
        const e = makeRESTableError(error);

        if (error instanceof Error) {
            if (error instanceof InternalError) {
                req.locals.logger.error('An internal error occurred: ');
                req.locals.logger.error(`name: ${error.name}`);
                req.locals.logger.error(`message: ${error.message}`);
                JSON.stringify(error.data, null, 4).split('\n').forEach(line => {
                    req.locals.logger.info(`data: ${line}`);
                });
            } else {
                req.locals.logger.info('An expected error occurred: ');
                req.locals.logger.info(`name: ${error.name}`);
                req.locals.logger.info(`message: ${error.message}`);
                JSON.stringify(error.data, null, 4).split('\n').forEach(line => {
                    req.locals.logger.info(`data: ${line}`);
                });
            }

        } else {
            req.locals.logger.error('An unexpected error has been caught in makeRESTError():');
            req.locals.logger.error(error);
        }

        res.status(e.httpCode).send(e.asRESTError());
    }

    /**
     * Creates a full route path from a partial path and the base path (defined in config.basic.basePath).
     *
     * @param path The custom part of the route path.
     * @returns The full path.
     */
    export function makeRoutePath(path: string): string {
        return `/${config.basic.basePath}${path}`;
    }
}

export = ServerUtils;
