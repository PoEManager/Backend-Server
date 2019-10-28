import Ajv from 'ajv';
import _ from 'lodash';
import Error from './error';
import InternalError from './internal-error';

namespace errors {

    /**
     * An email configuration is in an invalid format.
     *
     * The data layout is the following:
     * ```typescript
     * {
     *     name: "<configuration name>"
     * }
     * ```
     */
    export class InvalidEmailConfigurationError extends InternalError {
        public constructor(name: string) {
            super('INVALID_EMAIL_CONFIGURATION_ERROR', { name });
        }
    }

    /**
     * A HTML template could not be compiled.
     *
     * The data layout is the following:
     * ```typescript
     * {
     *     name: "<template name>"
     * }
     * ```
     */
    export class TemplateCompileError extends InternalError {
        public constructor(name: string) {
            super('TEMPLATE_COMPILE_ERROR', { name });
        }
    }

    /**
     * A HTML could not be generated.
     *
     * The data layout is the following:
     * ```typescript
     * {
     *     name: "<template name>"
     * }
     * ```
     */
    export class HTMLGenerationError extends InternalError {
        public constructor(name: string) {
            super('HTML_GENERATION_ERROR', { name });
        }
    }

    /**
     * Could not send an E-Mail.
     *
     * The data layout is the following:
     * ```typescript
     * {
     *     to: "<recipient E-Mail>"
     * }
     * ```
     */
    export class EmailSendError extends InternalError {
        public constructor(to: string) {
            super('EMAIL_SEND_ERROR', { to });
        }
    }

    /**
     * Types do not match.
     *
     * The data layout is the following:
     * ```typescript
     * {
     *     got: "<gotten type>",
     *     expected: "<expected type>"
     * }
     * ```
     */
    export class TypeMismatchError extends InternalError {
        public constructor(got: string, expected: string) {
            super('TYPE_MISMATCH_ERROR', { got, expected });
        }
    }

    /**
     * A string could not be parsed into JSON.
     *
     * The data layout is the following:
     * ```typescript
     * {
     *
     * }
     * ```
     */
    export class JSONParseError extends InternalError {
        public constructor() {
            super('JSON_PARSE_ERROR', {});
        }
    }

    /**
     * A file could not be located.
     *
     * The data layout is the following:
     * ```typescript
     * {
     *     path: "<path to the file>"
     * }
     * ```
     */
    export class FileNotFoundError extends InternalError {
        public constructor(path: string) {
            super('FILE_NOT_FOUND_ERROR', { path });
        }
    }

    /**
     * An object could not be validated.
     *
     * The data layout is the following:
     * ```typescript
     * {
     *     messages: [
     *         "<error messages>"
     *     ]
     *     schema: "<the schema that was not met>",
     *     object: "<invalid object>"
     * }
     * ```
     */
    export class InternalObjectValidationError extends InternalError {
        public constructor(messagesOrErrors: string[] | Ajv.ErrorObject[], schema?: object, object?: any) {
            if (messagesOrErrors.length >= 1) {
                if (typeof messagesOrErrors[0] === 'string') {
                    super('INTERNAL_OBJECT_VALIDATION_ERROR', { messages: messagesOrErrors, schema, object });
                } else {
                    const errorsArray = messagesOrErrors as Ajv.ErrorObject[];
                    const messages = _.filter(_.map(errorsArray, e => e.message), m => m !== undefined);

                    super('INTERNAL_OBJECT_VALIDATION_ERROR', { messages, schema, object });
                }
            } else {
                super('INTERNAL_OBJECT_VALIDATION_ERROR', { messages: [], schema, object });
            }
        }
    }

    /**
     * A config meta file could not be located.
     *
     * The data layout is the following:
     * ```typescript
     * {
     *     messages: [
     *         "<error messages>"
     *     ]
     *     schema: "<the schema that is invalid>"
     * }
     * ```
     */
    export class InternalConfigMetaValidationError extends InternalError {
        public constructor(messagesOrErrors: string[] | Ajv.ErrorObject[], schema?: object) {
            if (messagesOrErrors.length >= 1) {
                if (typeof messagesOrErrors[0] === 'string') {
                    super('INTERNAL_CONFIG_META_VALIDATION_ERROR', { messages: messagesOrErrors, schema });
                } else {
                    const errorsArray = messagesOrErrors as Ajv.ErrorObject[];
                    const messages = _.filter(_.map(errorsArray, e => e.message), m => m !== undefined);

                    super('INTERNAL_CONFIG_META_VALIDATION_ERROR', { messages, schema });
                }
            } else {
                super('INTERNAL_CONFIG_META_VALIDATION_ERROR', { messages: [], schema });
            }
        }
    }

    /**
     * A config dependency does not exist.
     *
     * The data layout is the following:
     * ```typescript
     * {
     *     dependency: "<the invalid dependency>"
     * }
     * ```
     */
    export class ConfigExtensionError extends InternalError {
        public constructor(dependency: string) {
            super('CONFIG_EXTENSION_ERROR', { dependency });
        }
    }

    /**
     * An object could not be validated.
     *
     * The data layout is the following:
     * ```typescript
     * {
     *     messages: [
     *         "<error messages>"
     *     ]
     *     schema: "<the schema that was not met>",
     *     object: "<invalid object>"
     * }
     * ```
     */

    export class ObjectValidationError extends Error {
        public constructor(messages: string[], schema: object, object: any);

        public constructor(ajv: Ajv.Ajv);

        public constructor(messagesOrAjv: string[] | Ajv.Ajv, schema?: object, object?: any) {
            if (messagesOrAjv instanceof Ajv) {
                const messages = _.filter(_.map(messagesOrAjv.errors, e => e.message), m => m !== undefined);

                super('OBJECT_VALIDATION_ERROR', 'An object cloud not be validated.', 400, {
                    messages,
                    schema,
                    object
                });
            } else {
                super('OBJECT_VALIDATION_ERROR', 'An object cloud not be validated.', 400, {
                    messages: messagesOrAjv,
                    schema,
                    object
                });
            }
        }
    }
}

export = errors;
