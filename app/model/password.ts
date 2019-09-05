
import bcrypt from 'bcrypt';
import config from '../core/config';

/**
 * A class that creates and compares encrypted passwords.
 */
class Password {
    /**
     * ```true```, if the salt was already generated, ```false``` if not.
     *
     * Salt generation only has to take place once.
     */
    private static generatedSalt = false;

    /**
     * The salt that is used to generate the encrypted passwords.
     */
    private static salt: any;

    /**
     * A factory method that encrypts new passwords.
     *
     * @param password The unencrypted password that will be encrypted.
     */
    public static async encryptPassword(password: string): Promise<Password> {
        if (!Password.generatedSalt) {
            Password.salt = await bcrypt.genSalt(Password.SALT_ROUNDS);
            Password.generatedSalt = true;
        }

        return new Password(await bcrypt.hash(password, Password.salt));
    }

    /**
     * The encrypted password.
     */
    private readonly encrypted: string;

    /**
     * Create a new instance from an encrypted password string.
     *
     * @param encrypted The encrypted password.
     */
    public constructor(encrypted: string) {
        this.encrypted = encrypted;
    }

    /**
     * Compares the instance to another, unencrypted password.
     *
     * @param password The unencrypted password to compare to.
     */
    public async compareTo(password: string): Promise<boolean> {
        return await bcrypt.compare(password, this.encrypted);
    }

    /**
     * @returns The encrypted password as a string.
     */
    public getEncrypted(): string {
        return this.encrypted;
    }
}

namespace Password {
    /**
     * The amount of rounds used to generate the salt.
     */
    export const SALT_ROUNDS = config.security.passwordSaltRounds;
}

export = Password;
