import { SetMetadata } from '@nestjs/common';

export const PERMISSION_KEY = 'require_permission';
export type AppPermissionType = 'read' | 'write';

export const RequireAppPermission = (permission: AppPermissionType) =>
  SetMetadata(PERMISSION_KEY, permission);
