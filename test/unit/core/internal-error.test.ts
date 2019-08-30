import Error from '../../../app/core/error';
import InternalError from '../../../app/core/internal-error';

class TestInternalError extends InternalError {
    public constructor(data: Error.ICustomErrorData) {
        super('TEST_INTERNAL_ERROR', data);
    }
}

describe('core', () => {
    describe('internal-error.ts', () => {
        it('should correctly set the properties', () => {
            const error = new TestInternalError({key: 'value'});

            expect(error.name).toBe('INTERNAL_ERROR');
            expect(error.message).toContain('TEST_INTERNAL_ERROR');
            expect(error.message).toContain('key');
            expect(error.message).toContain('value');
            expect(error.data.name).toBe('TEST_INTERNAL_ERROR');
            expect(error.data.additional.key).toBe('value');
            expect(error.httpCode).toBe(500);
        });

        it('should correctly generate a REST error', () => {
            const error = new TestInternalError({key: 'value'}).asRESTError();

            expect(error.isError).toBeTruthy();
            expect(error.name).toBe('INTERNAL_ERROR');
            expect(error.message).toBe('Internal error.');
            expect(error.data).toEqual({});
        });
    });
});
