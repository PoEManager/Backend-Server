import Error from './error';

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
    export class InvalidEmailConfigurationError extends Error {
        public constructor(name: string) {
            super('INVALID_EMAIL_CONFIGURATION_ERROR',
            `The E-Mail configuration "${name}" is in an invalid format.`, 500, {
                name
            });
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
    export class TemplateCompileError extends Error {
        public constructor(name: string) {
            super('TEMPLATE_COMPILE_ERROR',
            `The HTML template "${name}" could not be compiled.`, 500, {
                name
            });
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
    export class HTMLGenerationError extends Error {
        public constructor(name: string) {
            super('HTML_GENERATION_ERROR',
            `The HTML from the template "${name}" could not be generated.`, 500, {
                name
            });
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
    export class EmailSendError extends Error {
        public constructor(to: string) {
            super('EMAIL_SEND_ERROR',
            `Could not send an E-Mail to "${to}".`, 500, {
                to
            });
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
    export class TypeMismatchError extends Error {
        public constructor(got: string, expected: string) {
            super('TYPE_MISMATCH_ERROR',
            `The types do not match. Got: ${got} Expected: ${expected}`, 500, {
                got,
                expected
            });
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
    export class JSONParseError extends Error {
        public constructor() {
            super('JSON_PARSE_ERROR', `JSON could not be parsed.`, 500, {});
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
    export class FileNotFoundError extends Error {
        public constructor(path: string) {
            super('FILE_NOT_FOUND_ERROR', `File could not be found: ${path}`, 500, {
                path
            });
        }
    }

    /**
     * An object could not be validated.
     *
     * The data layout is the following:
     * ```typescript
     * {
     *     properties: "<wrong properties>",
     *     object: "<invalid object>"
     * }
     * ```
     */
    export class ObjectValidationError extends Error {
        public constructor(messages: string[]) {
            super('OBJECT_VALIDATION_ERROR', `Object could not be validated: ${messages.join('; ')}`, 500, {
                messages
            });
        }
    }

    /**
     * A config meta file could not be located.
     *
     * The data layout is the following:
     * ```typescript
     * {
     *     message: "<message that describes the problem>"
     * }
     * ```
     */
    export class ConfigMetaValidationError extends Error {
        public constructor(messages: string[]) {
            super('CONFIG_META_VALIDATION_ERROR', `config-meta object could not be validated: ${messages.join('; ')}`,
            500, {
                messages
            });
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
    export class ConfigExtensionError extends Error {
        public constructor(dependency: string) {
            super('CONFIG_EXTENSION_ERROR', `Dependency ${dependency} does not exist.`, 500, {
                dependency
            });
        }
    }
}

export = errors;
