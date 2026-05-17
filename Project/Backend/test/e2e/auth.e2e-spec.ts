import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { GatewayApiModule } from '../../src/api-gateway/gateway-api.module';
import { TcpClientService } from '../../src/api-gateway/tcp-client.service';

describe('Authentication (E2E Gateway)', () => {
  let app: INestApplication;

  const mockTcpClientService = {
    send: jest.fn().mockImplementation((service, pattern, data) => {
      if (pattern === 'user.register') {
        return Promise.resolve({
          id: 'user-123',
          email: data.email,
          name: data.name,
        });
      }
      if (pattern === 'user.login') {
        if (data.password === 'wrong') {
          return Promise.reject(new Error('Unauthorized'));
        }
        return Promise.resolve({
          accessToken: 'jwt-access-token',
          refreshToken: 'jwt-refresh-token',
          user: { id: 'user-123', email: data.email },
        });
      }
      return Promise.resolve({});
    }),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [GatewayApiModule],
    })
      .overrideProvider(TcpClientService)
      .useValue(mockTcpClientService)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/api/v1/auth/register (POST) - successfully registers user', () => {
    return request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: 'register@e2e.com',
        password: 'password123',
        name: 'Jane E2E',
      })
      .expect(201)
      .expect((res) => {
        expect(res.body.id).toBe('user-123');
        expect(res.body.email).toBe('register@e2e.com');
      });
  });

  it('/api/v1/auth/login (POST) - successfully logs in user', () => {
    return request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'register@e2e.com',
        password: 'password123',
      })
      .expect(200)
      .expect((res) => {
        expect(res.body.accessToken).toBe('jwt-access-token');
        expect(res.body.refreshToken).toBe('jwt-refresh-token');
      });
  });

  it('/api/v1/auth/login (POST) - fails login on wrong credentials', () => {
    return request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'register@e2e.com',
        password: 'wrong',
      })
      .expect(500); // gateway safeSend converts microservice errors to 500
  });
});
