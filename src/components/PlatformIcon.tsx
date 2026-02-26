import { Headphones, Instagram, Youtube } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlatformIconProps {
  platformId: string;
  className?: string;
}

export function PlatformIcon({ platformId, className }: PlatformIconProps) {
  if (platformId === "youtube") {
    return <Youtube className={cn("h-8 w-8", className)} aria-hidden="true" />;
  }

  if (platformId === "instagram") {
    return <Instagram className={cn("h-8 w-8", className)} aria-hidden="true" />;
  }

  return <Headphones className={cn("h-8 w-8", className)} aria-hidden="true" />;
}
