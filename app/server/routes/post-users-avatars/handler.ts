import express from 'express';
import fileUpload from 'express-fileupload';
import AvatarManager from '../../../model/avatar-manager';
import User from '../../../model/user';

async function handler(req: express.Request, res: express.Response): Promise<void> {
    if (!req.files) {
        throw new Error('Invalid body'); // todo
    }

    const avatar = req.files.avatar as fileUpload.UploadedFile;
    const data = avatar.data;

    await AvatarManager.importAvatar(req.user, data);
    await req.user.setAvatarState(User.AvatarState.CUSTOM);
    res.send();
}

export = handler;
