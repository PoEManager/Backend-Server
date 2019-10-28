import fs from 'fs';
import path from 'path';
import logger from '../core/logger';
import RootDirectory from '../core/root-directory';
import User from './user';

const AVATAR_ROOT = path.join(RootDirectory.getSync(), 'user-data', 'avatars');
const DEFAULT_AVATAR_PATH = path.join(AVATAR_ROOT, 'default.jpg');

namespace AvatarManager {
    async function getDefaultAvatar(): Promise<Buffer> {
        return fs.readFileSync(DEFAULT_AVATAR_PATH);
    }

    function makeAvatarPath(user: User): string {
        const userID = user.getId();
        return path.join(AVATAR_ROOT, `${userID}.jpg`);
    }

    async function getCustomAvatar(user: User): Promise<Buffer> {
        const avatarPath = makeAvatarPath(user);

        if (!fs.existsSync(avatarPath)) {
            logger.error(`Custom avatar for user ${user.getId()} does not exist although it should.` +
                `The default avatar will be used.`);
            return getDefaultAvatar();
        } else {
            return fs.readFileSync(avatarPath);
        }
    }

    export async function getAvatarData(user: User): Promise<Buffer> {
        const avatarState = await user.getAvatarState();

        switch (avatarState) {
            case User.AvatarState.DEFAULT:
            default:
                return getDefaultAvatar();
            case User.AvatarState.CUSTOM:
                    return getCustomAvatar(user);
        }
    }
}

export = AvatarManager;
