import { ArgumentsHost, BadRequestException } from '@nestjs/common';
import { AllExceptionsFilter } from './all-exceptions.filter';

function createHost(): { host: ArgumentsHost; json: jest.Mock; status: jest.Mock } {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const getRequest = jest.fn().mockReturnValue({ method: 'GET', url: '/things/1' });
  const getResponse = jest.fn().mockReturnValue({ status });

  const host = {
    switchToHttp: () => ({ getRequest, getResponse }),
  } as unknown as ArgumentsHost;

  return { host, json, status };
}

describe('AllExceptionsFilter', () => {
  const filter = new AllExceptionsFilter();

  it('maps an HttpException to its own status and message', () => {
    const { host, json, status } = createHost();

    filter.catch(new BadRequestException('email is required'), host);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        method: 'GET',
        path: '/things/1',
        message: 'email is required',
      }),
    );
  });

  it('maps an unknown error to a generic 500 without leaking its message', () => {
    const { host, json, status } = createHost();

    filter.catch(new Error('connection string has a typo'), host);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 500, message: 'Internal server error' }),
    );
  });
});
