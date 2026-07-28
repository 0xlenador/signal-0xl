import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getAvatarUrl(address: string | null | undefined): string {
  const seed = address || '0x0';
  // Extrae los 6 caracteres después de '0x' si la dirección es válida, si no, usa el cyan por defecto
  const hexColor = address && address.length >= 8 ? address.substring(2, 8) : '00e5ff';
  return `https://api.dicebear.com/7.x/identicon/svg?seed=${seed}&backgroundColor=${hexColor}`;
}
