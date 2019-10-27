import Ajv from 'ajv';
import express from 'express';
import fs from 'fs';
import path from 'path';
import logger from '../core/logger';
import RootDirectory from '../core/root-directory';
import RouteConfiguration from './route-configuration';

/*
ERROR HANDLING:

The error handling in this file is often done via error codes and not regular error objects. This is because the
differentiation between error codes is simpler than the differentiation between regular errors.

The enum 'ErrorCodes' contains all of the error codes.
*/

namespace RouteLoader {
    const ROUTE_DIR = path.join(__dirname, 'routes');
    const ROUTE_DEF_FILE = 'route-definition.json';
    const HANDLER_FILE = 'handler.js';
    const PARAMETER_SCHEMA_FILE = 'parameter.schema.json';
    const QUERY_SCHEMA_FILE = 'query.schema.json';
    const HEADER_SCHEMA_FILE = 'header.schema.json';
    const BODY_SCHEMA_FILE = 'body.schema.json';

    const SCHEMA_ROOT = path.join(RootDirectory.getSync(), 'res', 'schema');
    const ROUTE_DEF_SCHEMA = path.join(SCHEMA_ROOT, 'route-definition.schema.json');

    enum ErrorCodes {
        /**
         * A file is not a regular file.
         */
        IS_NOT_FILE,

        /**
         * `import()` failed.
         */
        COULD_NOT_IMPORT,

        /**
         * An object could not be validated.
         */
        VALIDATION_ERROR,

        /**
         * A file does not exist.
         */
        FILE_NOT_FOUND
    }

    export type RouteHandler = (req: express.Request, res: express.Response) => Promise<void> | void;

    interface IRouteDefinition {
        method: 'GET' | 'POST' | 'PUT' | 'DELETE';
        path: string;
        authorizationLevel: 'NONE' | 'AUTHENTICATED' | 'VERIFIED';
    }

    export interface IRoute extends IRouteDefinition {
        handler: RouteHandler;
        parameterSchema?: object;
        querySchema?: object;
        headerSchema?: object;
        bodySchema?: object;
    }

    function makeError(file: string, code: number): {file: string, code: number} {
        return {
            file,
            code
        };
    }

    /**
     * Similar to fs.readdir(), but returns absolute paths.
     *
     * @param dir The directory to read.
     */
    async function readdir(dir: string): Promise<string[]> {
        const files = fs.readdirSync(dir);

        files.forEach((value, index) => {
            files[index] = path.join(dir, value);
        });

        return files;
    }

    /**
     * Lists all of the route directories (i.e. the child directories of the root route directory).
     */
    async function listRouteDirs(): Promise<string[]> {
        logger.info(`Loading routes from: ${ROUTE_DIR}.`);
        const files = await readdir(ROUTE_DIR);

        // remove unexpected files from list
        files.forEach((file, index) => {
            if (!fs.statSync(files[index]).isDirectory()) {
                logger.warn(`Found unexpected file in route root directory: ${file}.` +
                            `The file will be ignored.`);
                files.slice(index);
            }
        });

        return files;
    }

    /**
     * Generic function to import a file. Finds the file with the name `file` in the array `routeFiles` and imports it.
     *
     * The imported file needs to:
     * - be in `routeFiles`
     * - exist
     * - be a regular file
     *
     * Importing is done via the function `import()`.
     *
     * For error handling, see the top of the file.
     *
     * @param routeFiles All of the files of the route.
     * @param file The name of the schema file. This file needs to be in the array `routeFiles`.
     */
    async function importFile(routeFiles: string[], file: string): Promise<any> {
        let index = 0;

        for (const routeFile of routeFiles) {
            if (path.basename(routeFile) === file) { // correct file was found
                if (!fs.statSync(routeFile).isFile()) {
                    throw makeError(routeFile, ErrorCodes.IS_NOT_FILE);
                }

                try {
                    const ret = await import(routeFile);
                    routeFiles = routeFiles.slice(index);
                    return ret;
                } catch (error) {
                    throw makeError(routeFile, ErrorCodes.COULD_NOT_IMPORT);
                }
            }

            index++;
        }

        throw makeError(file, ErrorCodes.FILE_NOT_FOUND);
    }

