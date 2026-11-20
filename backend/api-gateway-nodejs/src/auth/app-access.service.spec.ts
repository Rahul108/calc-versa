import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { AppAccessService } from './app-access.service';

const APP = '11111111-1111-4111-8111-111111111111';
const USER = '33333333-3333-4333-8333-333333333333';

function build(mapping: any, perms: any[] = []) {
  const mappingRepo = { findOne: jest.fn().mockResolvedValue(mapping) };
  const permRepo = { find: jest.fn().mockResolvedValue(perms) };
  return new AppAccessService(mappingRepo as any, permRepo as any, {} as any);
}

describe('AppAccessService', () => {
  it('rejects non-UUID app ids with 400 instead of a database error', async () => {
    await expect(build(null).getAccess(USER, 'not-a-uuid')).rejects.toThrow(BadRequestException);
  });

  it('denies users with no mapping', async () => {
    expect(await build(null).getAccess(USER, APP)).toBeNull();
    await expect(build(null).assertAccess(USER, APP, 'read')).rejects.toThrow(ForbiddenException);
  });

  it('gives the owner full access', async () => {
    expect(await build({ is_owner: true }).getAccess(USER, APP)).toEqual({ read: true, write: true, owner: true });
  });

  it('gives a mapping without permission rows read-only access (no implicit write)', async () => {
    const svc = build({ is_owner: false }, []);
    expect(await svc.getAccess(USER, APP)).toEqual({ read: true, write: false, owner: false });
    await expect(svc.assertAccess(USER, APP, 'write')).rejects.toThrow(ForbiddenException);
  });

  it('never grants owner to a non-owner, even with write', async () => {
    const svc = build({ is_owner: false }, [{ permission: { read: true, write: true } }]);
    expect(await svc.getAccess(USER, APP)).toEqual({ read: true, write: true, owner: false });
    await expect(svc.assertAccess(USER, APP, 'owner')).rejects.toThrow(ForbiddenException);
  });
});
