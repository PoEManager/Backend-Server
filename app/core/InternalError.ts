import Error from './Error';

/**
 * The base class for all internal errors.
 *
 * The name and message of internal errors are always the same. However, each base class has its own custom data layout.
 */
class InternalError extends Error {
    protected constructor(data: Error.ICustomErrorData)  {
        super('INTERNAL_ERROR', `Internal error. ${JSON.stringify(data)}`, data);
    }
}

export = InternalError;
