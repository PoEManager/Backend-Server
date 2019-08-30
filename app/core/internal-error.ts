import Error from './error';

/**
 * The base class for all internal errors.
 *
 * The name and message of internal errors are always the same. However, each base class has its own custom data layout.
 */
class InternalError extends Error {
    protected constructor(name: string, data: Error.ICustomErrorData)  {
        super('INTERNAL_ERROR', `Internal error: '${name}' ${JSON.stringify(data)}`, 500, {
            name,
            additional: data
        });
    }

    /**
     * Converts the error into a REST error.
     * This version does not expose any additional data.
     *
     * @returns The REST error.
     */
    public asRESTError(): Error.IRESTError {
        const name = this.name;

        return {
            isError: true,
            name,
            message: 'Internal error.',
            data: {}
        };
    }
}

export = InternalError;
