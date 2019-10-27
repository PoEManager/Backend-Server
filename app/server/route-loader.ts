import Ajv from 'ajv';
import express from 'express';
import fs from 'fs';
import path from 'path';
import logger from '../core/logger';
import RootDirectory from '../core/root-directory';
import RouteConfiguration from './route-configuration';

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
        IS_DIRECTORY,
        COULD_NOT_IMPORT,
        VALIDATION_ERROR,
        FILE_NOT_FOUND
    }

    export type RouteHandler = (req: express.Request, res: express.Response) => Promise<void> | void;

    interface IRouteDefinition {
        method: 'GET' | 'POST' | 'PUT' | 'DELETE';
        path: string;
        authorizationLevel: 'NONE' | 'AUTHORIZED' | 'VERIFIED';
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

    async function readdir(dir: string): Promise<string[]> {
        const files = fs.readdirSync(dir);

        files.forEach((value, index) => {
            files[index] = path.join(dir, value);
        });

        return files;
    }

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

    async function importFile(routeFiles: string[], file: string): Promise<any> {
        let index = 0;

        for (const routeFile of routeFiles) {
            if (path.basename(routeFile) === file) { // correct file was found
                if (!fs.statSync(routeFile).isFile()) {
                    throw makeError(routeFile, ErrorCodes.IS_DIRECTORY);
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

    async function importHandler(routeFiles: string[]): Promise<{default: RouteHandler}> {
        const object = await importFile(routeFiles, HANDLER_FILE);

        return object as {default: RouteHandler};
    }

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

    export async function addRoutes(router: express.Router) {
        const routes = await loadRoutes();

        for (const route of routes) {
            RouteConfiguration.addRoute(router, route);
            logger.info(`Added route ${route.method} ${route.path}.`);
        }
    }
}

export = RouteLoader;
