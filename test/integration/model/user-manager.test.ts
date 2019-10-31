
import DatabaseConnection from '../../../app/core/database-connection';
import errors from '../../../app/model/errors';
import Password from '../../../app/model/password';
import UserManager from '../../../app/model/user-manager';

describe('model', () => {
    describe('user-manager.ts', () => {
        beforeEach(async () => {
            await DatabaseConnection.transaction(async conn => {
                await conn.query('DELETE FROM `Users`');
                await conn.query('DELETE FROM `DefaultLogins`');
            });
        });

        afterAll(async () => {
            await DatabaseConnection.transaction(async conn => {
                await conn.query('DELETE FROM `Users`');
            });

            await DatabaseConnection.reset();
        });

        describe('create()', () => {
            it('should correctly create a new user', async () => {
                const user = await UserManager.create({
                    nickname: 'nickname',
                    loginData: {
                        email: 'test@test.com',
                        unencryptedPassword: 'password123'
                    }
                });

                // make sure the user actually exists
                const checkUser = await UserManager.get(user.getId());

                // make sure the IDs match
                expect(user.getId()).toBe(checkUser.getId());
            });

            it('should create different users each time', async () => {
                const user1 = await UserManager.create({
                    nickname: 'nickname1',
                    loginData: {
                        email: 'test1@test.com',
                        unencryptedPassword: 'password123'
                    }
                });

                const user2 = await UserManager.create({
                    nickname: 'nickname2',
                    loginData: {
                        email: 'test2@test.com',
                        unencryptedPassword: 'password123'
                    }
                });

                expect(user1.getId()).not.toBe(user2.getId());
            });

            describe('nicknames', () => {
                it('should reject nicknames with spaces', async () => {
                    const createData = {
                        nickname: 'nick name',
                        loginData: {
                            email: 'test@test.com',
                            unencryptedPassword: 'password123'
                        }
                    };

                    await expect(UserManager.create(createData))
                        .rejects.toEqual(new errors.InvalidNicknameError(createData.nickname));
                });

                it('should reject nicknames with a special character', async () => {
                    const createData = {
                        nickname: 'nick\u0015name',
                        loginData: {
                            email: 'test@test.com',
                            unencryptedPassword: 'password123'
                        }
                    };

                    await expect(UserManager.create(createData))
                        .rejects.toEqual(new errors.InvalidNicknameError(createData.nickname));
                });

                it('should reject nicknames with a line break', async () => {
                    const createData = {
                        nickname: 'nick\nname',
                        loginData: {
                            email: 'test@test.com',
                            unencryptedPassword: 'password123'
                        }
                    };

                    await expect(UserManager.create(createData))
                        .rejects.toEqual(new errors.InvalidNicknameError(createData.nickname));
                });

                it('should reject short nicknames', async () => {
                    const createData = {
                        nickname: 'nick',
                        loginData: {
                            email: 'test@test.com',
                            unencryptedPassword: 'password123'
                        }
                    };

                    await expect(UserManager.create(createData))
                        .rejects.toEqual(new errors.InvalidNicknameError(createData.nickname));
                });

                it('should reject long nicknames', async () => {
                    const createData = {
                        nickname: 'this-is-an-incredibly-long-nickname',
                        loginData: {
                            email: 'test@test.com',
                            unencryptedPassword: 'password123'
                        }
                    };

                    await expect(UserManager.create(createData))
                        .rejects.toEqual(new errors.InvalidNicknameError(createData.nickname));
                });
            });

            describe('emails', () => {
                it('should reject invalid E-Mails', async () => {
                    const createData = {
                        nickname: 'nickname',
                        loginData: {
                            email: 'invalid',
                            unencryptedPassword: 'password123'
                        }
                    };

                    await expect(UserManager.create(createData))
                        .rejects.toEqual(new errors.InvalidEmailError(createData.loginData.email));
                });

                it('should reject duplicate E-Mails', async () => {
                    const createData1 = {
                        nickname: 'nickname',
                        loginData: {
                            email: 'test@test.com',
                            unencryptedPassword: 'password123'
                        }
                    };

                    await expect(UserManager.create(createData1)).resolves.not.toBeNull();

                    const createData2 = {
                        nickname: 'nickname',
                        loginData: {
                            email: 'test@test.com',
                            unencryptedPassword: 'password123'
                        }
                    };

                    await expect(UserManager.create(createData2))
                        .rejects.toEqual(new errors.DuplicateEmailError(createData2.loginData.email));
                });
            });
        });

        describe('get()', () => {
            it('should return the correct user if it exists', async () => {
                const user = await UserManager.create({
                    nickname: 'nickname',
                    loginData: {
                        email: 'test@test.com',
                        unencryptedPassword: 'password'
                    }
                });

                await expect(user.getId()).toBe((await UserManager.get(user.getId())).getId());
            });

            it('should throw if the user does not exist', async () => {
                await expect(UserManager.get(-1)).rejects.toEqual(new errors.UserNotFoundError(-1));
            });
        });

        describe('getDefaultLogin()', () => {
            it('should return the correct login if it exists', async () => {
                const user = await UserManager.create({
                    nickname: 'nickname',
                    loginData: {
                        email: 'test@test.com',
                        unencryptedPassword: 'password'
                    }
                });

                const login = await user.getDefaultLogin();
                const checkLogin = await UserManager.getDefaultLogin(login.getId());

                await expect(login.getId()).toBe(checkLogin.getId());
            });

            it('should throw if the login does not exist', async () => {
                await expect(UserManager.getDefaultLogin(-1)).rejects.toEqual(new errors.DefaultLoginNotFoundError(-1));
            });
        });

        describe('searchForUserWithEmail()', () => {
            it('should return the correct user if it exists', async () => {
                const user = await UserManager.create({
                    nickname: 'nickname',
                    loginData: {
                        email: 'test@test.com',
                        unencryptedPassword: 'password'
                    }
                });

                const testUser = await UserManager.searchForUserWithEmail('test@test.com');

                expect(testUser.getId()).toBe(user.getId());
            });

            it('should throw if the user does not exist', async () => {
                await expect(UserManager.searchForUserWithEmail('invalid email'))
                    .rejects.toEqual(new errors.InvalidCredentialsError());
            });
        });

        describe('validateChange()', () => {
            it('should correctly validate a verification change', async () => {
                const user = await UserManager.create({
                    nickname: 'nickname',
                    loginData: {
                        email: 'test@test.com',
                        unencryptedPassword: 'password'
                    }
                });

                await expect(user.isVerified()).resolves.toBeFalsy();
                await expect(UserManager.validateChange(await user.getChangeUID() as string)).resolves.toBeUndefined();
                await expect(user.isVerified()).resolves.toBeTruthy();
                await expect(user.getChangeState()).resolves.toBeNull();
            });

            it('should correctly validate an E-Mail change', async () => {
                const user = await UserManager.create({
                    nickname: 'nickname',
                    loginData: {
                        email: 'test@test.com',
                        unencryptedPassword: 'password'
                    }
                });

                await UserManager.validateChange(await user.getChangeUID() as string);

                const login = await user.getDefaultLogin();

                await expect(login.updateEMail('test1@test.com')).resolves.toBeDefined();
                await expect(UserManager.validateChange(await user.getChangeUID() as string)).resolves.toBeUndefined();
                await expect(login.getEmail()).resolves.toBe('test1@test.com');
            });

            it('should correctly validate a password change', async () => {
                const user = await UserManager.create({
                    nickname: 'nickname',
                    loginData: {
                        email: 'test@test.com',
                        unencryptedPassword: 'password'
                    }
                });

                await UserManager.validateChange(await user.getChangeUID() as string);

                const login = await user.getDefaultLogin();

                const password = await Password.encryptPassword('abc');
                await expect(login.updatePassword(password)).resolves.toBeDefined();
                await expect(UserManager.validateChange(await user.getChangeUID() as string)).resolves.toBeUndefined();
                const newPw = await login.getPassword();
                expect(newPw.getEncrypted()).toBe(password.getEncrypted());
            });

            it('should throw if the change ID is invalid', async () => {
                await expect(UserManager.validateChange('id')).rejects.toEqual(new errors.InvalidChangeIDError('id'));
            });
        });

        describe('getUserFromChangeId()', () => {
            it('should return the correct user if it exists', async () => {
                const user = await UserManager.create({
                    nickname: 'nickname',
                    loginData: {
                        email: 'test@test.com',
                        unencryptedPassword: 'password'
                    }
                });

                const changeUID = await user.getChangeUID();

                const testUser = await UserManager.getUserFromChangeId(changeUID!);

                expect(testUser.getId()).toBe(user.getId());
            });

            it('should throw if the user does not exist', async () => {
                await expect(UserManager.getUserFromChangeId('invalid-change-id'))
                    .rejects.toEqual(new errors.InvalidChangeIDError('invalid-change-id'));
            });
        });
    });
});
