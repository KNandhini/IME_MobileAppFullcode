import { UserInfo } from "@/types/userinfo";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getCurrentUser(): UserInfo | null {
  const stored = localStorage.getItem("currentEmployee");
  try {
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function hasRole(roleName: string): boolean {
  const user = getCurrentUser();
  return (
    user?.roles?.some(
      (role) => role.toLowerCase() === roleName.toLowerCase()
    ) ?? false
  );
}

export function isAdmin(): boolean {
  return hasRole("admin");
}
