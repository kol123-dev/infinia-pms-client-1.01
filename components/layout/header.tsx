"use client"

import { Bell, Search, X, Loader2, User, Building, Home, DollarSign, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import { MobileSidebar } from "./sidebar"
import { useUser } from "@/lib/context/user-context"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useState, useEffect, useRef, useCallback } from 'react'
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
import api from '@/lib/axios'
import Link from 'next/link'
import { useAuth } from "@/lib/context/auth-context"
import { useRouter } from "next/navigation"
import { TenantDetails } from "@/app/tenants/components/tenant-details"
import { Tenant } from "@/app/tenants/types"
import { LandlordDetails } from "@/app/landlords/components/landlord-details"
import { PropertyDetails } from "@/app/properties/components/property-details"
import { UnitDetails } from "@/app/units/components/unit-details"

// Define a type for search result items
type User = {
  first_name?: string;
  last_name?: string;
  email?: string;
  full_name?: string;
};

// Define Landlord interface
interface Landlord {
  id: number
  landlord_id: string | null
  user: {
    id: number
    email: string
    full_name: string
    phone: string
    role: string
    is_active: boolean
  }
  agent: any | null
  name: string | null
  email: string | null
  phone: string | null
  id_number: string | null
  business_name: string
  company_registration_number: string | null
  created_at: string
  properties: {
    id: number
    name: string
    total_units: number
    actual_monthly_revenue: number
  }[] | null
}

// Define Property interface
interface Property {
  id: number
  property_id: string | null
  name: string | null
  property_type: string
  building_type: string
  description: string
  location: {
    address: string
    coordinates: {
      lat: number | null
      lng: number | null
    }
  }
  landlord: {
    id: number
    landlord_id: string | null
    user: {
      id: number
      email: string
      full_name: string
      phone: string
      role: string
      is_active: boolean
    }
    agent: {
      id: number
      user: {
        id: number
        email: string
        full_name: string
      }
    } | null
    phone: string
    business_name: string
    properties: Array<any>
    created_at: string
  } | null
  agent: {
    id: number
    name: string
  } | null
  property_manager: {
    id: number
    name: string
  } | null
  // Update the units property in the Property interface
  units: {
    summary: {
      total: number
      occupied: number
      vacant: number
      underMaintenance: number
      occupancyRate: number
    }
    distribution: Record<string, any>
    metrics: {
      averageRent: number
      averageOccupancyDuration: string | null
      expiringLeases: number
    }
  }
  financials: any | null
}

