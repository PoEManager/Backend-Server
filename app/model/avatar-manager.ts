import fs from 'fs';
import Jimp from 'jimp';
import path from 'path';
import logger from '../core/logger';
import RootDirectory from '../core/root-directory';
import User from './user';

const AVATAR_ROOT = path.join(RootDirectory.getSync(), 'user-data', 'avatars');

namespace AvatarManager {
    /**
     * The available resolutions for avatars.
     */
    type Resolution = 16 | 32 | 64 | 128 | 256;

    /**
     * @returns The path of the default avatar.
     */
    function makeDefaultAvatarPath(resolution: Resolution) {
        return path.join(AVATAR_ROOT, `default-${resolution}.jpg`);
    }

    /**
     * @param resolution The desired resolution.
     * @returns The default avatar in a specific resolution.
     */
    async function getDefaultAvatar(resolution: Resolution): Promise<Buffer> {
        return fs.readFileSync(makeDefaultAvatarPath(resolution));
    }

    /**
     * @param user The user to get the avatar of.
     * @param resolution The resolution to get the avatar in.
     *
     * @returns The path to a user's avatar.
     */
    function makeAvatarPath(user: User, resolution: Resolution): string {
        const userID = user.getId();
        return path.join(AVATAR_ROOT, `${userID}-${resolution}.jpg`);
    }

    /**
     * @param user The user to get the avatar of.
     * @param resolution The resolution to get the avatar in.
     *
     * @returns The custom avatar of a user.
     */
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

    /**
     * @param user The user to get the avatar of.
     * @param resolution The resolution to get the parameter in.
     *
     * @returns The default or custom avatar of a user (depending on the user's account settings).
     */
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

    /**
     * Resizes an avatar to a specific resolution.
     *
     * @param image The avatar to resize.
     * @param resolution The resolution to resize to.
     *
     * @returns The resized avatar.
     */
    async function resizeAvatar(image: Jimp, resolution: Resolution): Promise<Buffer> {
        if (image.getWidth() === resolution && image.getHeight() === resolution) {
            return await image.getBufferAsync(Jimp.MIME_JPEG);
        } else {
            return await image.resize(resolution, resolution).quality(100).getBufferAsync(Jimp.MIME_JPEG);
        }
    }

    /**
     * Creates the avatars of a user in specific sizes.
     *
     * @param user The user to create the avatar for.
     * @param data The avatar image data.
     */
    // todo fail if the image is not JPEG
    // todo check if file size limits work
    export async function importAvatar(user: User, data: Buffer) {
        for (const resolution of [16, 32, 64, 128, 256] as Resolution[]) {
            // await Jimp.read(data) each time, or the same image will be modified over and over
            const avatar = await resizeAvatar(await Jimp.read(data), resolution);
            const avatarPath = makeAvatarPath(user, resolution);

            fs.writeFileSync(avatarPath, avatar);
        }
    }
}

export = AvatarManager;
