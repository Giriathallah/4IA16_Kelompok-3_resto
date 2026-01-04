import { UserRole } from "@/generated/prisma"; // Impor dari file generated Prisma Anda

export type Permission =
  // Quiz Actions
  | "quiz:create"
  | "quiz:read:any"
  | "quiz:read:own"
  | "quiz:update:any"
  | "quiz:update:own"
  | "quiz:delete:any"
  | "quiz:delete:own"
  // Category Actions
  | "category:create"
  | "category:read"
  | "category:update"
  | "category:delete"
  // Tag Actions
  | "tag:create"
  | "tag:read"
  | "tag:update"
  | "tag:delete"
  // Quiz Attempt Actions
  | "quiz_attempt:read:any"
  | "quiz_attempt:read:own"
  | "profile:read"
  | "profile:update";

const adminPermissions: Set<Permission> = new Set([
  "quiz:create",
  "quiz:read:any",
  "quiz:update:own",
  "quiz:delete:any",
  "category:create",
  "category:read",
  "category:update",
  "category:delete",
  "tag:create",
  "tag:read",
  "tag:update",
  "tag:delete",
  "quiz_attempt:read:any",
  "profile:read",
  "profile:update",
]);

const userPermissions: Set<Permission> = new Set([
  "quiz:create",
  "quiz:read:any",
  "quiz:update:own",
  "quiz:delete:own",
  "tag:read",
  "category:read",
  "quiz_attempt:read:own",
  "profile:read",
  "profile:update",
]);

export const permissionsByRole: Record<UserRole, Set<Permission>> = {
  admin: adminPermissions,
  user: userPermissions,
};

/**
 * Checks if a role has a specific permission.
 * Admins are always granted permission.
 * @param role The user's role.
 * @param permission The permission to check for.
 * @returns boolean
 */
export const hasPermission = (
  role: UserRole,
  permission: Permission
): boolean => {
  return permissionsByRole[role]?.has(permission) ?? false;
};
