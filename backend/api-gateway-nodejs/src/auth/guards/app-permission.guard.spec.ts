import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { AppPermissionGuard, resolveAppId } from './app-permission.guard';
import { AppAccessService } from '../app-access.service';

const MY_APP = '11111111-1111-4111-8111-111111111111';
const VICTIM_APP = '22222222-2222-4222-8222-222222222222';
const USER = '33333333-3333-4333-8333-333333333333';

function ctx(request: any, required: string | undefined) {
  const reflector = { getAllAndOverride: jest.fn().mockReturnValue(required) } as any;
  const context = {
    getHandler: () => null,
    getClass: () => null,
    switchToHttp: () => ({ getRequest: () => request }),
  } as any;
  return { reflector, context };
}

describe('resolveAppId', () => {
  it('uses the route param and ignores query/body when the route has one', () => {
    expect(
      resolveAppId({ params: { id: VICTIM_APP }, query: { id: MY_APP, app_id: MY_APP }, body: { app_id: MY_APP } }),
    ).toBe(VICTIM_APP);
  });

  it('falls back to body.app_id, then query.app_id', () => {
    expect(resolveAppId({ params: {}, body: { app_id: MY_APP }, query: {} })).toBe(MY_APP);
    expect(resolveAppId({ params: {}, body: {}, query: { app_id: MY_APP } })).toBe(MY_APP);
  });

  it('ignores the legacy query.id / body.id sources', () => {
    expect(resolveAppId({ params: {}, body: { id: MY_APP }, query: { id: MY_APP } })).toBeUndefined();
  });

  it('rejects conflicting body and query app_id', () => {
    expect(() =>
      resolveAppId({ params: {}, body: { app_id: VICTIM_APP }, query: { app_id: MY_APP } }),
    ).toThrow(BadRequestException);
  });
});

describe('AppPermissionGuard', () => {
  let access: { assertAccess: jest.Mock };

  beforeEach(() => {
    // The user can write MY_APP and has no access to VICTIM_APP.
    access = {
      assertAccess: jest.fn(async (_u: string, appId: string) => {
        if (appId === MY_APP) return { read: true, write: true, owner: true };
        throw new ForbiddenException('denied');
      }),
    };
  });

  it('blocks PUT /apps/:victim?id=<mine> (query-string bypass)', async () => {
    const request = { user: { id: USER }, params: { id: VICTIM_APP }, query: { id: MY_APP }, body: {} };
    const { reflector, context } = ctx(request, 'write');
    const guard = new AppPermissionGuard(reflector, access as unknown as AppAccessService);

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    expect(access.assertAccess).toHaveBeenCalledWith(USER, VICTIM_APP, 'write');
  });

  it('blocks POST /records?app_id=<mine> with body app_id=<victim>', async () => {
    const request = { user: { id: USER }, params: {}, query: { app_id: MY_APP }, body: { app_id: VICTIM_APP } };
    const { reflector, context } = ctx(request, 'write');
    const guard = new AppPermissionGuard(reflector, access as unknown as AppAccessService);

    await expect(guard.canActivate(context)).rejects.toThrow(BadRequestException);
    expect(access.assertAccess).not.toHaveBeenCalled();
  });

  it('allows access to an app the user holds and exposes the access level', async () => {
    const request: any = { user: { id: USER }, params: { id: MY_APP }, query: {}, body: {} };
    const { reflector, context } = ctx(request, 'owner');
    const guard = new AppPermissionGuard(reflector, access as unknown as AppAccessService);

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.appAccess).toEqual({ read: true, write: true, owner: true });
  });

  it('passes through routes without a permission requirement', async () => {
    const { reflector, context } = ctx({ params: {} }, undefined);
    const guard = new AppPermissionGuard(reflector, access as unknown as AppAccessService);
    await expect(guard.canActivate(context)).resolves.toBe(true);
  });
});
