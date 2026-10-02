export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type ApiRequest = Readonly<{
  method: HttpMethod;
  endpoint: string;
  authenticated: boolean;
  multipart?: Readonly<Record<string, string>>;
  params?: Readonly<Record<string, string | number | boolean>>;
  headers?: Readonly<Record<string, string>>;
}>;
