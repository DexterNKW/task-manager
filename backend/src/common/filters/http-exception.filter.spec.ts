import { ArgumentsHost, Logger, NotFoundException } from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';

function createHost(url = '/api/tasks/1') {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const host = {
    switchToHttp: () => ({
      getResponse: () => ({ status }),
      getRequest: () => ({ url }),
    }),
  } as unknown as ArgumentsHost;
  return { host, status, json };
}

describe('HttpExceptionFilter', () => {
  const filter = new HttpExceptionFilter();
  let logError: jest.SpyInstance;

  beforeEach(() => {
    logError = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('keeps the status and message of HTTP exceptions', () => {
    const { host, status, json } = createHost();

    filter.catch(new NotFoundException('Task 1 not found'), host);

    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 404,
        message: 'Task 1 not found',
        error: 'NOT_FOUND',
        path: '/api/tasks/1',
      }),
    );
  });

  it('does not expose the message of unexpected errors', () => {
    const { host, status, json } = createHost();

    filter.catch(new Error('SQLITE_CORRUPT: database disk image'), host);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 500,
        message: 'Internal server error',
      }),
    );
  });

  it('logs unexpected errors with their stack', () => {
    const { host } = createHost();
    const error = new Error('boom');

    filter.catch(error, host);

    expect(logError).toHaveBeenCalledWith(
      expect.stringContaining('boom'),
      error.stack,
    );
  });
});
