
import DefaultLogin from './DefaultLogin';

class User {
    public getId(): User.ID {
        return 0;
    }

    public getNickname(): string {
        return '';
    }

    public setNickname(nickname: string): void {

    }

    public hasDefaultLogin(): boolean {
        return false;
    }

    public getDefaultLogin(): DefaultLogin | null {
        return null;
    }

    public getChangeState(): User.ChangeType {
        return null;
    }

    public query(queryData: User.QueryData): User.IQueryResult {
        return {};
    }

    public validate(changeId: User.ChangeID): void {

    }
}

namespace User {
    export enum _ChangeType {
        VERIFY_ACCOUNT,
        NEW_EMAIL,
        NEW_PASSWORD
    }

    export type ChangeType = _ChangeType | null;

    export enum QueryData {
        ID,
        NICKNAME
    }

    export type ChangeID = string;
    export type ID = number;

    export interface IQueryResult {
        id?: ID;
        nickname?: string;
        defaultLoginId?: DefaultLogin.ID;
    }
}

export = User;
