
/**
 * The base class of all errors used by this server.
 *
 * Instances of this class can be converted to standardized error object that are meant to be used by REST API
 * endpoints.
 */
class Error {
    /**
     * The name of the error. This name is constant for each instance of a child class.
     */
    public readonly name: string;

    /**
     * A message that may (or may not) be specific to a specific instance.
     */
    public readonly message: string;

    /**
     * Any data that gives further information about the error.
     *
     * The layout of this object is defined by each child class (but remains the same for each instance of the child
     * class).
     */
    public readonly data: Error.ICustomErrorData;

    /**
     * Constructs a new instance.
     *
     * @param name The name of the error.
     * @param message The message of the error.
     * @param data The additional data of the error.
     */
    protected constructor(name: string, message: string, data: Error.ICustomErrorData) {
        this.name = name;
        this.message = message;
        this.data = data;
    }

    /**
     * Converts the error into a REST error.
     */
    public asRESTError(): Error.IRESTError {
        return {
            isError: true,
            name: this.name,
            message: this.message,
            data: this.data
        };
    }
}

namespace Error {
    /**
     * A standardized layout for errors. This layout is used to send errors via REST API endpoints.
     *
     * The fields 'name', 'message', 'data' have the same values as their respective fields in the regular 'Error'
     * class.
     */
    export interface IRESTError {
        /**
         * Always true. This field can be used to identify an error object as such.
         */
        readonly isError: boolean;

        /**
         * The name of the error.
         */
        readonly name: string;

        /**
         * The message of the error.
         */
        readonly message: string;

        /**
         * The additional data.
         */
        readonly data: ICustomErrorData;
    }

    /**
     * An object type that can contain any data.
     */
    export interface ICustomErrorData {
        [key: string]: any;
    }
}

export = Error;