// Define Unit interface
interface Unit {
  id: number
  unit_id: string
  unit_number: string
  property: {
    id: number
    name: string
    address: string
    city: string
    state: string
    zip_code: string
  }
  current_tenant?: {
    id: number
    user: {
      id: number
      full_name: string
      email: string
      phone: string
    }
    lease_start_date: string
    lease_end_date: string
  }
  unit_type: string
  unit_status: 'VACANT' | 'OCCUPIED' | 'MAINTENANCE'
  floor: number
  size: number
  rent: number
  deposit: number
  amenities: string[]
  features: {
    parking_spots: number
    storage_unit: boolean
  }
  created_at: string
  updated_at: string
  tenant_history: any[]
}

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
  user?: User;
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
  
  // State for tenant details dialog
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [isTenantDetailsOpen, setIsTenantDetailsOpen] = useState(false);
  
  // State for landlord details dialog
  const [selectedLandlord, setSelectedLandlord] = useState<Landlord | null>(null);
  const [isLandlordDetailsOpen, setIsLandlordDetailsOpen] = useState(false);
  
  // State for property details dialog
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isPropertyDetailsOpen, setIsPropertyDetailsOpen] = useState(false);
  
  // State for unit details dialog
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [isUnitDetailsOpen, setIsUnitDetailsOpen] = useState(false);

  // Auth and routing
  const { logout } = useAuth();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Handle logout
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

  // Optimized tenant click handler with useCallback
  const handleTenantClick = useCallback(async (tenantId: string) => {
    try {
      const response = await api.get(`/tenants/${tenantId}/`);
      setSelectedTenant(response.data);
      setIsTenantDetailsOpen(true);
      setIsOpen(false); // Close the search popover
    } catch (error) {
      console.error('Failed to fetch tenant details:', error);
      // Fallback to navigation if API call fails
      router.push(`/tenants/${tenantId}`);
    }
  }, [router]);
  
  // Landlord click handler
  const handleLandlordClick = useCallback(async (landlordId: string) => {
    try {
      const response = await api.get(`/landlords/${landlordId}/`);
      setSelectedLandlord(response.data);
      setIsLandlordDetailsOpen(true);
      setIsOpen(false); // Close the search popover
    } catch (error) {
      console.error('Failed to fetch landlord details:', error);
      // Fallback to navigation if API call fails
      router.push(`/landlords/${landlordId}`);
    }
  }, [router]);
  
  // Property click handler
  const handlePropertyClick = useCallback(async (propertyId: string) => {
    try {
      const response = await api.get(`/properties/${propertyId}/`);
      setSelectedProperty(response.data);
      setIsPropertyDetailsOpen(true);
      setIsOpen(false); // Close the search popover
    } catch (error) {
      console.error('Failed to fetch property details:', error);
      // Fallback to navigation if API call fails
      router.push(`/properties/${propertyId}`);
    }
  }, [router]);
  
  // Unit click handler
  const handleUnitClick = useCallback(async (unitId: string) => {
    try {
      const response = await api.get(`/units/${unitId}/`);
      setSelectedUnit(response.data);
      setIsUnitDetailsOpen(true);
      setIsOpen(false); // Close the search popover
    } catch (error) {
      console.error('Failed to fetch unit details:', error);
      // Fallback to navigation if API call fails
      router.push(`/units/${unitId}`);
    }
  }, [router]);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search API call
  useEffect(() => {
    if (!debouncedSearchTerm) {
      setResults([]);
      return;
    }
    
    setIsLoading(true);
    setError(null);

    api.get(`/search/?q=${debouncedSearchTerm}`)
      .then((response) => {
        if (Array.isArray(response.data.results)) {
          setResults(response.data.results);
        } else {
          setResults([]);
          console.error('Unexpected response format:', response.data);
        }
      })
      .catch((err) => {
        console.error('Search error:', err);
        setError(err.response?.status === 401 
          ? 'Authentication failed. Please log in again.' 
          : 'Failed to fetch search results. Please try again.');
        setResults([]);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [debouncedSearchTerm]);

  // Group results by category - memoized for performance
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
    return `Unnamed Item (${item.id})`;
  };

  // Icon mapping for categories
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

  // Handle dialog close
  const handleTenantDialogClose = useCallback(() => {
    setIsTenantDetailsOpen(false);
  }, []);
  
  // Handle landlord dialog close
  const handleLandlordDialogClose = useCallback(() => {
    setIsLandlordDetailsOpen(false);
  }, []);
  
  // Handle property dialog close
  const handlePropertyDialogClose = useCallback(() => {
    setIsPropertyDetailsOpen(false);
  }, []);
  
  // Handle unit dialog close
  const handleUnitDialogClose = useCallback(() => {
    setIsUnitDetailsOpen(false);
  }, []);
  
  // Dummy handlers for edit and delete (required by LandlordDetails props)
  const handleLandlordEdit = useCallback((landlord: Landlord) => {
    setIsLandlordDetailsOpen(false);
    router.push(`/landlords/${landlord.id}/edit`);
  }, [router]);
  
  const handleLandlordDelete = useCallback((landlord: Landlord) => {
    setIsLandlordDetailsOpen(false);
    router.push(`/landlords/${landlord.id}`);
  }, [router]);
  
  // Dummy handlers for property delete
  const handlePropertyDelete = useCallback(() => {
    setIsPropertyDetailsOpen(false);
    router.refresh();
  }, [router]);
  
  // Dummy handlers for unit edit and delete
  const handleUnitEdit = useCallback(() => {
    setIsUnitDetailsOpen(false);
  }, []);
  
  const handleUnitDelete = useCallback(() => {
    setIsUnitDetailsOpen(false);
  }, []);

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
              className="w-full md:w-[300px] justify-between text-sm truncate"
              onClick={() => setIsOpen(true)}
            >
              <Search className="mr-1 h-4 w-4 shrink-0 opacity-50" />
              Search tenants, units, payments...
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[400px] p-0" ref={popoverRef}>  
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
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...
                  </CommandEmpty>
                )}
                {error && <CommandEmpty>{error}</CommandEmpty>}
                {!isLoading && !error && results.length === 0 && (
                  <CommandEmpty>
                    No results found. Try a different keyword?
                  </CommandEmpty>
                )}
                {Object.entries(groupedResults).map(([category, items]) => (
                  <CommandGroup 
                    key={category} 
                    heading={
                      <div className="flex items-center">
                        {getCategoryIcon(category)}
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </div>
                    }
                  >
                    {items.map((item) => (
                      <CommandItem key={item.id}>
                        {category.toLowerCase() === 'tenants' ? (
                          <div 
                            className="w-full cursor-pointer" 
                            onClick={() => handleTenantClick(item.id)}
                          >
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {item.user?.full_name || `${item.user?.first_name || ''} ${item.user?.last_name || ''}`.trim() || `Tenant ${item.id}`}
                              </span>
                              {item.user?.email && (
                                <span className="text-xs text-muted-foreground">{item.user.email}</span>
                              )}
                            </div>
                          </div>
                        ) : category.toLowerCase() === 'landlords' ? (
                          <div 
                            className="w-full cursor-pointer" 
                            onClick={() => handleLandlordClick(item.id)}
                          >
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {item.business_name || `${item.user?.first_name || ''} ${item.user?.last_name || ''}`.trim() || `Landlord ${item.id}`}
                              </span>
                              {item.user?.email && (
                                <span className="text-xs text-muted-foreground">{item.user.email}</span>
                              )}
                            </div>
                          </div>
                        ) : category.toLowerCase() === 'properties' ? (
                          <div 
                            className="w-full cursor-pointer" 
                            onClick={() => handlePropertyClick(item.id)}
                          >
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {item.name || item.address || `Property ${item.id}`}
                              </span>
                            </div>
                          </div>
                        ) : category.toLowerCase() === 'units' ? (
                          <div 
                            className="w-full cursor-pointer" 
                            onClick={() => handleUnitClick(item.id)}
                          >
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {item.unit_number || `Unit ${item.id}`}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <Link href={`/${category}/${item.id}`} className="w-full">
                            {getDisplayName(item)}
                          </Link>
                        )}
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

      {/* Tenant Details Dialog */}
      {selectedTenant && (
        <TenantDetails
          tenant={selectedTenant}
          isOpen={isTenantDetailsOpen}
          onClose={handleTenantDialogClose}
        />
      )}
      
      {/* Landlord Details Dialog */}
      {selectedLandlord && (
        <LandlordDetails
          landlord={selectedLandlord}
          isOpen={isLandlordDetailsOpen}
          onClose={handleLandlordDialogClose}
          onEdit={handleLandlordEdit}
          onDelete={handleLandlordDelete}
        />
      )}
      
      {/* Property Details Dialog */}
      {selectedProperty && (
        <PropertyDetails
          property={selectedProperty}
          isOpen={isPropertyDetailsOpen}
          onClose={handlePropertyDialogClose}
          onDelete={handlePropertyDelete}
        />
      )}
      
      {/* Unit Details Dialog */}
      {selectedUnit && (
        <UnitDetails
          unit={selectedUnit}
          isOpen={isUnitDetailsOpen}
          onClose={handleUnitDialogClose}
          onEdit={handleUnitEdit}
          onDelete={handleUnitDelete}
        />
      )}
    </header>
  );
}