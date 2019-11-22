import supertest from 'supertest';
import errors from '../../../../app/model/errors';

namespace routeTestUtils {
    export async function testAuthMiddlewarePresence(test: supertest.Test) {
        await test.set('Authentication', 'bearer abc')
            .expect(404, new errors.InvalidCredentialsError()
            .asRESTError());
    }
}

export = routeTestUtils;
