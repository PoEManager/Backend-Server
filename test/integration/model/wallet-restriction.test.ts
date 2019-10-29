import DatabaseConnection from '../../../app/core/database-connection';
import errors from '../../../app/model/errors';
import UserManager from '../../../app/model/user-manager';
import WalletRestrictions from '../../../app/model/wallet-restrictions';

describe('model', () => {
    describe('wallet-restriction.ts', () => {
        beforeEach(async () => {
            await DatabaseConnection.transaction(async conn => {
                await conn.query('DELETE FROM `Users`');
            });
        });

        afterEach(async () => {
            await DatabaseConnection.transaction(async conn => {
                await conn.query('DELETE FROM `Users`');
            });
        });

        afterAll(async () => {
            await DatabaseConnection.reset();
        });

        describe('getRestriction()', () => {
            it('should correctly query a restriction', async () => {
                const user = await UserManager.create({
                    nickname: 'nickname',
                    loginData: {
                        email: 'test@test.com',
                        unencryptedPassword: 'password'
                    }
                });

                const restrictions = await user.getWalletRestrictions();
                const restriction = await restrictions.getRestriction(WalletRestrictions.QueryData.IGNORE_ALCH);

                expect(restriction).toBe(0);
            });

            it('should throw WalletRestrictionsNotFoundError error if the login does note exist', async () => {
                await expect(new WalletRestrictions(-1).getRestriction(WalletRestrictions.QueryData.IGNORE_ALCH))
                    .rejects.toEqual(new errors.WalletRestrictionsNotFoundError(-1));
            });
        });

        describe('setRestriction()', () => {
            it('should correctly set a restriction', async () => {
                const user = await UserManager.create({
                    nickname: 'nickname',
                    loginData: {
                        email: 'test@test.com',
                        unencryptedPassword: 'password'
                    }
                });

                const restrictions = await user.getWalletRestrictions();
                let restriction = await restrictions.getRestriction(WalletRestrictions.QueryData.IGNORE_ALCH);
                expect(restriction).toBe(0);

                await restrictions.setRestriction(WalletRestrictions.QueryData.IGNORE_ALCH, 1);

                restriction = await restrictions.getRestriction(WalletRestrictions.QueryData.IGNORE_ALCH);
                expect(restriction).toBe(1);
            });

            it('should throw WalletRestrictionsNotFoundError error if the login does note exist', async () => {
                await expect(new WalletRestrictions(-1).setRestriction(WalletRestrictions.QueryData.IGNORE_ALCH, 1))
                    .rejects.toEqual(new errors.WalletRestrictionsNotFoundError(-1));
            });
        });

        describe('query()', () => {
            it('should correctly query the wallet restriction\'s attributes', async () => {
                const user = await UserManager.create({
                    nickname: 'nickname',
                    loginData: {
                        email: 'test@test.com',
                        unencryptedPassword: 'password'
                    }
                });

                const restrictions = await user.getWalletRestrictions();

                await restrictions.setRestriction(WalletRestrictions.QueryData.IGNORE_ALT, 0);
                await restrictions.setRestriction(WalletRestrictions.QueryData.IGNORE_FUSE, 1);
                await restrictions.setRestriction(WalletRestrictions.QueryData.IGNORE_ALCH, 2);
                await restrictions.setRestriction(WalletRestrictions.QueryData.IGNORE_CHAOS, 3);
                await restrictions.setRestriction(WalletRestrictions.QueryData.IGNORE_GCP, 4);
                await restrictions.setRestriction(WalletRestrictions.QueryData.IGNORE_EXA, 5);
                await restrictions.setRestriction(WalletRestrictions.QueryData.IGNORE_CHROM, 6);
                await restrictions.setRestriction(WalletRestrictions.QueryData.IGNORE_JEW, 7);
                await restrictions.setRestriction(WalletRestrictions.QueryData.IGNORE_CHANCE, 8);
                await restrictions.setRestriction(WalletRestrictions.QueryData.IGNORE_CHISEL, 9);
                await restrictions.setRestriction(WalletRestrictions.QueryData.IGNORE_SCOUR, 10);
                await restrictions.setRestriction(WalletRestrictions.QueryData.IGNORE_BLESSED, 11);
                await restrictions.setRestriction(WalletRestrictions.QueryData.IGNORE_REGRET, 12);
                await restrictions.setRestriction(WalletRestrictions.QueryData.IGNORE_REGAL, 13);
                await restrictions.setRestriction(WalletRestrictions.QueryData.IGNORE_DIVINE, 14);
                await restrictions.setRestriction(WalletRestrictions.QueryData.IGNORE_VAAL, 15);

                await expect(restrictions.query([
                    WalletRestrictions.QueryData.ID,
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
                ])).resolves.toMatchObject({
                    id: restrictions.getId(),
                    ignoreAlt: 0,
                    ignoreFuse: 1,
                    ignoreAlch: 2,
                    ignoreChaos: 3,
                    ignoreGcp: 4,
                    ignoreExa: 5,
                    ignoreChrom: 6,
                    ignoreJew: 7,
                    ignoreChance: 8,
                    ignoreChisel: 9,
                    ignoreScour: 10,
                    ignoreBlessed: 11,
                    ignoreRegret: 12,
                    ignoreRegal: 13,
                    ignoreDivine: 14,
                    ignoreVaal: 15
                });
            });

            it('should not set attributes that were not queried (some queried attributes)', async () => {
                const user = await UserManager.create({
                    nickname: 'nickname',
                    loginData: {
                        email: 'test@test.com',
                        unencryptedPassword: 'password'
                    }
                });

                const restrictions = await user.getWalletRestrictions();

                await expect(restrictions.query([])).resolves.toMatchObject({});
            });

            it('should not set attributes that were not queried (no queried attributes)', async () => {
                const user = await UserManager.create({
                    nickname: 'nickname',
                    loginData: {
                        email: 'test@test.com',
                        unencryptedPassword: 'password'
                    }
                });

                const restrictions = await user.getWalletRestrictions();

                await expect(restrictions.query([WalletRestrictions.QueryData.ID]))
                    .resolves.toMatchObject({id: restrictions.getId()});
            });

            it('should throw UserNotFound error if the user does note exist', async () => {
                await expect(new WalletRestrictions(-1).query([]))
                    .rejects.toEqual(new errors.WalletRestrictionsNotFoundError(-1));
            });
        });
    });
});
