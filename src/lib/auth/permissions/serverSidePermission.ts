import { type UserSession } from "../session";
import { type Permission, hasPermission } from "./rbac";
import { UserRole } from "@/generated/prisma";

type ResourceWithCreator = {
  creatorId?: string | null;
};

export class AuthError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
  }
}
export function authorize(
  user: UserSession | null,
  permission: Permission,
  resource?: ResourceWithCreator
) {
  if (!user?.id || !user?.role) {
    throw new AuthError(401, "Authentication required.");
  }

  const userRole = user.role as UserRole;

  if (hasPermission(userRole, permission)) {
    return;
  }

  if (resource?.creatorId) {
    const isOwner = resource.creatorId === user.id;
    const ownPermission = permission.replace(":any", ":own") as Permission;

    if (isOwner && hasPermission(userRole, ownPermission)) {
      return;
    }
  }

  throw new AuthError(
    403,
    "You do not have permission to perform this action."
  );
}
