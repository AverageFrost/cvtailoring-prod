
import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogIn, LogOut, User, ChevronDown } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Header = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const isAuthPage = location.pathname === "/auth";

  return (
    <header className="w-full py-3 px-4 absolute top-0 z-10">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <Link to="/" className="text-xl font-bold text-[#3F2A51]">CV Tailor</Link>
        
        <div>
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="flex items-center gap-2 text-[#3F2A51] hover:bg-[#3F2A51]/5"
                >
                  <User className="h-4 w-4" />
                  <span className="text-sm">{user.user_metadata?.full_name || user.email}</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end" 
                className="bg-slate-800 border-slate-700 text-white shadow-lg"
              >
                <DropdownMenuItem 
                  className="cursor-pointer hover:bg-slate-700 focus:bg-slate-700"
                  onClick={signOut}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            !isAuthPage && (
              <Button 
                variant="outline" 
                size="sm"
                asChild
                className="text-[#3F2A51] border-[#3F2A51] hover:bg-[#3F2A51]/10"
              >
                <Link to="/auth">
                  <LogIn className="h-4 w-4 mr-1" />
                  Sign In
                </Link>
              </Button>
            )
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
