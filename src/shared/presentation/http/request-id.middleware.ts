import { Injectable, type NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { NextFunction, Response } from 'express';
import type { RequestContext } from '../request-context';

const REQUEST_ID_HEADER = 'x-request-id';
const MAX_REQUEST_ID_LENGTH = 128;

/**
 * Primer eslabón de la cadena: asigna un identificador de correlación a cada
 * petición (o respeta el que llega del gateway) y lo devuelve en la respuesta.
 */
@Injectable()
export class RequestIdMiddleware implements NestMiddleware<RequestContext, Response> {
  use(request: RequestContext, response: Response, next: NextFunction): void {
    const incoming = request.header(REQUEST_ID_HEADER);
    const requestId =
      incoming && incoming.length <= MAX_REQUEST_ID_LENGTH ? incoming : randomUUID();
    request.requestId = requestId;
    response.setHeader(REQUEST_ID_HEADER, requestId);
    next();
  }
}
