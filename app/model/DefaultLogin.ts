import Password from './Password';

class DefaultLogin {
    public getId(): DefaultLogin.ID {
        return 0;
    }

    public getEmail(): string {
        return '';
    }

    public setEmail(email: string): void {

    }

    public getPassword(): Password {

    }

    public setPassword(password: Password): void {

    }

    public getNewEmail(): string | null {
        return null;
    }

    public setNewEmail(email: string): void {

    }

    public getNewPassword(): Password | null {
        return null;
    }

    public setNewPassword(password: Password): void {

    }

    public query(queryData: DefaultLogin.DefaultLoginQueryData): DefaultLogin.IDefaultLoginQueryResult {
        return {};
    }
}

namespace DefaultLogin {
    export type ID = number;

    export enum DefaultLoginQueryData {
        ID,
        EMAIL,
        PASSWORD,
        NEW_EMAIL,
        NEW_PASSWORD
    }

    export interface IDefaultLoginQueryResult {
        id?: ID;
        email?: string;
        password?: Password;
        newEmail?: string;
        newPassword?: Password;
    }
}

export = DefaultLogin;
