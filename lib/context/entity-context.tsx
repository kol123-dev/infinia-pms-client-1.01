"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

export interface Entity {
  id: string
  name: string
  type: "agency" | "landlord" | "property"
  parentId?: string
  unreadCount?: number
  properties?: Entity[]
  landlords?: Entity[]
}

interface EntityContextType {
  currentEntity: Entity | null
  entities: Entity[]
  setCurrentEntity: (entity: Entity) => void
  getEntityPath: (entityId: string) => Entity[]
  getUnreadCount: (entityId: string) => number
}

const EntityContext = createContext<EntityContextType | undefined>(undefined)

const mockEntities: Entity[] = [
  {
    id: "agency-1",
    name: "PropertyPro Management",
    type: "agency",
    unreadCount: 12,
    landlords: [
      {
        id: "landlord-1",
        name: "Johnson Holdings",
        type: "landlord",
        parentId: "agency-1",
        unreadCount: 5,
        properties: [
          { id: "property-1", name: "Sunset Apartments", type: "property", parentId: "landlord-1", unreadCount: 2 },
          { id: "property-2", name: "Garden View", type: "property", parentId: "landlord-1", unreadCount: 1 },
        ],
      },
      {
        id: "landlord-2",
        name: "Smith Properties",
        type: "landlord",
        parentId: "agency-1",
        unreadCount: 3,
        properties: [
          { id: "property-3", name: "Downtown Complex", type: "property", parentId: "landlord-2", unreadCount: 2 },
        ],
      },
    ],
    properties: [
      { id: "property-4", name: "Riverside Towers", type: "property", parentId: "agency-1", unreadCount: 4 },
    ],
  },
]

export function EntityProvider({ children }: { children: React.ReactNode }) {
  const [currentEntity, setCurrentEntityState] = useState<Entity | null>(null)
  const [entities] = useState<Entity[]>(mockEntities)

  useEffect(() => {
    // Load last selected entity from localStorage
    const savedEntityId = localStorage.getItem("currentEntityId")
    if (savedEntityId) {
      const entity = findEntityById(savedEntityId, entities)
      if (entity) {
        setCurrentEntityState(entity)
      }
    } else {
      // Default to agency level
      setCurrentEntityState(entities[0])
    }
  }, [entities])

  const setCurrentEntity = (entity: Entity) => {
    setCurrentEntityState(entity)
    localStorage.setItem("currentEntityId", entity.id)
  }

  const findEntityById = (id: string, entitiesList: Entity[]): Entity | null => {
    for (const entity of entitiesList) {
      if (entity.id === id) return entity
      if (entity.landlords) {
        const found = findEntityById(id, entity.landlords)
        if (found) return found
      }
      if (entity.properties) {
        const found = findEntityById(id, entity.properties)
        if (found) return found
      }
    }
    return null
  }

  const getEntityPath = (entityId: string): Entity[] => {
    const path: Entity[] = []
    const findPath = (id: string, entitiesList: Entity[], currentPath: Entity[]): boolean => {
      for (const entity of entitiesList) {
        const newPath = [...currentPath, entity]
        if (entity.id === id) {
          path.push(...newPath)
          return true
        }
        if (entity.landlords && findPath(id, entity.landlords, newPath)) return true
        if (entity.properties && findPath(id, entity.properties, newPath)) return true
      }
      return false
    }
    findPath(entityId, entities, [])
    return path
  }

  const getUnreadCount = (entityId: string): number => {
    const entity = findEntityById(entityId, entities)
    return entity?.unreadCount || 0
  }

  return (
    <EntityContext.Provider
      value={{
        currentEntity,
        entities,
        setCurrentEntity,
        getEntityPath,
        getUnreadCount,
      }}
    >
      {children}
    </EntityContext.Provider>
  )
}

export function useEntity() {
  const context = useContext(EntityContext)
  if (context === undefined) {
    throw new Error("useEntity must be used within an EntityProvider")
  }
  return context
}
