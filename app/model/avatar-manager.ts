import fs from 'fs';
import path from 'path';
import logger from '../core/logger';
import RootDirectory from '../core/root-directory';
import User from './user';

const AVATAR_ROOT = path.join(RootDirectory.getSync(), 'user-data', 'avatars');

namespace AvatarManager {
    type Resolution = 16 | 32 | 64 | 128 | 265;

    function makeDefaultAvatarPath(resolution: Resolution) {
        return path.join(AVATAR_ROOT, `default-${resolution}.jpg`);
    }

    async function getDefaultAvatar(resolution: Resolution): Promise<Buffer> {
        return fs.readFileSync(makeDefaultAvatarPath(resolution));
    }

    function makeAvatarPath(user: User, resolution: Resolution): string {
        const userID = user.getId();
        return path.join(AVATAR_ROOT, `${userID}-${resolution}.jpg`);
    }

    async function getCustomAvatar(user: User, resolution: Resolution): Promise<Buffer> {
        const avatarPath = makeAvatarPath(user, resolution);

        if (!fs.existsSync(avatarPath)) {
            logger.error(`Custom avatar for user ${user.getId()} does not exist although it should.` +
                `The default avatar will be used.`);
            return getDefaultAvatar(resolution);
        } else {
            return fs.readFileSync(avatarPath);
        }
    }

    export async function getAvatarData(user: User, resolution: Resolution): Promise<Buffer> {
        const avatarState = await user.getAvatarState();

        switch (avatarState) {
            case User.AvatarState.DEFAULT:
            default:
                return getDefaultAvatar(resolution);
            case User.AvatarState.CUSTOM:
                return getCustomAvatar(user, resolution);
        }
    }
}

export = AvatarManager;
