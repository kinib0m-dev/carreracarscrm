"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, Settings, LogOut, ChevronRight } from "lucide-react";
import { logOut } from "@/lib/auth/auth.actions";
import Link from "next/link";
import { useSidebar } from "../ui/sidebar";
import { cn } from "@/lib/utils";

type UserMenuProps = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

export function UserMenu({ name, email, image }: UserMenuProps) {
  const { open } = useSidebar();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "w-full text-left flex items-center gap-2 p-2 rounded-md hover:bg-sidebar-accent",
            !open && "justify-center"
          )}
        >
          <Avatar className="h-8 w-8">
            {image ? (
              <AvatarImage src={image} alt={name || ""} />
            ) : (
              <AvatarFallback className="bg-primary/10 text-primary">
                {name?.charAt(0) || email?.charAt(0) || "U"}
              </AvatarFallback>
            )}
          </Avatar>
          {open && (
            <>
              <div className="flex flex-col flex-1 overflow-hidden">
                <span className="text-sm font-medium truncate">{name}</span>
                <span className="text-xs text-muted-foreground truncate">
                  {email}
                </span>
              </div>
              <ChevronRight size={16} className="text-muted-foreground" />
            </>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/profile">
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/settings">
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <form
          action={async () => {
            await logOut();
          }}
        >
          <DropdownMenuItem asChild>
            <button type="submit" className="w-full cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
