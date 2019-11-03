import express from 'express';
import EmailManager from '../../../core/email-manager';
import User from '../../../model/user';
import errors from '../../errors';

async function handler(req: express.Request, res: express.Response): Promise<void> {
    req.locals.logger.info('User is making a verification request.');

    if (await req.user.isVerified()) {
        throw new errors.UserAlreadyVerifiedError(req.user.getId());
    } else {
        if (await req.user.getChangeState() !== User.ChangeType.VERIFY_ACCOUNT) { // no change ID is set yet
            await req.user.newChange(false); // if change ID is set, just resend E-Mail
        }

        await EmailManager.sendVerificationMail(req.user);
        req.locals.logger.info('Verification E-Mail sent.');
        res.send();
    }
}

export = handler;
