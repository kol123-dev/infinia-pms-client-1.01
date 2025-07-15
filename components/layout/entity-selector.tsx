"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { useEntity, type Entity } from "@/lib/context/entity-context"
import { ChevronDown, Search, Building, Users, Home, Plus } from "lucide-react"

export function EntitySelector() {
  const { currentEntity, entities, setCurrentEntity, getUnreadCount } = useEntity()
  const [searchTerm, setSearchTerm] = useState("")

  const getAllEntities = (entitiesList: Entity[]): Entity[] => {
    const result: Entity[] = []
    for (const entity of entitiesList) {
      result.push(entity)
      if (entity.landlords) result.push(...getAllEntities(entity.landlords))
      if (entity.properties) result.push(...getAllEntities(entity.properties))
    }
    return result
  }

  const filteredEntities = getAllEntities(entities).filter((entity) =>
    entity.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getEntityIcon = (type: Entity["type"]) => {
    switch (type) {
      case "agency":
        return <Building className="h-4 w-4" />
      case "landlord":
        return <Users className="h-4 w-4" />
      case "property":
        return <Home className="h-4 w-4" />
    }
  }

  const getEntityTypeLabel = (type: Entity["type"]) => {
    switch (type) {
      case "agency":
        return "Agency"
      case "landlord":
        return "Landlord"
      case "property":
        return "Property"
    }
  }

  return (
    <div className="entity-selector">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-full justify-between bg-background shadow-theme">
            <div className="flex items-center gap-2">
              {currentEntity && getEntityIcon(currentEntity.type)}
              <span className="font-medium truncate">{currentEntity?.name || "Select Entity"}</span>
              {currentEntity && getUnreadCount(currentEntity.id) > 0 && (
                <Badge variant="destructive" className="h-5 px-1.5 text-xs">
                  {getUnreadCount(currentEntity.id)}
                </Badge>
              )}
            </div>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-80 p-0" align="start">
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search entities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 input-enhanced"
              />
            </div>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {entities.map((agency) => (
              <div key={agency.id}>
                <DropdownMenuLabel className="flex items-center justify-between px-3 py-2">
                  <div className="flex items-center gap-2">
                    {getEntityIcon(agency.type)}
                    <span className="font-semibold">{agency.name}</span>
                  </div>
                  {getUnreadCount(agency.id) > 0 && (
                    <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                      {getUnreadCount(agency.id)}
                    </Badge>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => setCurrentEntity(agency)}
                  className={`mx-2 mb-1 ${currentEntity?.id === agency.id ? "bg-brand-100 dark:bg-brand-900" : ""}`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span>All Properties</span>
                    <Badge variant="outline" className="text-xs">
                      {getEntityTypeLabel(agency.type)}
                    </Badge>
                  </div>
                </DropdownMenuItem>

                {agency.landlords?.map((landlord) => (
                  <div key={landlord.id} className="ml-4">
                    <DropdownMenuItem
                      onClick={() => setCurrentEntity(landlord)}
                      className={`mx-2 mb-1 ${currentEntity?.id === landlord.id ? "bg-brand-100 dark:bg-brand-900" : ""}`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          {getEntityIcon(landlord.type)}
                          <span>{landlord.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {getUnreadCount(landlord.id) > 0 && (
                            <Badge variant="destructive" className="h-4 px-1 text-xs">
                              {getUnreadCount(landlord.id)}
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs">
                            {getEntityTypeLabel(landlord.type)}
                          </Badge>
                        </div>
                      </div>
                    </DropdownMenuItem>

                    {landlord.properties?.map((property) => (
                      <DropdownMenuItem
                        key={property.id}
                        onClick={() => setCurrentEntity(property)}
                        className={`mx-2 mb-1 ml-8 ${currentEntity?.id === property.id ? "bg-brand-100 dark:bg-brand-900" : ""}`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                            {getEntityIcon(property.type)}
                            <span>{property.name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {getUnreadCount(property.id) > 0 && (
                              <Badge variant="destructive" className="h-4 px-1 text-xs">
                                {getUnreadCount(property.id)}
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-xs">
                              {getEntityTypeLabel(property.type)}
                            </Badge>
                          </div>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </div>
                ))}

                {agency.properties?.map((property) => (
                  <DropdownMenuItem
                    key={property.id}
                    onClick={() => setCurrentEntity(property)}
                    className={`mx-2 mb-1 ml-4 ${currentEntity?.id === property.id ? "bg-brand-100 dark:bg-brand-900" : ""}`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        {getEntityIcon(property.type)}
                        <span>{property.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {getUnreadCount(property.id) > 0 && (
                          <Badge variant="destructive" className="h-4 px-1 text-xs">
                            {getUnreadCount(property.id)}
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {getEntityTypeLabel(property.type)}
                        </Badge>
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
              </div>
            ))}
          </div>
          <div className="p-2 border-t">
            <Button variant="outline" size="sm" className="w-full justify-start bg-transparent">
              <Plus className="h-4 w-4 mr-2" />
              Add New Entity
            </Button>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
