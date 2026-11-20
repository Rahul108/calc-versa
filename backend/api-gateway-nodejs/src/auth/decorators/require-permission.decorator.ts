import { SetMetadata } from '@nestjs/common';

export const PERMISSION_KEY = 'require_permission';

/**
 * read  - view the tool and run calculations
 * write - edit the tool configuration and its records
 * owner - manage sharing/permissions and delete the tool
 */
export type AppPermissionType = 'read' | 'write' | 'owner';

export const RequireAppPermission = (permission: AppPermissionType) =>
  SetMetadata(PERMISSION_KEY, permission);
