"use client"

import { useEntity } from "@/lib/context/entity-context"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Building, Users, Home } from "lucide-react"

export function BreadcrumbNav() {
  const { currentEntity, getEntityPath } = useEntity()

  if (!currentEntity) return null

  const path = getEntityPath(currentEntity.id)

  const getEntityIcon = (type: string) => {
    switch (type) {
      case "agency":
        return <Building className="h-3 w-3" />
      case "landlord":
        return <Users className="h-3 w-3" />
      case "property":
        return <Home className="h-3 w-3" />
    }
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {path.map((entity, index) => (
          <div key={entity.id} className="flex items-center">
            {index > 0 && <BreadcrumbSeparator />}
            <BreadcrumbItem>
              {index === path.length - 1 ? (
                <BreadcrumbPage className="flex items-center gap-1.5">
                  {getEntityIcon(entity.type)}
                  <span>{entity.name}</span>
                </BreadcrumbPage>
              ) : (
                <BreadcrumbLink href="#" className="flex items-center gap-1.5">
                  {getEntityIcon(entity.type)}
                  <span>{entity.name}</span>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </div>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