    /**
     * Imports and validates the route definition file (route-definition.json).
     *
     * For error handling, see the top of the file.
     *
     * @param routeFiles All of the files of the route.
     */
    async function importRouteDefinition(routeFiles: string[]): Promise<IRouteDefinition> {
        const object = await importFile(routeFiles, ROUTE_DEF_FILE);
        const schema = await import(ROUTE_DEF_SCHEMA);

        const ajv = new Ajv();
        const validate = ajv.compile(schema);
        const valid = validate(object);

        if (!valid) {
            throw makeError(ROUTE_DEF_FILE, ErrorCodes.VALIDATION_ERROR);
        }

        return object as IRouteDefinition;
    }

    /**
     * Imports the route handler file of a route (handler.ts / handler.js).
     *
     * @param routeFiles All of the files of the route.
     */
    async function importHandler(routeFiles: string[]): Promise<{default: RouteHandler}> {
        const object = await importFile(routeFiles, HANDLER_FILE);

        return object as {default: RouteHandler};
    }

    /**
     * Imports and validates a JSON schema.
     *
     * This is used to load parameter-, query-, header- and body schemas.
     *
     * For error handling, see the top of the file.
     *
     * @param routeFiles All of the files of the route.
     * @param file The name of the schema file. This file needs to be in the array `routeFiles`.
     */
    async function importSchema(routeFiles: string[], file: string): Promise<any | undefined> {
        try {
            const object = await importFile(routeFiles, file);

            const ajv = new Ajv();
            const valid = ajv.validateSchema(object);

            if (!valid) {
                throw makeError(file, ErrorCodes.VALIDATION_ERROR);
            }

            return object;
        } catch (error) {
            if (error.code === ErrorCodes.FILE_NOT_FOUND) { // file does not exist; but that is OK for schemas
                return undefined;
            } else {
                throw error;
            }
        }
    }

    /**
     * Loads a single route from a single directory.
     *
     * @param routeDir The directory of the route.
     */
    async function loadRoute(routeDir: string): Promise<IRoute> {
        const routeFiles = await readdir(routeDir);

        const routeDefinition = await importRouteDefinition(routeFiles);
        const handler = await importHandler(routeFiles);
        const parameterSchema = await importSchema(routeFiles, PARAMETER_SCHEMA_FILE);
        const querySchema = await importSchema(routeFiles, QUERY_SCHEMA_FILE);
        const headerSchema = await importSchema(routeFiles, HEADER_SCHEMA_FILE);
        const bodySchema = await importSchema(routeFiles, BODY_SCHEMA_FILE);

        for (const routeFile of routeFiles) {
            if (path.basename(routeFile) !== ROUTE_DEF_FILE && path.basename(routeFile) !== HANDLER_FILE &&
               path.basename(routeFile) !== PARAMETER_SCHEMA_FILE && path.basename(routeFile) !== QUERY_SCHEMA_FILE &&
               path.basename(routeFile) !== HEADER_SCHEMA_FILE && path.basename(routeFile) !== BODY_SCHEMA_FILE) {

                logger.warn(`Found unexpected file in route directory: ${path.relative(routeDir, routeFile)}. ` +
                `The file will be ignored.`);
            }
        }

        return {
            method: routeDefinition.method,
            path: routeDefinition.path,
            authorizationLevel: routeDefinition.authorizationLevel,
            handler: handler.default,
            parameterSchema,
            querySchema,
            headerSchema,
            bodySchema
        };
    }

    /**
     * Loads all of the routes.
     */
    async function loadRoutes(): Promise<IRoute[]> {
        const ret: IRoute[] = [];

        const routes = await listRouteDirs();

        for (const routeDir of routes) {
            logger.info(`Loading route from ${path.join(ROUTE_DIR, routeDir)}.`);
            ret.push(await loadRoute(routeDir));
            logger.info(`Loading route done.`);
        }

        return ret;
    }

    /**
     * Adds all of the routes to the passed router.
     *
     * @param router The router that the routes will be added to.
     */
    export async function addRoutes(router: express.Router) {
        const routes = await loadRoutes();

        for (const route of routes) {
            RouteConfiguration.addRoute(router, route);
            logger.info(`Added route ${route.method} ${route.path}.`);
        }
    }
}

export = RouteLoader;
