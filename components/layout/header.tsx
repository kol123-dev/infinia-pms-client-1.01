"use client"

import { Bell, Search, X, Loader2, User, Building, Home, DollarSign, FileText } from "lucide-react"  // Add new icons
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import { MobileSidebar } from "./sidebar"
import { useUser } from "@/lib/context/user-context"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { useDebounce } from 'use-debounce'
import api from '@/lib/axios'  // Using configured Axios with auth interceptors
import Link from 'next/link'
import { useAuth } from "@/lib/context/auth-context";  // For logout
import { useRouter } from "next/navigation";  // For routing after logout


// Define a type for search result items (expanded based on serializer fields)
type User = {
  first_name?: string;
  last_name?: string;
  email?: string;
  // Add other fields if needed from user-context
};

type SearchResultItem = {
  id: string;
  category: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  unit_number?: string;
  payment_id?: string;
  business_name?: string;
  address?: string;
  type?: string;
  status?: string;
  amount?: number;
  user?: User;  // Fixed: Proper type for nested user object
};

export function Header() {
  const { user } = useUser();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Add these lines for logout
  const { logout } = useAuth();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Add this handleLogout function
  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      router.push('/signin');
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (debouncedSearchTerm) {
      setIsLoading(true);
      setError(null);

      api.get(`/search/?q=${debouncedSearchTerm}`)
        .then((response) => {
          // Handle the flat array of results from the backend
          if (Array.isArray(response.data.results)) {
            setResults(response.data.results);
          } else {
            // Fallback if results is not an array
            setResults([]);
            console.error('Unexpected response format:', response.data);
          }
          setIsLoading(false);
        })
        .catch((err) => {
          console.error('Search error:', err);
          if (err.response?.status === 401) {
            setError('Authentication failed. Please log in again.');
          } else {
            setError('Failed to fetch search results. Please try again.');
          }
          setIsLoading(false);
          setResults([]);
        });
    } else {
      setResults([]);
    }
  }, [debouncedSearchTerm]);

  // Group results by category for display
  const groupedResults = results.reduce<Record<string, SearchResultItem[]>>((groups, item) => {
    const category = item.category || 'other';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(item);
    return groups;
  }, {});

  // Helper function for display names with fallbacks
  const getDisplayName = (item: SearchResultItem): string => {
    const category = item.category.toLowerCase();
    if (category === 'landlords') {
      return item.business_name || `${item.user?.first_name || ''} ${item.user?.last_name || ''}`.trim() || item.user?.email || `Unnamed Landlord (${item.id})`;
    }
    if (category === 'tenants') {
      return `${item.user?.first_name || item.first_name || ''} ${item.user?.last_name || item.last_name || ''}`.trim() || item.user?.email || `Unnamed Tenant (${item.id})`;
    }
    if (category === 'properties') {
      return item.name || item.address || `Unnamed Property (${item.id})`;
    }
    if (category === 'units') {
      return item.unit_number || item.type || item.status || `Unnamed Unit (${item.id})`;
    }
    if (category === 'payments') {
      return item.payment_id || (item.amount ? `Payment of ${item.amount} (${item.status || 'Unknown'})` : `Unnamed Payment (${item.id})`);
    }
    return `Unnamed Item (${item.id})`;  // Ultimate fallback
  };

  // New: Icon mapping for categories
  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'tenants': return <User className="mr-2 h-4 w-4" />;
      case 'landlords': return <Building className="mr-2 h-4 w-4" />;
      case 'properties': return <Home className="mr-2 h-4 w-4" />;
      case 'units': return <FileText className="mr-2 h-4 w-4" />;
      case 'payments': return <DollarSign className="mr-2 h-4 w-4" />;
      default: return null;
    }
  };

  return (
    <header className="flex h-14 items-center gap-2 px-2 border-b bg-muted/40 lg:gap-4 lg:px-6 lg:h-[60px] flex-nowrap overflow-hidden">
      <MobileSidebar />
      <div className="w-full flex-1 min-w-0">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={isOpen}
              className="w-full md:w-[300px] justify-between text-sm truncate"  // Added text-sm and truncate for better mobile fit
              onClick={() => setIsOpen(true)}
            >
              <Search className="mr-1 h-4 w-4 shrink-0 opacity-50" />  {/* Reduced margin */}
              Search tenants, units, payments...
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[400px] p-0">  
            <Command>
              <div className="relative">  
                <Input
                  placeholder="Type to search..."
                  className="h-9 border-none pr-8"  
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-9 w-9"
                    onClick={() => setSearchTerm('')}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <CommandList>
                {isLoading && (
                  <CommandEmpty>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...  {/* New: Spinner */}
                  </CommandEmpty>
                )}
                {error && <CommandEmpty>{error}</CommandEmpty>}
                {!isLoading && !error && results.length === 0 && (
                  <CommandEmpty>
                    No results found. Try a different keyword?  {/* Friendlier message */}
                  </CommandEmpty>
                )}
                {Object.entries(groupedResults).map(([category, items]) => (
                  <CommandGroup 
                    key={category} 
                    heading={
                      <div className="flex items-center">
                        {getCategoryIcon(category)}  {/* New: Category icon */}
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </div>
                    }
                  >
                    {items.map((item) => (
                      <CommandItem key={item.id}>
                        <Link href={`/${category}/${item.id}`}>
                          {getDisplayName(item)}
                        </Link>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                ))}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
      <Button variant="outline" size="icon" className="ml-auto h-6 w-6 lg:h-8 lg:w-8 bg-transparent shrink-0">
        <Bell className="h-4 w-4" />
        <span className="sr-only">Toggle notifications</span>
      </Button>
      <ModeToggle className="h-6 w-6 lg:h-8 lg:w-8 shrink-0" />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" size="icon" className="rounded-full h-6 w-6 lg:h-8 lg:w-8 shrink-0">
            <Avatar className="h-6 w-6 lg:h-8 lg:w-8">
              <AvatarImage 
                src={user?.profile_image || "/avatar.jpg"} 
                alt={user?.first_name || "User"}
                className="object-cover"
              />
              <AvatarFallback>{user?.first_name?.[0]}{user?.last_name?.[0]}</AvatarFallback>
            </Avatar>
            <span className="sr-only">Toggle user menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <Link href="/profile">
            <DropdownMenuItem>My Account</DropdownMenuItem>
          </Link>
          <DropdownMenuSeparator />
          <Link href="/settings">
            <DropdownMenuItem>Settings</DropdownMenuItem>
          </Link>
          <Link href="/help">
            <DropdownMenuItem>Support</DropdownMenuItem>
          </Link>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} disabled={isLoggingOut}>
            {isLoggingOut ? 'Logging out...' : 'Logout'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
