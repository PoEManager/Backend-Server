
import bcrypt from 'bcrypt';

class Password {
    private static generatedSalt = false;
    private static salt: any;

    public static async encryptPassword(password: string): Promise<Password> {
        if (!Password.generatedSalt) {
            Password.salt = await bcrypt.genSalt(Password.SALT_ROUNDS);
            Password.generatedSalt = true;
        }

        return new Password(await bcrypt.hash(password, Password.salt));
    }

    private readonly encrypted: string;

    constructor(encrypted: string) {
        this.encrypted = encrypted;
    }

    public async compareTo(password: Password): Promise<boolean> {
        return await bcrypt.compare(password.getEncrypted(), this.encrypted);
    }

    public async compareToEncrypted(encrypted: string) {
        return encrypted === this.encrypted;
    }

    public getEncrypted(): string {
        return this.encrypted;
    }
}

namespace Password {
    export const SALT_ROUNDS = 10;
}

export = Password;
