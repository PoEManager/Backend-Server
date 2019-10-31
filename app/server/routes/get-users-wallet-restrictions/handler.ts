import express from 'express';
import WalletRestrictions from '../../../model/wallet-restrictions';

async function handler(req: express.Request, res: express.Response) {
    req.locals.logger.info('Querying user wallet restrictions.');
    const walletRestrictions = await req.locals.user.getWalletRestrictions();
    const restrictions = await walletRestrictions.query([ // query them all
        WalletRestrictions.QueryData.IGNORE_ALT,
        WalletRestrictions.QueryData.IGNORE_FUSE,
        WalletRestrictions.QueryData.IGNORE_ALCH,
        WalletRestrictions.QueryData.IGNORE_CHAOS,
        WalletRestrictions.QueryData.IGNORE_GCP,
        WalletRestrictions.QueryData.IGNORE_EXA,
        WalletRestrictions.QueryData.IGNORE_CHROM,
        WalletRestrictions.QueryData.IGNORE_JEW,
        WalletRestrictions.QueryData.IGNORE_CHANCE,
        WalletRestrictions.QueryData.IGNORE_CHISEL,
        WalletRestrictions.QueryData.IGNORE_SCOUR,
        WalletRestrictions.QueryData.IGNORE_BLESSED,
        WalletRestrictions.QueryData.IGNORE_REGRET,
        WalletRestrictions.QueryData.IGNORE_REGAL,
        WalletRestrictions.QueryData.IGNORE_DIVINE,
        WalletRestrictions.QueryData.IGNORE_VAAL
    ]);

    res.send(restrictions);
}

export = handler;
