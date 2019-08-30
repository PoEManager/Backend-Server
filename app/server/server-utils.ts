
import express from 'express';
import Error from '../core/error';
import InternalError from '../core/internal-error';
import logger from '../core/logger';

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
     * Converts any thrown error into a Error.IRESTError object and sends it to the passed response object.
     *
     * Regular errors (those that inherit from the Error class) will be converted using Error.asRESTError().
     * If other errors are encountered, an instance of UnexpectedError will be used to create the Error.IRESTError
     * object. Additional information about an unexpected error will be logged.
     *
     * @param error The error object that will be converted.
     * @param res The response object to send the error to.
     */
    export function sendRESTError(res: express.Response, error: any): void {
        let e: Error;

        if (error instanceof Error) {
            logger.info('An expected error occurred: ');
            logger.info(`name: ${error.name}`);
            logger.info(`message: ${error.message}`);
            logger.info(`data: ${JSON.stringify(error.data)}`);
            e = error;
        } else {
            logger.info('An unexpected error has occurred in makeRESTError():');
            logger.info(error);
            e = new UnexpectedError();
        }
        res.status(e.httpCode).send(e.asRESTError());
    }
}

export = ServerUtils;
