import DatabaseConnection from '../../../app/core/database-connection';
import DefaultLogin from '../../../app/model/default-login';
import errors from '../../../app/model/errors';
import Password from '../../../app/model/password';
import User from '../../../app/model/user';
import UserChanges from '../../../app/model/user-changes';
import UserManager from '../../../app/model/user-manager';

async function timeOutChange(userID: User.ID) {
    const date = new Date();
    date.setFullYear(2000);

    await DatabaseConnection.query('UPDATE `Users` SET `change_expire_date` = ? WHERE `user_id` = ?', {
        parameters: [
            date,
            userID
        ]
    });
}

async function getUserData(id: User.ID): Promise<any> {
    const result = await DatabaseConnection.query(
        'SELECT * FROM `Users` NATURAL JOIN `DefaultLogins` WHERE `Users`.`user_id` = ?', {
        parameters: [
            id
        ]
    });

    return result[0];
}

describe('model', () => {
    describe('user-changes.ts', () => {
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

        describe('getChangeState()', () => {
            it('should return the correct change state, if state is VERIFY_ACCOUNT', async () => {
                const user = await UserManager.createWithDefaultLogin({
                    nickname: 'nickname',
                    loginData: {
                        email: 'test@test.com',
                        unencryptedPassword: 'password'
                    }
                });

                await expect(UserChanges.getChangeState(user.getId()))
                    .resolves.toBe(UserChanges.ChangeType.VERIFY_ACCOUNT);
            });

            it('should return the correct change state, if state is NEW_EMAIL', async () => {
                const user = await UserManager.createWithDefaultLogin({
                    nickname: 'nickname',
                    loginData: {
                        email: 'test@test.com',
                        unencryptedPassword: 'password'
                    }
                });

                await UserChanges.validateChange((await user.getChangeUID())!);

                await user.updateEMail('new.mail@test.com');

                await expect(UserChanges.getChangeState(user.getId()))
                    .resolves.toBe(UserChanges.ChangeType.NEW_EMAIL);
            });

            it('should return the correct change state, if state is NEW_PASSWORD', async () => {
                const user = await UserManager.createWithDefaultLogin({
                    nickname: 'nickname',
                    loginData: {
                        email: 'test@test.com',
                        unencryptedPassword: 'password'
                    }
                });

                await UserChanges.validateChange((await user.getChangeUID())!);

                const defaultLogin = await user.getDefaultLogin();
                await defaultLogin.updatePassword(await Password.encryptPassword('new-password'));

                await expect(UserChanges.getChangeState(user.getId()))
                    .resolves.toBe(UserChanges.ChangeType.NEW_PASSWORD);
            });

            it('should return null, if no change is in progress', async () => {
                const user = await UserManager.createWithDefaultLogin({
                    nickname: 'nickname',
                    loginData: {
                        email: 'test@test.com',
                        unencryptedPassword: 'password'
                    }
                });

                await UserChanges.validateChange((await user.getChangeUID())!);

                await expect(UserChanges.getChangeState(user.getId())).resolves.toBeNull();
            });

            it('should return null and reset the change if it was invalid and state was VERIFY_ACCOUNT', async () => {
                const user = await UserManager.createWithDefaultLogin({
                    nickname: 'nickname',
                    loginData: {
                        email: 'test@test.com',
                        unencryptedPassword: 'password'
                    }
                });

                await timeOutChange(user.getId());

                await expect(UserChanges.getChangeState(user.getId())).resolves.toBeNull();
                const userData = await getUserData(user.getId());
                expect(userData.change_uid).toBeNull();
                expect(userData.change_expire_date).toBeNull();
            });

            it('should return null and reset the change if it was invalid and state was NEW_EMAIL', async () => {
                const user = await UserManager.createWithDefaultLogin({
                    nickname: 'nickname',
                    loginData: {
                        email: 'test@test.com',
                        unencryptedPassword: 'password'
                    }
                });

                await UserChanges.validateChange((await user.getChangeUID())!);

                await user.updateEMail('new.mail@test.com');

                await timeOutChange(user.getId());

                await expect(UserChanges.getChangeState(user.getId())).resolves.toBeNull();
                const userData = await getUserData(user.getId());
                expect(userData.change_uid).toBeNull();
                expect(userData.change_expire_date).toBeNull();
                expect(userData.new_email).toBeNull();
            });

            it('should return null and reset the change if it was invalid and state was NEW_PASSWORD', async () => {
                const user = await UserManager.createWithDefaultLogin({
                    nickname: 'nickname',
                    loginData: {
                        email: 'test@test.com',
                        unencryptedPassword: 'password'
                    }
                });

                await UserChanges.validateChange((await user.getChangeUID())!);

                const defaultLogin = await user.getDefaultLogin();
                await defaultLogin.updatePassword(await Password.encryptPassword('new-password'));

                await timeOutChange(user.getId());

                await expect(UserChanges.getChangeState(user.getId())).resolves.toBeNull();
                const userData = await getUserData(user.getId());
                expect(userData.change_uid).toBeNull();
                expect(userData.change_expire_date).toBeNull();
                expect(userData.new_password).toBeNull();
            });

            it('should throw UserNotFound error if the user does not exist', async () => {
                await expect(UserChanges.getChangeState(-1)).rejects.toEqual(new errors.UserNotFoundError(-1));
            });
        });

        describe('newChange()', () => {
            it('should correctly create a new account validation change (finite duration)', async () => {
                const user = await UserManager.createWithDefaultLogin({
                    nickname: 'nickname',
                    loginData: {
                        email: 'test@test.com',
                        unencryptedPassword: 'password'
                    }
                });

                await UserChanges.validateChange((await user.getChangeUID())!);
                await UserChanges.newChange(user.getId(), false);
                const userData = await getUserData(user.getId());
                expect(userData.change_uid).not.toBeNull();
                expect(userData.change_expire_date).not.toBeNull();
                expect(userData.change_expire_date.getTime()).toBeGreaterThan(Date.now());
                // 1000 * 60 * 60 * 24 * 21 is three weeks in ms
                expect(userData.change_expire_date.getTime()).toBeLessThan(Date.now() + 1000 * 60 * 60 * 24 * 21);
            });

            it('should correctly create a new account validation change (infinite duration)', async () => {
                const user = await UserManager.createWithDefaultLogin({
                    nickname: 'nickname',
                    loginData: {
                        email: 'test@test.com',
                        unencryptedPassword: 'password'
                    }
                });

                await UserChanges.validateChange((await user.getChangeUID())!);
                await UserChanges.newChange(user.getId(), true);
                const userData = await getUserData(user.getId());
                expect(userData.change_uid).not.toBeNull();
                expect(userData.change_expire_date).not.toBeNull();
                // 1000 * 60 * 60 * 24 * 21 is three weeks in ms
                expect(userData.change_expire_date.getTime()).toBeGreaterThan(Date.now() + 1000 * 60 * 60 * 24 * 21);
            });

            it('should throw ChangeAlreadyInProgressError if a change is already in progress', async () => {
                const user = await UserManager.createWithDefaultLogin({
                    nickname: 'nickname',
                    loginData: {
                        email: 'test@test.com',
                        unencryptedPassword: 'password'
                    }
                });

                await expect(UserChanges.newChange(user.getId(), false))
                    .rejects.toEqual(new errors.ChangeAlreadyInProgressError(user.getId()));
            });

            it('should throw UserNotFound error if the user does not exist', async () => {
                await expect(UserChanges.newChange(-1, false)).rejects.toEqual(new errors.UserNotFoundError(-1));
            });
        });

        describe('validateChange()', () => {
            it('should correctly validate an account validation change if state is VERIFY_ACCOUNT', async () => {
                const user = await UserManager.createWithDefaultLogin({
                    nickname: 'nickname',
                    loginData: {
                        email: 'test@test.com',
                        unencryptedPassword: 'password'
                    }
                });

                await UserChanges.validateChange((await user.getChangeUID())!);

                const userData = await getUserData(user.getId());
                expect(userData.change_uid).toBeNull();
                expect(userData.change_expire_date).toBeNull();
                expect(userData.verified).toBeTruthy();
            });

            it('should correctly validate an account validation change if state is NEW_EMAIL', async () => {
                const user = await UserManager.createWithDefaultLogin({
                    nickname: 'nickname',
                    loginData: {
                        email: 'test@test.com',
                        unencryptedPassword: 'password'
                    }
                });

                await UserChanges.validateChange((await user.getChangeUID())!);

                await user.updateEMail('new.mail@test.com');

                await UserChanges.validateChange((await user.getChangeUID())!);

                const userData = await getUserData(user.getId());
                expect(userData.change_uid).toBeNull();
                expect(userData.change_expire_date).toBeNull();
                expect(userData.new_email).toBeNull();
                expect(userData.email).toBe('new.mail@test.com');
            });

            it('should correctly validate an account validation change if state is NEW_PASSWORD', async () => {
                const user = await UserManager.createWithDefaultLogin({
                    nickname: 'nickname',
                    loginData: {
                        email: 'test@test.com',
                        unencryptedPassword: 'password'
                    }
                });

                await UserChanges.validateChange((await user.getChangeUID())!);

                const defaultLogin = await user.getDefaultLogin();
                await defaultLogin.updatePassword(await Password.encryptPassword('new-password'));

                await UserChanges.validateChange((await user.getChangeUID())!);

                const userData = await getUserData(user.getId());
                expect(userData.change_uid).toBeNull();
                expect(userData.change_expire_date).toBeNull();
                expect(userData.new_password).toBeNull();
                expect(userData.password).toBe((await Password.encryptPassword('new-password')).getEncrypted());
            });

            it('should throw InvalidChangeIDError error if the change ID does not exist', async () => {
                await expect(UserChanges.validateChange('abc')).rejects.toEqual(new errors.InvalidChangeIDError('abc'));
            });
        });

        describe('getUserFromChangeID', () => {
            it('should return the correct user', async () => {
                const user = await UserManager.createWithDefaultLogin({
                    nickname: 'nickname',
                    loginData: {
                        email: 'test@test.com',
                        unencryptedPassword: 'password'
                    }
                });

                expect(await UserChanges.getUserFromChangeId((await user.getChangeUID())!)).toBe(user.getId());
            });

            it('should throw InvalidChangeIDError error if the change ID does not exist', async () => {
                await expect(UserChanges.validateChange('abc')).rejects.toEqual(new errors.InvalidChangeIDError('abc'));
            });
        });
    });
});
