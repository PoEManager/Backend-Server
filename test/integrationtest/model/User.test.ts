import DatabaseConnection from '../../../app/core/DatabaseConnection';
import errors from '../../../app/model/Errors';
import User from '../../../app/model/User';
import UserManager from '../../../app/model/UserManager';

describe('model', () => {
    describe('User.ts', () => {
        beforeEach(async () => {
            await DatabaseConnection.transaction(async conn => {
                await conn.query('DELETE FROM `Users`');
                await conn.query('DELETE FROM `DefaultLogins`');
            });
        });

        afterAll(async () => {
            await DatabaseConnection.reset();
        });

        describe('delete()', () => {
            it('should correctly delete an existing user', async () => {
                const user = await UserManager.create({
                    nickname: 'nickname',
                    loginData: {
                        email: 'test@test.com',
                        unencryptedPassword: 'password'
                    }
                });

                expect(user).toBeDefined();

                await expect(user.delete()).resolves.toBeUndefined();

                await expect(UserManager.get(user.getId())).rejects.toEqual(new errors.UserNotFoundError(user.getId()));
            });

            it('should return false when deleting a user that does not exist', async () => {
                const user = await UserManager.create({
                    nickname: 'nickname',
                    loginData: {
                        email: 'test@test.com',
                        unencryptedPassword: 'password'
                    }
                });

                expect(user).toBeDefined();

                await expect(user.delete()).resolves.toBeUndefined();
                await expect(user.delete()).rejects.toEqual(new errors.UserNotFoundError(user.getId()));
            });

            it('should also delete the users credential data', async () => {
                const user = await UserManager.create({
                    nickname: 'nickname',
                    loginData: {
                        email: 'test@test.com',
                        unencryptedPassword: 'password'
                    }
                });

                const defaultLogin = await user.getDefaultLogin();
                expect(user).toBeDefined();
                await expect(user.hasDefaultLogin()).resolves.toBeTruthy();
                await expect(user.delete()).resolves.toBeUndefined();
                await expect(UserManager.getDefaultLogin(defaultLogin.getId())).rejects
                    .toEqual(new errors.DefaultLoginNotFoundError(defaultLogin.getId()));
            });
        });

        describe('getNickname()', () => {
            it('should return the correct nickname of a user', async () => {
                const user = await UserManager.create({
                    nickname: 'nickname',
                    loginData: {
                        email: 'test@test.com',
                        unencryptedPassword: 'password'
                    }
                });

                await expect(user.getNickname()).resolves.toBe('nickname');
            });

            it('should throw UserNotFound error if the user does note exist', async () => {
                await expect(new User(-1).getNickname()).rejects.toEqual(new errors.UserNotFoundError(-1));
            });
        });

        describe('setNickname()', () => {
            it('should correctly update the nickname of a user', async () => {
                const user = await UserManager.create({
                    nickname: 'nickname',
                    loginData: {
                        email: 'test@test.com',
                        unencryptedPassword: 'password'
                    }
                });

                await expect(user.getNickname()).resolves.toBe('nickname');
                await expect(user.setNickname('new-nickname')).resolves.toBeUndefined();
                await expect(user.getNickname()).resolves.toBe('new-nickname');
            });

            it('should throw InvalidNicknameError if the new nickname is invalid', async () => {
                const user = await UserManager.create({
                    nickname: 'nickname',
                    loginData: {
                        email: 'test@test.com',
                        unencryptedPassword: 'password'
                    }
                });

                await expect(user.getNickname()).resolves.toBe('nickname');
                await expect(user.setNickname('invalid nickname')).rejects
                    .toEqual(new errors.InvalidNicknameError('invalid nickname'));
            });

            it('should throw UserNotFound error if the user does note exist', async () => {
                await expect(new User(-1).setNickname('nickname')).rejects.toEqual(new errors.UserNotFoundError(-1));
            });
        });

        describe('hasDefaultLogin()', () => {
            // todo needs to be expanded as soon as other logins are possible
            it('should return correctly if the user has a default login', async () => {
                const user = await UserManager.create({
                    nickname: 'nickname',
                    loginData: {
                        email: 'test@test.com',
                        unencryptedPassword: 'password'
                    }
                });

                await expect(user.hasDefaultLogin()).resolves.toBeTruthy();
            });

            it('should throw UserNotFound error if the user does note exist', async () => {
                await expect(new User(-1).hasDefaultLogin()).rejects.toEqual(new errors.UserNotFoundError(-1));
            });
        });

        describe('getDefaultLogin()', () => {
            // todo needs to be expanded as soon as other logins are possible
            it('should return correctly if the user has a default login', async () => {
                const user = await UserManager.create({
                    nickname: 'nickname',
                    loginData: {
                        email: 'test@test.com',
                        unencryptedPassword: 'password'
                    }
                });

                const defaultlogin = await user.getDefaultLogin();
                await expect(defaultlogin.getEmail()).resolves.toBe('test@test.com');
                // bcrypt generates 60 character hashes
                await expect((await defaultlogin.getPassword()).getEncrypted().length).toBe(60);
            });

            it('should throw UserNotFound error if the user does note exist', async () => {
                await expect(new User(-1).hasDefaultLogin()).rejects.toEqual(new errors.UserNotFoundError(-1));
            });
        });
    });
});
