import express from 'express';
import { InvalidEmailConfigurationError } from '../../../app/core/errors';
import { InvalidNicknameError } from '../../../app/model/errors';
import serverUtils from '../../../app/server/server-utils';

describe('server', () => {
    describe('server-utils.ts', () => {
        describe('makeRESTableError()', () => {
            it('should return the same error if the error is a known one', () => {
                const error = new InvalidNicknameError('name');

                const createdError = serverUtils.makeRESTableError(error);

                expect(createdError).toMatchObject(error);
            });

            it('should return unexpected error if the error is a known one', () => {
                const error = {someKey: 'someValue'};

                const createdError = serverUtils.makeRESTableError(error);

                expect(createdError).toMatchObject(new serverUtils.UnexpectedError());
            });
        });

        describe('sendRESTError()', () => {
            const expressSimulator: {req: express.Request, res: express.Response} = {
                req: {
                    locals: {
                        logger: {
                            info: (...p: any) => {/* do nothing */},
                            error: (...p: any) => {/* do nothing */}
                        }
                    }
                } as unknown as express.Request,

                res: {
                    status: jest.fn(),
                    send: jest.fn()
                } as unknown as express.Response
            };

            beforeEach(() => {
                (expressSimulator.res.status as jest.Mock).mockReset();
                (expressSimulator.res.send as jest.Mock).mockReset();

                (expressSimulator.res.status as jest.Mock).mockReturnValue(expressSimulator.res);
                (expressSimulator.res.send as jest.Mock).mockReturnValue(expressSimulator.res);
            });

            it('should send the correct error if the error is a known error', () => {
                const error = new InvalidNicknameError('name');
                serverUtils.sendRESTError(expressSimulator.req, expressSimulator.res, error);

                // tslint:disable-next-line: no-unbound-method
                expect(expressSimulator.res.status).toHaveBeenCalledWith(400);
                expect(expressSimulator.res.send).toHaveBeenCalledWith(error.asRESTError());
            });

            it('should send the correct error if the error is an internal error', () => {
                const error = new InvalidEmailConfigurationError('name');
                serverUtils.sendRESTError(expressSimulator.req, expressSimulator.res, error);

                // tslint:disable-next-line: no-unbound-method
                expect(expressSimulator.res.status).toHaveBeenCalledWith(500);
                expect(expressSimulator.res.send).toHaveBeenCalledWith(error.asRESTError());
            });

            it('should send the correct error if the error is an unknown error', () => {
                const error = {someKey: 'someValue'};
                serverUtils.sendRESTError(expressSimulator.req, expressSimulator.res, error);

                // tslint:disable-next-line: no-unbound-method
                expect(expressSimulator.res.status).toHaveBeenCalledWith(500);
                expect(expressSimulator.res.send).toHaveBeenCalledWith(new serverUtils.UnexpectedError().asRESTError());
            });
        });
    });
});
