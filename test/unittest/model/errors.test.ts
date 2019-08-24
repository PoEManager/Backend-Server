
import errors from '../../../app/model/Errors';

describe('model', () => {
    describe('errors.ts', () => {
        describe('UserNotFoundError', () => {
            it('should correctly set the properties', () => {
                const error = new errors.UserNotFoundError(5);

                expect(error.name).toBe('USER_NOT_FOUND_ERROR');
                expect(error.message).toContain('5');
                expect(error.data.id).toBe(5);
            });

            it('should correctly generate a REST error', () => {
                const error = new errors.UserNotFoundError(5).asRESTError();

                expect(error.isError).toBeTruthy();
                expect(error.name).toBe('USER_NOT_FOUND_ERROR');
                expect(error.message).toContain('5');
                expect(error.data.id).toBe(5);
            });
        });

        describe('DuplicateEmailError', () => {
            it('should correctly set the properties', () => {
                const error = new errors.DuplicateEmailError('test@test.com');

                expect(error.name).toBe('DUPLICATE_EMAIL_ERROR');
                expect(error.message).toContain('test@test.com');
                expect(error.data.email).toBe('test@test.com');
            });

            it('should correctly generate a REST error', () => {
                const error = new errors.DuplicateEmailError('test@test.com').asRESTError();

                expect(error.isError).toBeTruthy();
                expect(error.name).toBe('DUPLICATE_EMAIL_ERROR');
                expect(error.message).toContain('test@test.com');
                expect(error.data.email).toBe('test@test.com');
            });
        });

        describe('LoginNotFoundError', () => {
            it('should correctly set the properties', () => {
                const error = new errors.LoginNotFoundError(5, errors.LoginNotFoundError.LoginType.DEFAULT);

                expect(error.name).toBe('LOGIN_NOT_FOUND_ERROR');
                expect(error.message).toContain('5');
                expect(error.message).toContain(errors.LoginNotFoundError.LoginType.DEFAULT);
                expect(error.data.id).toBe(5);
                expect(error.data.type).toBe(errors.LoginNotFoundError.LoginType.DEFAULT);
            });

            it('should correctly generate a REST error', () => {
                const error = new errors.LoginNotFoundError(5, errors.LoginNotFoundError.LoginType.DEFAULT)
                    .asRESTError();

                expect(error.isError).toBeTruthy();
                expect(error.name).toBe('LOGIN_NOT_FOUND_ERROR');
                expect(error.message).toContain('5');
                expect(error.message).toContain(errors.LoginNotFoundError.LoginType.DEFAULT);
                expect(error.data.id).toBe(5);
                expect(error.data.type).toBe(errors.LoginNotFoundError.LoginType.DEFAULT);
            });
        });

        describe('DefaultLoginNotFoundError', () => {
            it('should correctly set the properties', () => {
                const error = new errors.DefaultLoginNotFoundError(5);

                expect(error.name).toBe('LOGIN_NOT_FOUND_ERROR');
                expect(error.message).toContain(5);
                expect(error.data.id).toBe(5);
                expect(error.data.type).toBe(errors.LoginNotFoundError.LoginType.DEFAULT);
            });

            it('should correctly generate a REST error', () => {
                const error = new errors.DefaultLoginNotFoundError(5)
                    .asRESTError();

                expect(error.isError).toBeTruthy();
                expect(error.name).toBe('LOGIN_NOT_FOUND_ERROR');
                expect(error.message).toContain(5);
                expect(error.data.id).toBe(5);
                expect(error.data.type).toBe(errors.LoginNotFoundError.LoginType.DEFAULT);
            });
        });

        describe('InvalidChangeIDError', () => {
            it('should correctly set the properties', () => {
                const error = new errors.InvalidChangeIDError('5');

                expect(error.name).toBe('INVALID_CHANGE_ID_ERROR');
                expect(error.message).toContain('5');
                expect(error.data.id).toBe('5');
            });

            it('should correctly generate a REST error', () => {
                const error = new errors.InvalidChangeIDError('5')
                    .asRESTError();

                expect(error.isError).toBeTruthy();
                expect(error.name).toBe('INVALID_CHANGE_ID_ERROR');
                expect(error.message).toContain('5');
                expect(error.data.id).toBe('5');
            });
        });

        describe('InvalidNicknameError', () => {
            it('should correctly set the properties', () => {
                const error = new errors.InvalidNicknameError('nickname');

                expect(error.name).toBe('INVALID_NICKNAME_ERROR');
                expect(error.message).toContain('nickname');
                expect(error.data.nickname).toBe('nickname');
            });

            it('should correctly generate a REST error', () => {
                const error = new errors.InvalidNicknameError('nickname')
                    .asRESTError();

                expect(error.isError).toBeTruthy();
                expect(error.name).toBe('INVALID_NICKNAME_ERROR');
                expect(error.message).toContain('nickname');
                expect(error.data.nickname).toBe('nickname');
            });
        });

        describe('InvalidEmailError', () => {
            it('should correctly set the properties', () => {
                const error = new errors.InvalidEmailError('test@test.com');

                expect(error.name).toBe('INVALID_EMAIL_ERROR');
                expect(error.message).toContain('test@test.com');
                expect(error.data.email).toBe('test@test.com');
            });

            it('should correctly generate a REST error', () => {
                const error = new errors.InvalidEmailError('test@test.com')
                    .asRESTError();

                expect(error.isError).toBeTruthy();
                expect(error.name).toBe('INVALID_EMAIL_ERROR');
                expect(error.message).toContain('test@test.com');
                expect(error.data.email).toBe('test@test.com');
            });
        });
    });
});
