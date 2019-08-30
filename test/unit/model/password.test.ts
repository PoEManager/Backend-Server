import Password from '../../../app/model/password';

describe('model', () => {
    describe('password.ts', () => {
        it('should correctly encrypt a new password', async () => {
            const password = await Password.encryptPassword('password');

            // bcrypt generates 60 character hashes; if the length fits, it is a good indication if the password was
            // properly generated
            await expect(password.getEncrypted().length).toBe(60);
        });

        it('should correctly compare passwords', async () => {
            const password = await Password.encryptPassword('password');

            await expect(password.compareTo('password')).resolves.toBeTruthy();
        });

        it('should correctly get encrypted passwords', async () => {
            const password = await Password.encryptPassword('password');

            expect(password.getEncrypted()).toBeDefined();
        });
    });
});
