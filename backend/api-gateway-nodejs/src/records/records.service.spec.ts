import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { RecordsService } from './records.service';

const RECORD = '44444444-4444-4444-8444-444444444444';
const APP = '11111111-1111-4111-8111-111111111111';
const USER = '33333333-3333-4333-8333-333333333333';

function build(record: any, access: any) {
  const repo = { findOne: jest.fn().mockResolvedValue(record), remove: jest.fn() };
  const accessSvc = { getAccess: jest.fn().mockResolvedValue(access) };
  return { svc: new RecordsService(repo as any, accessSvc as any), repo, accessSvc };
}

describe('RecordsService record-level access', () => {
  it('returns 404 for a record on an app the user cannot access', async () => {
    const { svc, accessSvc } = build({ id: RECORD, app_id: APP }, null);
    await expect(svc.findOneForUser(USER, RECORD)).rejects.toThrow(NotFoundException);
    expect(accessSvc.getAccess).toHaveBeenCalledWith(USER, APP);
  });

  it('refuses deletion by a read-only user', async () => {
    const { svc, repo } = build({ id: RECORD, app_id: APP }, { read: true, write: false, owner: false });
    await expect(svc.removeForUser(USER, RECORD)).rejects.toThrow(ForbiddenException);
    expect(repo.remove).not.toHaveBeenCalled();
  });

  it('lets a writer delete', async () => {
    const { svc, repo } = build({ id: RECORD, app_id: APP }, { read: true, write: true, owner: false });
    await svc.removeForUser(USER, RECORD);
    expect(repo.remove).toHaveBeenCalled();
  });
});
