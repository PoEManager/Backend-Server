import DatabaseConnection from '../../../app/core/database-connection';
import errors from '../../../app/model/errors';
import Password from '../../../app/model/password';
import User from '../../../app/model/user';
import UserChanges from '../../../app/model/user-changes';
import UserManager from '../../../app/model/user-manager';

describe('model', () => {
    describe('user.ts', () => {
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

        describe('delete()', () => {
            it('should correctly delete an existing user', async () => {
                const user = await UserManager.createWithDefaultLogin({
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
                const user = await UserManager.createWithDefaultLogin({
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
                const user = await UserManager.createWithDefaultLogin({
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

        describe('newChange()', () => {
            let spy: jest.SpyInstance;

            beforeEach(() => {
                spy = jest.spyOn(UserChanges, 'newChange');
            });

            afterEach(() => {
                jest.restoreAllMocks();
            });

            it('should call UserManager.newChange()', async () => {
                const user = await UserManager.createWithDefaultLogin({
                    nickname: 'nickname',
                    loginData: {
                        email: 'test@test.com',
                        unencryptedPassword: 'password'
                    }
                });

                try {
                    await user.newChange(false);
                } catch (error) {
                    // don't care about errors
                }

                expect(spy).toHaveBeenCalled();
            });
        });

        describe('getNickname()', () => {
            it('should return the correct nickname of a user', async () => {
                const user = await UserManager.createWithDefaultLogin({
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
                const user = await UserManager.createWithDefaultLogin({
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
                const user = await UserManager.createWithDefaultLogin({
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
            it('should return correctly if the user has a default login', async () => {
                const user = await UserManager.createWithDefaultLogin({
                    nickname: 'nickname',
                    loginData: {
                        email: 'test@test.com',
                        unencryptedPassword: 'password'
                    }
                });

                await expect(user.hasDefaultLogin()).resolves.toBeTruthy();
            });

            it('should return correctly if the user does not have a default login', async () => {
                const user = await UserManager.createWithGoogleLogin('google-uid', 'nickname', 'test@test.com');

                await expect(user.hasDefaultLogin()).resolves.toBeFalsy();
            });

            it('should throw UserNotFound error if the user does note exist', async () => {
                await expect(new User(-1).hasDefaultLogin()).rejects.toEqual(new errors.UserNotFoundError(-1));
            });
        });

        describe('getDefaultLogin()', () => {
            it('should return correctly if the user has a default login', async () => {
                const user = await UserManager.createWithDefaultLogin({
                    nickname: 'nickname',
                    loginData: {
                        email: 'test@test.com',
                        unencryptedPassword: 'password'
                    }
                });

                const defaultlogin = await user.getDefaultLogin();
                // bcrypt generates 60 character hashes
                expect((await defaultlogin.getPassword()).getEncrypted().length).toBe(60);
            });

            it('should throw if the user does not have a default login', async () => {
                const user = await UserManager.createWithGoogleLogin('google-uid', 'nickname', 'test@test.com');

                await expect(user.getDefaultLogin())
                    .rejects.toEqual(new errors.DefaultLoginNotPresentError(user.getId()));
            });

            it('should throw UserNotFound error if the user does note exist', async () => {
                await expect(new User(-1).getDefaultLogin()).rejects.toEqual(new errors.UserNotFoundError(-1));
            });
        });

        describe('removeDefaultLogin()', () => {
            it('should return correctly if the user does have two logins', async () => {
                const user = await UserManager.createWithGoogleLogin('google-uid', 'nickname', 'test@test.com');
                await user.addDefaultLogin('password');

                await expect(user.hasDefaultLogin()).resolves.toBeTruthy();
                await expect(user.hasGoogleLogin()).resolves.toBeTruthy();

                await user.removeDefaultLogin();

                await expect(user.hasDefaultLogin()).resolves.toBeFalsy();
                await expect(user.hasGoogleLogin()).resolves.toBeTruthy();
            });

            it('should throw if the user only has a Default login', async () => {
                const user = await UserManager.createWithDefaultLogin({
                    nickname: 'nickname',
                    loginData: {
                        email: 'test@test.com',
                        unencryptedPassword: 'password'
                    }
                });

                await expect(user.removeDefaultLogin())
                    .rejects.toEqual(new errors.InvalidLoginStateError(user.getId()));
            });

            it('should throw if the user does not have a Google login', async () => {
                const user = await UserManager.createWithGoogleLogin('google-uid', 'nickname', 'test@test.com');

                await expect(user.removeDefaultLogin())
                    .rejects.toEqual(new errors.DefaultLoginNotPresentError(user.getId()));
            });

            it('should throw UserNotFound error if the user does note exist', async () => {
                await expect(new User(-1).removeDefaultLogin())
                    .rejects.toEqual(new errors.UserNotFoundError(-1));
            });
        });

        describe('addDefaultLogin()', () => {
            it('should correctly add the login, if the user does not have a default login', async () => {
                const user = await UserManager.createWithGoogleLogin('google-uid', 'nickname', 'test@test.com');

                await expect(user.hasDefaultLogin()).resolves.toBeFalsy();

                await user.addDefaultLogin('password');

                await expect(user.hasDefaultLogin()).resolves.toBeTruthy();

                const defaultlogin = await user.getDefaultLogin();
                const password = await defaultlogin.getPassword();

                await expect(password.compareTo('password')).resolves.toBeTruthy();
            });

            it('should throw if the user already has a default login', async () => {
                const user = await UserManager.createWithDefaultLogin({
                    nickname: 'nickname',
                    loginData: {
                        email: 'test@test.com',
                        unencryptedPassword: 'password'
                    }
                });

                await expect(user.addDefaultLogin('password'))
                    .rejects.toEqual(new errors.DefaultLoginAlreadyPresentError(user.getId()));
            });

            it('should throw UserNotFound error if the user does note exist', async () => {
                await expect(new User(-1).addDefaultLogin('password'))
                    .rejects.toEqual(new errors.UserNotFoundError(-1));
            });
        });

        describe('hasGoogleLogin()', () => {
            it('should return correctly if the user has a Google login', async () => {
                const user = await UserManager.createWithGoogleLogin('google-uid', 'nickname', 'test@test.com');

                await expect(user.hasGoogleLogin()).resolves.toBeTruthy();
            });

            it('should return correctly if the user does not have a Google login', async () => {
                const user = await UserManager.createWithDefaultLogin({
                    nickname: 'nickname',
                    loginData: {
                        email: 'test@test.com',
                        unencryptedPassword: 'password'
                    }
                });

                await expect(user.hasGoogleLogin()).resolves.toBeFalsy();
            });

            it('should throw UserNotFound error if the user does note exist', async () => {
                await expect(new User(-1).hasGoogleLogin()).rejects.toEqual(new errors.UserNotFoundError(-1));
            });
        });

        describe('getGoogleLogin()', () => {
            it('should return correctly if the user has a Google login', async () => {
                const user = await UserManager.createWithGoogleLogin('google-uid', 'nickname', 'test@test.com');

                const googleLogin = await user.getGoogleLogin();
                await expect(googleLogin.getGoogleUID()).resolves.toBe('google-uid');
            });

            it('should throw if the user does not have a default login', async () => {
                const user = await UserManager.createWithDefaultLogin({
                    nickname: 'nickname',
                    loginData: {
                        email: 'test@test.com',
                        unencryptedPassword: 'password'
                    }
                });

                await expect(user.getGoogleLogin())
                    .rejects.toEqual(new errors.GoogleLoginNotPresentError(user.getId()));
            });

            it('should throw UserNotFound error if the user does note exist', async () => {
                await expect(new User(-1).getGoogleLogin()).rejects.toEqual(new errors.UserNotFoundError(-1));
            });
        });

        describe('removeGoogleLogin()', () => {
            it('should return correctly if the user does have two logins', async () => {
                const user = await UserManager.createWithGoogleLogin('google-uid', 'nickname', 'test@test.com');
                await user.addDefaultLogin('password');

                await expect(user.hasGoogleLogin()).resolves.toBeTruthy();
                await expect(user.hasDefaultLogin()).resolves.toBeTruthy();

                await user.removeGoogleLogin();

                await expect(user.hasGoogleLogin()).resolves.toBeFalsy();
                await expect(user.hasDefaultLogin()).resolves.toBeTruthy();
            });

            it('should throw if the user only has a Google login', async () => {
                const user = await UserManager.createWithGoogleLogin('google-uid', 'nickname', 'test@test.com');

                await expect(user.removeGoogleLogin())
                    .rejects.toEqual(new errors.InvalidLoginStateError(user.getId()));
            });

            it('should throw if the user does not have a Google login', async () => {
                const user = await UserManager.createWithDefaultLogin({
                    nickname: 'nickname',
                    loginData: {
                        email: 'test@test.com',
                        unencryptedPassword: 'password'
                    }
                });

                await expect(user.removeGoogleLogin())
                    .rejects.toEqual(new errors.GoogleLoginNotPresentError(user.getId()));
            });

            it('should throw UserNotFound error if the user does note exist', async () => {
                await expect(new User(-1).removeGoogleLogin())
                    .rejects.toEqual(new errors.UserNotFoundError(-1));
            });
        });

        describe('addGoogleLogin()', () => {
            it('should correctly add the login, if the the user does not have a Google login', async () => {
                const user = await UserManager.createWithDefaultLogin({
                    nickname: 'nickname',
                    loginData: {
                        email: 'test@test.com',
                        unencryptedPassword: 'password'
                    }
                });

                await expect(user.hasGoogleLogin()).resolves.toBeFalsy();

                await user.addGoogleLogin('google-uid');

                await expect(user.hasGoogleLogin()).resolves.toBeTruthy();

                const googleLogin = await user.getGoogleLogin();
                const googleUID = await googleLogin.getGoogleUID();

                expect(googleUID).toBe('google-uid');
            });

            it('should throw if the user already has a Google login', async () => {
                const user = await UserManager.createWithGoogleLogin('google-uid', 'nickname', 'test@test.com');

                await expect(user.addGoogleLogin('google-uid'))
                    .rejects.toEqual(new errors.GoogleLoginAlreadyPresentError(user.getId()));
            });

            it('should throw UserNotFound error if the user does note exist', async () => {
                await expect(new User(-1).addGoogleLogin('google-uid'))
                    .rejects.toEqual(new errors.UserNotFoundError(-1));
            });
        });

        describe('query()', () => {
            it('should correctly query the user\'s attributes', async () => {
                const user = await UserManager.createWithDefaultLogin({
                    nickname: 'nickname',
                    loginData: {
                        email: 'test@test.com',
                        unencryptedPassword: 'password'
                    }
                });

                const defaultLoginId = (await user.getDefaultLogin()).getId();
                const googleLoginId = null;

                const timeBefore = new Date();
                timeBefore.setMilliseconds(0);

                const result = await user.query([
                    User.QueryData.ID,
                    User.QueryData.DEFAULT_LOGIN_ID,
                    User.QueryData.GOOGLE_LOGIN_ID,
                    User.QueryData.NICKNAME,
                    User.QueryData.CHANGE_UID,
                    User.QueryData.SESSION_ID,
                    User.QueryData.CREATED_TIME,
                    User.QueryData.AVATAR_STATE,
                    User.QueryData.EMAIL,
                    User.QueryData.NEW_EMAIL
                ]);

                const timeAfter = new Date();

                expect(result.id).toBe(user.getId());
                expect(result.nickname).toBe('nickname');
                expect(result.defaultLoginId).toBe(defaultLoginId);
                expect(result.googleLoginId).toBe(googleLoginId);
                expect(result.changeUid!.length).toBe(24);
                expect(result.sessionId!).toBeNull();
                expect(result.createdTime!.getTime()).toBeGreaterThanOrEqual(timeBefore.getTime());
                expect(result.createdTime!.getTime()).toBeLessThanOrEqual(timeAfter.getTime());
                expect(result.avatarState!).toBe(User.AvatarState.DEFAULT);
                expect(result.email!).toBe('test@test.com');
                expect(result.newEmail!).toBeNull();
            });

            it('should not set attributes that were not queried (some queried attributes)', async () => {
                const user = await UserManager.createWithDefaultLogin({
                    nickname: 'nickname',
                    loginData: {
                        email: 'test@test.com',
                        unencryptedPassword: 'password'
                    }
                });

                await expect(user.query([])).resolves.toMatchObject({});
            });

            it('should not set attributes that were not queried (no queried attributes)', async () => {
                const user = await UserManager.createWithDefaultLogin({
                    nickname: 'nickname',
                    loginData: {
                        email: 'test@test.com',
                        unencryptedPassword: 'password'
                    }
                });

                await expect(user.query([User.QueryData.ID])).resolves.toMatchObject({id: user.getId()});
            });

            it('should throw UserNotFound error if the user does note exist', async () => {
                await expect(new User(-1).query([])).rejects.toEqual(new errors.UserNotFoundError(-1));
            });
        });

        describe('getChangeState()', () => {
            // todo change state when no change is in progress

            it('should correctly query the user\'s change state if the state is VERIFY_ACCOUNT', async () => {
                const user = await UserManager.createWithDefaultLogin({
                    nickname: 'nickname',
                    loginData: {
                        email: 'test@test.com',
                        unencryptedPassword: 'password'
                    }
                });

                await expect(user.getChangeState()).resolves.toBe(User.ChangeType.VERIFY_ACCOUNT);
            });

            it('should correctly query the user\'s change state if the state is NEW_EMAIL', async () => {
                const user = await UserManager.createWithDefaultLogin({
                    nickname: 'nickname',
                    loginData: {
                        email: 'test@test.com',
                        unencryptedPassword: 'password'
                    }
                });

                await UserManager.validateChange(await user.getChangeUID() as string);

                await expect(user.updateEMail('test1@test.com')).resolves.toBeDefined();
                await expect(user.getChangeState()).resolves.toBe(User.ChangeType.NEW_EMAIL);
            });

            it('should correctly query the user\'s change state if the state is NEW_PASSWORD', async () => {
                const user = await UserManager.createWithDefaultLogin({
                    nickname: 'nickname',
                    loginData: {
                        email: 'test@test.com',
                        unencryptedPassword: 'password'
                    }
                });

                await UserManager.validateChange(await user.getChangeUID() as string);

                const login = await user.getDefaultLogin();

                await expect(login.updatePassword(await Password.encryptPassword('abc'))).resolves.toBeDefined();
                await expect(user.getChangeState()).resolves.toBe(User.ChangeType.NEW_PASSWORD);
            });

            it('should correctly reset the change if it ran out and the change is a new email', async () => {
                const user = await UserManager.createWithDefaultLogin({
                    nickname: 'nickname',
                    loginData: {
                        email: 'test@test.com',
                        unencryptedPassword: 'password'
                    }
                });

                await UserManager.validateChange(await user.getChangeUID() as string);

                await expect(user.updateEMail('test1@test.com')).resolves.toBeDefined();

                // manually expire change
                await DatabaseConnection.query(
                    'UPDATE `Users` SET `Users`.`change_expire_date` = DATE_SUB(NOW(), INTERVAL 1 DAY)');

                await expect(user.getChangeState()).resolves.toBe(null);
                await expect(user.getNewEmail()).resolves.toBe(null);
            });

            it('should correctly reset the change if it ran out and the change is a new password', async () => {
                const user = await UserManager.createWithDefaultLogin({
                    nickname: 'nickname',
                    loginData: {
                        email: 'test@test.com',
                        unencryptedPassword: 'password'
                    }
                });

                await UserManager.validateChange(await user.getChangeUID() as string);

                const login = await user.getDefaultLogin();

                await expect(login.updatePassword(await Password.encryptPassword('abc'))).resolves.toBeDefined();

                // manually expire change
                await DatabaseConnection.query(
                    'UPDATE `Users` SET `Users`.`change_expire_date` = DATE_SUB(NOW(), INTERVAL 1 DAY)');

                await expect(user.getChangeState()).resolves.toBeNull();
                await expect(login.getNewPassword()).resolves.toBeNull();
            });

            it('should throw UserNotFound error if the user does note exist', async () => {
                await expect(new User(-1).getChangeState()).rejects.toEqual(new errors.UserNotFoundError(-1));
            });
        });

        describe('isVerified()', () => {
            it('should return false if the user is not verified', async () => {
                const user = await UserManager.createWithDefaultLogin({
                    nickname: 'nickname',
                    loginData: {
                        email: 'test@test.com',
                        unencryptedPassword: 'password'
                    }
                });

                await expect(user.isVerified()).resolves.toBeFalsy();
            });

            // todo check when verification works

            it('should throw UserNotFound error if the user does note exist', async () => {
                await expect(new User(-1).isVerified()).rejects.toEqual(new errors.UserNotFoundError(-1));
            });
        });

        describe('getWalletRestrictions()', () => {
            it('should return a proper object, if the user exists', async () => {
                const user = await UserManager.createWithDefaultLogin({
                    nickname: 'nickname',
                    loginData: {
                        email: 'test@test.com',
                        unencryptedPassword: 'password'
                    }
                });

                await expect(user.getWalletRestrictions()).resolves.toBeDefined();
            });

            it('should throw UserNotFound error if the user does note exist', async () => {
                await expect(new User(-1).getWalletRestrictions()).rejects.toEqual(new errors.UserNotFoundError(-1));
            });
        });

        describe('getChangeUID()', () => {
            it('should return null if no change is going on', async () => {
                /*const user = await UserManager.createWithGoogleLogin('google-uid');

                await expect(user.getChangeState()).resolves.toBeNull();*/
                // todo
            });

            it('should return a valid change uid if a change is in progress', async () => {
                const user = await UserManager.createWithDefaultLogin({
                    nickname: 'nickname',
                    loginData: {
                        email: 'test@test.com',
                        unencryptedPassword: 'password'
                    }
                });

                const changeUid = await user.getChangeUID();
                expect(changeUid!.length).toBe(24);

            });

            it('should throw UserNotFound error if the user does note exist', async () => {
                await expect(new User(-1).getChangeUID()).rejects.toEqual(new errors.UserNotFoundError(-1));
            });
        });

        describe('setSessionId()', () => {
            it('should return a valid session ID', async () => {
                const user = await UserManager.createWithDefaultLogin({
                    nickname: 'nickname',
                    loginData: {
                        email: 'test@test.com',
                        unencryptedPassword: 'password'
                    }
                });

                await user.setSessionId('abc');
                await expect(user.getSessionID()).resolves.toBe('abc');

            });

            it('should throw UserNotFound error if the user does note exist', async () => {
                await expect(new User(-1).setSessionId('abc')).rejects.toEqual(new errors.UserNotFoundError(-1));
            });
        });

        describe('invalidateSessionId()', () => {
            it('should return a valid session ID', async () => {
                const user = await UserManager.createWithDefaultLogin({
                    nickname: 'nickname',
                    loginData: {
                        email: 'test@test.com',
                        unencryptedPassword: 'password'
                    }
                });

                await user.setSessionId('abc');
                await user.invalidateSessionId();
                await expect(user.getSessionID()).resolves.toBeNull();

            });

            it('should throw UserNotFound error if the user does note exist', async () => {
                await expect(new User(-1).invalidateSessionId()).rejects.toEqual(new errors.UserNotFoundError(-1));
            });
        });

        describe('getSessionID()', () => {
            it('should return a valid session ID', async () => {
                const user = await UserManager.createWithDefaultLogin({
                    nickname: 'nickname',
                    loginData: {
                        email: 'test@test.com',
                        unencryptedPassword: 'password'
                    }
                });

                await expect(user.getSessionID()).resolves.toBeNull();

            });

            it('should throw UserNotFound error if the user does note exist', async () => {
                await expect(new User(-1).getSessionID()).rejects.toEqual(new errors.UserNotFoundError(-1));
            });
        });

        describe('getChangeExpireDate()', () => {
            it('should return null if no change is going on', async () => {
                // todo
            });

            it('should return a valid change date if a change is in progress', async () => {
                const user = await UserManager.createWithDefaultLogin({
                    nickname: 'nickname',
                    loginData: {
                        email: 'test@test.com',
                        unencryptedPassword: 'password'
                    }
                });

                const afterTime = new Date();
                afterTime.setFullYear(afterTime.getFullYear() + 10); // 10 years in the future

                const changeExpireDate = await user.getChangeExpireDate();
                expect(changeExpireDate.getTime()).toBeGreaterThan(afterTime.getTime());

            });

            it('should throw UserNotFound error if the user does note exist', async () => {
                await expect(new User(-1).getChangeExpireDate()).rejects.toEqual(new errors.UserNotFoundError(-1));
            });
        });

        describe('getCreatedTime()', () => {
            it('should return the correct time', async () => {
                const timeBefore = new Date();
                timeBefore.setMilliseconds(0); // MariaDB uses second precision and not micros
                const user = await UserManager.createWithDefaultLogin({
                    nickname: 'nickname',
                    loginData: {
                        email: 'test@test.com',
                        unencryptedPassword: 'password'
                    }
                });
                const timeAfter = new Date();

                const createdTime = await user.getCreatedTime();
                expect(createdTime.getTime()).toBeGreaterThanOrEqual(timeBefore.getTime());
                expect(createdTime.getTime()).toBeLessThanOrEqual(timeAfter.getTime());
            });

            it('should throw UserNotFound error if the user does note exist', async () => {
                await expect(new User(-1).getCreatedTime()).rejects.toEqual(new errors.UserNotFoundError(-1));
            });
        });

        describe('getAvatarState()', () => {
            it('should return the correct state', async () => {
                const user = await UserManager.createWithDefaultLogin({
                    nickname: 'nickname',
                    loginData: {
                        email: 'test@test.com',
                        unencryptedPassword: 'password'
                    }
                });

                const avatarState = await user.getAvatarState();
                expect(avatarState).toEqual('default');
            });

            it('should throw UserNotFound error if the user does note exist', async () => {
                await expect(new User(-1).getAvatarState()).rejects.toEqual(new errors.UserNotFoundError(-1));
            });
        });

        describe('setAvatarState()', () => {
            it('should return the correct state', async () => {
                const user = await UserManager.createWithDefaultLogin({
                    nickname: 'nickname',
                    loginData: {
                        email: 'test@test.com',
                        unencryptedPassword: 'password'
                    }
                });

                let avatarState = await user.getAvatarState();
                expect(avatarState).toEqual('default');

                await user.setAvatarState(User.AvatarState.CUSTOM);

                avatarState = await user.getAvatarState();
                expect(avatarState).toEqual('custom');
            });

            it('should throw UserNotFound error if the user does note exist', async () => {
                await expect(new User(-1).setAvatarState(User.AvatarState.CUSTOM))
                    .rejects.toEqual(new errors.UserNotFoundError(-1));
            });
        });

        describe('getEmail()', () => {
            it('should return the correct email', async () => {
                const user = await UserManager.createWithDefaultLogin({
                    nickname: 'nickname',
                    loginData: {
                        email: 'test@test.com',
                        unencryptedPassword: 'password'
                    }
                });

                await expect(user.getEmail()).resolves.toBe('test@test.com');
            });

            it('should throw DefaultLoginNotFoundError error if the login does note exist', async () => {
                await expect(new User(-1).getEmail()).rejects.toEqual(new errors.UserNotFoundError(-1));
            });
        });

        // todo update as soon as emails can be updated
        describe('getNewEmail()', () => {
            it('should return the correct email', async () => {
                const user = await UserManager.createWithDefaultLogin({
                    nickname: 'nickname',
                    loginData: {
                        email: 'test@test.com',
                        unencryptedPassword: 'password'
                    }
                });

                await expect(user.getNewEmail()).resolves.toBeNull();
            });

            it('should throw DefaultLoginNotFoundError error if the login does note exist', async () => {
                await expect(new User(-1).getNewEmail()).rejects.toEqual(new errors.UserNotFoundError(-1));
            });
        });

        describe('updateEmail()', () => {
            it('should correctly update the E-Mail of a verified user', async () => {
                const user = await UserManager.createWithDefaultLogin({
                    nickname: 'nickname',
                    loginData: {
                        email: 'test@test.com',
                        unencryptedPassword: 'password'
                    }
                });

                await UserManager.validateChange(await user.getChangeUID() as string);

                await expect(user.getNewEmail()).resolves.toBeNull();
                await expect(user.updateEMail('test1@test.com')).resolves.toBeDefined();
                await expect(user.getNewEmail()).resolves.toBe('test1@test.com');
            });

            it('should throw if another change is already in progress', async () => {
                const user = await UserManager.createWithDefaultLogin({
                    nickname: 'nickname',
                    loginData: {
                        email: 'test@test.com',
                        unencryptedPassword: 'password'
                    }
                });

                await expect(user.getNewEmail()).resolves.toBeNull();
                await expect(user.updateEMail('test1@test.com'))
                    .rejects.toEqual(new errors.ChangeAlreadyInProgressError(user.getId()));
            });

            it('should throw if the login / user does not exist', async () => {
                const defaultLogin = new User(-1);

                await expect(defaultLogin.updateEMail('test1@test.com'))
                    .rejects.toEqual(new errors.UserNotFoundError(-1));
            });
        });
    });
});
