import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import * as fs from 'node:fs';

export const HELIOS_CREDENTIAL_FILE = 'helios.account.json';

export interface KeyValueArray {
  [key: string]: string | number | boolean | undefined;
}

export interface HeliosDatasetResponse<T> {
  totaal?: number;
  laatste_aanpassing?: string;
  dataset: T[];
  hash?: string;
}

@Injectable()
export class APIService {
  private readonly logger = new Logger(APIService.name);
  private readonly url: string;
  private bearerToken?: string;

  constructor() {
    const file = process.env.HELIOS_CREDENTIAL_FILE || HELIOS_CREDENTIAL_FILE;
    const helios = fs.existsSync(file)
      ? JSON.parse(fs.readFileSync(file, { encoding: 'utf8' }))
      : undefined;

    if (!helios?.url) {
      throw new HttpException('Missing helios config', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    this.url = helios.url.endsWith('/') ? helios.url : `${helios.url}/`;
  }

  async setBearerToken(token?: string): Promise<void> {
    this.bearerToken = token;
  }

  async get<T>(endpoint: string, params?: KeyValueArray, headers?: Headers): Promise<T> {
    const response = await this.request('GET', endpoint, undefined, params, headers);
    return response.json() as Promise<T>;
  }

  async post<T>(endpoint: string, body: unknown, headers?: Headers): Promise<T> {
    const apiHeaders = headers ?? new Headers();
    if (!apiHeaders.has('Content-Type')) {
      apiHeaders.set('Content-Type', 'application/json');
    }

    const response = await this.request(
      'POST',
      endpoint,
      typeof body === 'string' ? body : JSON.stringify(body),
      undefined,
      apiHeaders
    );
    return response.json() as Promise<T>;
  }

  async put<T>(endpoint: string, body: unknown, headers?: Headers): Promise<T> {
    const apiHeaders = headers ?? new Headers();
    if (!apiHeaders.has('Content-Type')) {
      apiHeaders.set('Content-Type', 'application/json');
    }

    const response = await this.request(
      'PUT',
      endpoint,
      typeof body === 'string' ? body : JSON.stringify(body),
      undefined,
      apiHeaders
    );
    return response.json() as Promise<T>;
  }

  /**
   * PATCH zonder response body (bijvoorbeeld RestoreObject, geeft 202 terug)
   */
  async patch(endpoint: string, params?: KeyValueArray, headers?: Headers): Promise<void> {
    await this.request('PATCH', endpoint, undefined, params, headers);
  }

  private async request(
    method: string,
    endpoint: string,
    body?: BodyInit,
    params?: KeyValueArray,
    headers?: Headers
  ): Promise<Response> {
    const apiHeaders = headers ?? new Headers();
    if (!apiHeaders.has('Authorization') && this.bearerToken) {
      apiHeaders.set('Authorization', `Bearer ${this.bearerToken}`);
    }

    const url = new URL(endpoint, this.url);
    Object.entries(params ?? {}).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    });

    this.logger.verbose(`${method} ${url.toString()}`);

    let response: Response;
    try {
      response = await fetch(url, {
        method,
        headers: apiHeaders,
        body,
        credentials: 'include'
      });
    } catch (error: any) {
      const errorMessage = `API call to ${method} ${url.toString()} failed with an exception: ${error.message}`;
      this.logger.error(errorMessage, error.stack);
      throw new HttpException(errorMessage, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    if (!response.ok) {
      await this.handleError(response, method, url.toString(), body);
    }

    return response;
  }

  private async handleError(response: Response, method: string, url: string, body?: BodyInit): Promise<never> {
    const description = response.headers.get('X-Error-Message') || '';
    const error = {
      responseCode: response.status,
      beschrijving: description
    };

    const errorMessage = `API call failed with status ${response.status} ${response.statusText} for ${method} ${url}. Description: ${description}`;
    this.logger.error(errorMessage + (body ? `\nBODY:\n${body}` : ''));

    throw error;
  }
}
