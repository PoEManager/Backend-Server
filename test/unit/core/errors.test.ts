
import errors from '../../../app/core/errors';

describe('core', () => {
    describe('errors.ts', () => {
        describe('InvalidEmailConfigurationError', () => {
            it('should correctly set the properties', () => {
                const error = new errors.InvalidEmailConfigurationError('name');

                expect(error.name).toBe('INTERNAL_ERROR');
                expect(error.message).toContain('name');
                expect(error.data.name).toBe('INVALID_EMAIL_CONFIGURATION_ERROR');
                expect(error.data.additional.name).toBe('name');
                expect(error.httpCode).toBe(500);
            });

            it('should correctly generate a REST error', () => {
                const error = new errors.InvalidEmailConfigurationError('name').asRESTError();

                expect(error.isError).toBeTruthy();
                expect(error.name).toBe('INTERNAL_ERROR');
                expect(error.message).toBe('Internal error.');
                expect(error.data).toEqual({});
            });
        });

        describe('TemplateCompileError', () => {
            it('should correctly set the properties', () => {
                const error = new errors.TemplateCompileError('name');

                expect(error.name).toBe('INTERNAL_ERROR');
                expect(error.message).toContain('name');
                expect(error.data.name).toBe('TEMPLATE_COMPILE_ERROR');
                expect(error.data.additional.name).toBe('name');
                expect(error.httpCode).toBe(500);
            });

            it('should correctly generate a REST error', () => {
                const error = new errors.TemplateCompileError('name').asRESTError();

                expect(error.isError).toBeTruthy();
                expect(error.name).toBe('INTERNAL_ERROR');
                expect(error.message).toBe('Internal error.');
                expect(error.data).toEqual({});
            });
        });

        describe('HTMLGenerationError', () => {
            it('should correctly set the properties', () => {
                const error = new errors.HTMLGenerationError('name');

                expect(error.name).toBe('INTERNAL_ERROR');
                expect(error.message).toContain('name');
                expect(error.data.name).toBe('HTML_GENERATION_ERROR');
                expect(error.data.additional.name).toBe('name');
                expect(error.httpCode).toBe(500);
            });

            it('should correctly generate a REST error', () => {
                const error = new errors.HTMLGenerationError('name').asRESTError();

                expect(error.isError).toBeTruthy();
                expect(error.name).toBe('INTERNAL_ERROR');
                expect(error.message).toBe('Internal error.');
                expect(error.data).toEqual({});
            });
        });

        describe('EmailSendError', () => {
            it('should correctly set the properties', () => {
                const error = new errors.EmailSendError('to');

                expect(error.name).toBe('INTERNAL_ERROR');
                expect(error.message).toContain('to');
                expect(error.data.name).toBe('EMAIL_SEND_ERROR');
                expect(error.data.additional.to).toBe('to');
                expect(error.httpCode).toBe(500);
            });

            it('should correctly generate a REST error', () => {
                const error = new errors.EmailSendError('to').asRESTError();

                expect(error.isError).toBeTruthy();
                expect(error.name).toBe('INTERNAL_ERROR');
                expect(error.message).toBe('Internal error.');
                expect(error.data).toEqual({});
            });
        });

        describe('TypeMismatchError', () => {
            it('should correctly set the properties', () => {
                const error = new errors.TypeMismatchError('got', 'expected');

                expect(error.name).toBe('INTERNAL_ERROR');
                expect(error.message).toContain('got');
                expect(error.message).toContain('expected');
                expect(error.data.name).toBe('TYPE_MISMATCH_ERROR');
                expect(error.data.additional.got).toBe('got');
                expect(error.data.additional.expected).toBe('expected');
                expect(error.httpCode).toBe(500);
            });

            it('should correctly generate a REST error', () => {
                const error = new errors.TypeMismatchError('got', 'expected').asRESTError();

                expect(error.isError).toBeTruthy();
                expect(error.name).toBe('INTERNAL_ERROR');
                expect(error.message).toBe('Internal error.');
                expect(error.data).toEqual({});
            });
        });

        describe('JSONParseError', () => {
            it('should correctly set the properties', () => {
                const error = new errors.JSONParseError();

                expect(error.name).toBe('INTERNAL_ERROR');
                expect(error.message).toContain('');
                expect(error.data.name).toBe('JSON_PARSE_ERROR');
                expect(error.data.additional).toEqual({});
                expect(error.httpCode).toBe(500);
            });

            it('should correctly generate a REST error', () => {
                const error = new errors.JSONParseError().asRESTError();

                expect(error.isError).toBeTruthy();
                expect(error.name).toBe('INTERNAL_ERROR');
                expect(error.message).toBe('Internal error.');
                expect(error.data).toEqual({});
            });
        });

        describe('FileNotFoundError', () => {
            it('should correctly set the properties', () => {
                const error = new errors.FileNotFoundError('path');

                expect(error.name).toBe('INTERNAL_ERROR');
                expect(error.message).toContain('path');
                expect(error.data.name).toBe('FILE_NOT_FOUND_ERROR');
                expect(error.data.additional.path).toBe('path');
                expect(error.httpCode).toBe(500);
            });

            it('should correctly generate a REST error', () => {
                const error = new errors.FileNotFoundError('path').asRESTError();

                expect(error.isError).toBeTruthy();
                expect(error.name).toBe('INTERNAL_ERROR');
                expect(error.message).toBe('Internal error.');
                expect(error.data).toEqual({});
            });
        });

        describe('ObjectValidationError', () => {
            it('should correctly set the properties', () => {
                const error = new errors.ObjectValidationError(['msg1', 'msg2']);

                expect(error.name).toBe('INTERNAL_ERROR');
                expect(error.message).toContain('msg1');
                expect(error.message).toContain('msg2');
                expect(error.data.name).toBe('OBJECT_VALIDATION_ERROR');
                expect(error.data.additional.messages).toEqual(['msg1', 'msg2']);
                expect(error.httpCode).toBe(500);
            });

            it('should correctly generate a REST error', () => {
                const error = new errors.ObjectValidationError(['msg1', 'msg2']).asRESTError();

                expect(error.isError).toBeTruthy();
                expect(error.name).toBe('INTERNAL_ERROR');
                expect(error.message).toBe('Internal error.');
                expect(error.data).toEqual({});
            });
        });

        describe('ConfigMetaValidationError', () => {
            it('should correctly set the properties', () => {
                const error = new errors.ConfigMetaValidationError(['msg1', 'msg2']);

                expect(error.name).toBe('INTERNAL_ERROR');
                expect(error.message).toContain('msg1');
                expect(error.message).toContain('msg2');
                expect(error.data.name).toBe('CONFIG_META_VALIDATION_ERROR');
                expect(error.data.additional.messages).toEqual(['msg1', 'msg2']);
                expect(error.httpCode).toBe(500);
            });

            it('should correctly generate a REST error', () => {
                const error = new errors.ConfigMetaValidationError(['msg1', 'msg2']).asRESTError();

                expect(error.isError).toBeTruthy();
                expect(error.name).toBe('INTERNAL_ERROR');
                expect(error.message).toBe('Internal error.');
                expect(error.data).toEqual({});
            });
        });

        describe('ConfigExtensionError', () => {
            it('should correctly set the properties', () => {
                const error = new errors.ConfigExtensionError('dependency');

                expect(error.name).toBe('INTERNAL_ERROR');
                expect(error.message).toContain('dependency');
                expect(error.data.name).toBe('CONFIG_EXTENSION_ERROR');
                expect(error.data.additional.dependency).toBe('dependency');
                expect(error.httpCode).toBe(500);
            });

            it('should correctly generate a REST error', () => {
                const error = new errors.ConfigExtensionError('dependency').asRESTError();

                expect(error.isError).toBeTruthy();
                expect(error.name).toBe('INTERNAL_ERROR');
                expect(error.message).toBe('Internal error.');
                expect(error.data).toEqual({});
            });
        });
    });
});
