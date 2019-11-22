import supertest from 'supertest';
import DatabaseConnection from '../../../../app/core/database-connection';
import SessionTokenManager from '../../../../app/core/session-token-manager';
import errors from '../../../../app/model/errors';
import UserManager from '../../../../app/model/user-manager';
import WalletRestrictions from '../../../../app/model/wallet-restrictions';
import { NotVerifiedError } from '../../../../app/server/errors';
import server from '../../../../app/server/server';
import routeTestUtils from './route-test-utils';

let agent: supertest.SuperTest<supertest.Test>;

describe('server', () => {
    describe('GET /users/walletRestrictions', () => {
        beforeAll(done => {
            server.start({
                disableLogging: true,
                doneCb: () => {
                    agent = supertest.agent(server.getServer());
                    done();
                },
                testMode: false
            });
        });

        beforeEach(async () => {
            await DatabaseConnection.transaction(async conn => {
                await conn.query('DELETE FROM `Users`');
            });
        });

        afterAll(async () => {
            await DatabaseConnection.reset();
            await server.stop();
        });

        it('should return 200 and the restrictions, if the request was valid', async () => {
            const user = await UserManager.createWithDefaultLogin({
                nickname: 'test123',
                loginData: {
                    email: 'test@test.com',
                    unencryptedPassword: 'password'
                }
            });

            const restrictions = await (await user.getWalletRestrictions()).query([ // query them all
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

            delete restrictions.id;

            await agent
                .get('/api/users/walletRestrictions')
                .set('Authorization', `bearer ${await SessionTokenManager.create(user)}`)
                .expect(200, restrictions);
        });

        it('should return 404 and no body, if the authentication failed', async () => {
            await routeTestUtils.testAuthMiddlewarePresence(agent.get('/api/users/walletRestrictions'));
        });
    });
});
