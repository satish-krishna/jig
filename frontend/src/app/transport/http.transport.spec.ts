import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { HttpTransport, API_BASE_URL } from './http.transport';

describe('HttpTransport', () => {
  let http: HttpTestingController;
  let sut: HttpTransport;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: 'http://api.test' },
        HttpTransport,
      ],
    });
    http = TestBed.inject(HttpTestingController);
    sut = TestBed.inject(HttpTransport);
  });

  afterEach(() => http.verify());

  it('lists users via GET /users', async () => {
    const promise = firstValueFrom(sut.request('users.list', {}));
    const req = http.expectOne('http://api.test/users');
    expect(req.request.method).toBe('GET');
    req.flush([{ id: '1', name: 'A', email: 'a@x.io' }]);
    expect(await promise).toEqual([{ id: '1', name: 'A', email: 'a@x.io' }]);
  });

  it('gets a user via GET /users/{id}', async () => {
    const promise = firstValueFrom(sut.request('users.get', { id: '42' }));
    const req = http.expectOne('http://api.test/users/42');
    expect(req.request.method).toBe('GET');
    req.flush({ id: '42', name: 'B', email: 'b@x.io' });
    expect((await promise).id).toBe('42');
  });

  it('saves a user via POST /users carrying the body', async () => {
    const promise = firstValueFrom(sut.request('users.save', { name: 'C', email: 'c@x.io' }));
    const req = http.expectOne('http://api.test/users');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ name: 'C', email: 'c@x.io' });
    req.flush({ id: '9', name: 'C', email: 'c@x.io' });
    expect((await promise).id).toBe('9');
  });
});
