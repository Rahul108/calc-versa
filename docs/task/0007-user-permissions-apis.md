# Task 0007: User Permission Management APIs & Granular Access Control

## Summary
Implemented dedicated User Permission Management endpoints (`/permissions` & `/apps/:id/permissions`) and granular access control guards (`AppPermissionGuard`, `@RequireAppPermission`).

## Scope & Changes
- Created `PermissionsModule` (`permissions.controller.ts`, `permissions.service.ts`).
- Implemented `GET /permissions/me` (lists all tool grants for logged-in user).
- Implemented `GET /apps/:id/permissions` (lists user access grants for a tool).
- Implemented `PUT /apps/:id/permissions/:userId` (updates read/write access levels).
- Implemented `DELETE /apps/:id/permissions/:userId` (revokes access mapping).
