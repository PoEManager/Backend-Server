
import errors from '../../../app/model/errors';

describe('model', () => {
    describe('errors.ts', () => {
        describe('UserNotFoundError', () => {
            it('should correctly set the properties', () => {
                const error = new errors.UserNotFoundError(5);

                expect(error.name).toBe('USER_NOT_FOUND_ERROR');
                expect(error.message).toContain('5');
                expect(error.data.id).toBe(5);
                expect(error.httpCode).toBe(404);
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
                expect(error.httpCode).toBe(400);
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
                expect(error.httpCode).toBe(404);
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
                expect(error.httpCode).toBe(404);
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

        describe('DefaultLoginNotFoundError', () => {
            it('should correctly set the properties', () => {
                const error = new errors.WalletRestrictionsNotFoundError(5);

                expect(error.name).toBe('WALLET_RESTRICTIONS_NOT_FOUND_ERROR');
                expect(error.message).toContain(5);
                expect(error.data.id).toBe(5);
                expect(error.httpCode).toBe(404);
            });

            it('should correctly generate a REST error', () => {
                const error = new errors.WalletRestrictionsNotFoundError(5)
                    .asRESTError();

                expect(error.isError).toBeTruthy();
                expect(error.name).toBe('WALLET_RESTRICTIONS_NOT_FOUND_ERROR');
                expect(error.message).toContain(5);
                expect(error.data.id).toBe(5);
            });
        });

        describe('InvalidChangeIDError', () => {
            it('should correctly set the properties', () => {
                const error = new errors.InvalidChangeIDError('5');

                expect(error.name).toBe('INVALID_CHANGE_ID_ERROR');
                expect(error.message).toContain('5');
                expect(error.data.id).toBe('5');
                expect(error.httpCode).toBe(404);
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
                expect(error.httpCode).toBe(400);
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
                expect(error.httpCode).toBe(400);
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

        describe('ChangeAlreadyInProgressError', () => {
            it('should correctly set the properties', () => {
                const error = new errors.ChangeAlreadyInProgressError(5);

                expect(error.name).toBe('CHANGE_ALREADY_IN_PROGRESS_ERROR');
                expect(error.message).toContain('5');
                expect(error.data.id).toBe(5);
                expect(error.httpCode).toBe(409);
            });

            it('should correctly generate a REST error', () => {
                const error = new errors.ChangeAlreadyInProgressError(5)
                    .asRESTError();

                expect(error.isError).toBeTruthy();
                expect(error.name).toBe('CHANGE_ALREADY_IN_PROGRESS_ERROR');
                expect(error.message).toContain('5');
                expect(error.data.id).toBe(5);
            });
        });

        describe('UserAlreadyVerifiedError', () => {
            it('should correctly set the properties', () => {
                const error = new errors.UserAlreadyVerifiedError(5);

                expect(error.name).toBe('USER_ALREADY_VERIFIED_ERROR');
                expect(error.message).toContain('5');
                expect(error.data.id).toBe(5);
                expect(error.httpCode).toBe(400);
            });

            it('should correctly generate a REST error', () => {
                const error = new errors.UserAlreadyVerifiedError(5)
                    .asRESTError();

                expect(error.isError).toBeTruthy();
                expect(error.name).toBe('USER_ALREADY_VERIFIED_ERROR');
                expect(error.message).toContain('5');
                expect(error.data.id).toBe(5);
            });
        });

        describe('InvalidChangeState', () => {
            it('should correctly set the properties', () => {
                const error = new errors.InvalidChangeState(null, 5);

                expect(error.name).toBe('INVALID_CHANGE_STATE');
                expect(error.message).toContain('');
                expect(error.data.is).toBeNull();
                expect(error.data.expected).toBe(5);
                expect(error.httpCode).toBe(400);
            });

            it('should correctly generate a REST error', () => {
                const error = new errors.InvalidChangeState(null, 5)
                    .asRESTError();

                expect(error.isError).toBeTruthy();
                expect(error.name).toBe('INVALID_CHANGE_STATE');
                expect(error.message).toContain('');
                expect(error.data.is).toBeNull();
                expect(error.data.expected).toBe(5);
            });
        });
    });
});
