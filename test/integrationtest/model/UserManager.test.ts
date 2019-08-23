
import DatabaseConnection from '../../../app/core/DatabaseConnection';
import errors from '../../../app/model/Errors';
import UserManager from '../../../app/model/UserManager';

describe('model', () => {
    beforeEach(async () => {
        await DatabaseConnection.transaction(async conn => {
            await conn.query('DELETE FROM `Users`');
            await conn.query('DELETE FROM `DefaultLogins`');
        });
    });

    afterAll(async () => {
        await DatabaseConnection.reset();
    });

    describe('UserManager.ts', () => {
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

                    // tslint:disable:no-floating-promises
                    expect(UserManager.create(createData))
                        .rejects.toEqual(new errors.InvalidNicknameError(createData.nickname));
                    // tslint:enable
                });

                it('should reject nicknames with a special character', async () => {
                    const createData = {
                        nickname: 'nick\u0015name',
                        loginData: {
                            email: 'test@test.com',
                            unencryptedPassword: 'password123'
                        }
                    };

                    // tslint:disable:no-floating-promises
                    await expect(UserManager.create(createData))
                        .rejects.toEqual(new errors.InvalidNicknameError(createData.nickname));
                    // tslint:enable
                });

                it('should reject nicknames with a line break', async () => {
                    const createData = {
                        nickname: 'nick\nname',
                        loginData: {
                            email: 'test@test.com',
                            unencryptedPassword: 'password123'
                        }
                    };

                    // tslint:disable:no-floating-promises
                    await expect(UserManager.create(createData))
                        .rejects.toEqual(new errors.InvalidNicknameError(createData.nickname));
                    // tslint:enable
                });

                it('should reject short nicknames', async () => {
                    const createData = {
                        nickname: 'nick',
                        loginData: {
                            email: 'test@test.com',
                            unencryptedPassword: 'password123'
                        }
                    };

                    // tslint:disable:no-floating-promises
                    await expect(UserManager.create(createData))
                        .rejects.toEqual(new errors.InvalidNicknameError(createData.nickname));
                    // tslint:enable
                });

                it('should reject long nicknames', async () => {
                    const createData = {
                        nickname: 'this-is-an-incredibly-long-nickname',
                        loginData: {
                            email: 'test@test.com',
                            unencryptedPassword: 'password123'
                        }
                    };

                    // tslint:disable:no-floating-promises
                    await expect(UserManager.create(createData))
                        .rejects.toEqual(new errors.InvalidNicknameError(createData.nickname));
                    // tslint:enable
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

                    // tslint:disable:no-floating-promises
                    await expect(UserManager.create(createData))
                        .rejects.toEqual(new errors.InvalidEmailError(createData.loginData.email));
                    // tslint:enable
                });

                it('should reject duplicate E-Mails', async () => {
                    const createData1 = {
                        nickname: 'nickname',
                        loginData: {
                            email: 'test@test.com',
                            unencryptedPassword: 'password123'
                        }
                    };

                    // tslint:disable:no-floating-promises
                    await expect(UserManager.create(createData1)).resolves.not.toBeNull();
                    // tslint:enable

                    const createData2 = {
                        nickname: 'nickname',
                        loginData: {
                            email: 'test@test.com',
                            unencryptedPassword: 'password123'
                        }
                    };

                    // tslint:disable:no-floating-promises
                    await expect(UserManager.create(createData2))
                        .rejects.toEqual(new errors.DuplicateEmailError(createData2.loginData.email));
                    // tslint:enable
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
        });
    });
});
