import type { NextFunction, Request, Response } from 'express';
import { jsonOnlyMiddleware } from './json-only.middleware';

const run = (method: string, headers: Record<string, string>) => {
  const request = { method, headers } as unknown as Request;
  const json = jest.fn();
  const response = {
    status: jest.fn().mockReturnValue({ json }),
  } as unknown as Response;
  const next = jest.fn() as NextFunction;
  jsonOnlyMiddleware(request, response, next);
  return { response, json, next };
};

describe('jsonOnlyMiddleware', () => {
  it('refuses a POST whose body is not JSON with 415 JSON_REQUIRED', () => {
    const { response, json, next } = run('POST', {
      'content-type': 'text/plain',
      'content-length': '12',
    });

    expect(response.status).toHaveBeenCalledWith(415);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ errorCode: 'JSON_REQUIRED' }),
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('refuses a form-encoded body — what a cross-site form would send', () => {
    const { response } = run('PATCH', {
      'content-type': 'application/x-www-form-urlencoded',
      'content-length': '3',
    });

    expect(response.status).toHaveBeenCalledWith(415);
  });

  it('accepts JSON, with or without a charset', () => {
    expect(
      run('POST', { 'content-type': 'application/json', 'content-length': '2' })
        .next,
    ).toHaveBeenCalled();
    expect(
      run('POST', {
        'content-type': 'application/json; charset=utf-8',
        'content-length': '2',
      }).next,
    ).toHaveBeenCalled();
  });

  it('refuses a mutating request that declares nothing, body or not', () => {
    expect(run('POST', {}).response.status).toHaveBeenCalledWith(415);
    expect(
      run('DELETE', { 'content-length': '0' }).response.status,
    ).toHaveBeenCalledWith(415);
  });

  it('accepts a bodyless mutating request that declares JSON', () => {
    expect(
      run('POST', { 'content-type': 'application/json' }).next,
    ).toHaveBeenCalled();
    expect(
      run('DELETE', {
        'content-type': 'application/json',
        'content-length': '0',
      }).next,
    ).toHaveBeenCalled();
  });

  it('ignores safe methods', () => {
    expect(
      run('GET', { 'content-type': 'text/plain' }).next,
    ).toHaveBeenCalled();
  });
});
