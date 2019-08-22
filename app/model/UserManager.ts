
import User from './User';

class UserManager {
    public static create(createData: UserManager.IUserCreateData): User {
        return undefined;
    }
}

namespace UserManager {

    export interface IDefaultLoginCreateData {
        email: string;
        unencryptedPassword: string;
    }

    export interface IUserCreateData {
        nickname: string;
        loginData: IDefaultLoginCreateData;
    }

}

export = UserManager;
