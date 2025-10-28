import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Input } from "@/components/ui/input"
import { Send } from 'lucide-react'
import { SmsTemplate, Tenant, TenantGroup } from "../types"
import { SelectedGroupMembers } from "./selected-group-members"
import { Users, User, Phone } from 'lucide-react'

interface SendSmsFormProps {
  templates?: { count: number; results: SmsTemplate[] }
  tenants?: { count: number; results: Tenant[] }
  tenantGroups?: { count: number; results: TenantGroup[] }
  onSend: (message: string, recipients: string[], groups: string[], propertyId?: string) => void
}

export function SendSmsForm({ templates, tenants, tenantGroups, onSend }: SendSmsFormProps) {
  const [newMessage, setNewMessage] = useState("")
  const [selectedTemplate, setSelectedTemplate] = useState("")
  const [recipientType, setRecipientType] = useState<RecipientType>('group')
  const [selectedGroup, setSelectedGroup] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUser, setSelectedUser] = useState<string>('')  // kept for backward compatibility
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])  // NEW: multi-select support
  const [manualNumbers, setManualNumbers] = useState('')
  const [selectedMembers, setSelectedMembers] = useState<Tenant[]>([])
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('')

  // Group tenantGroups by property for overdue rent
  const propertyGroups = tenantGroups?.results.reduce((acc, group) => {
    if (group.property) {
      if (!acc[group.property.name]) {
        acc[group.property.name] = []
      }
      acc[group.property.name].push(group)
    }
    return acc
  }, {} as Record<string, TenantGroup[]>)

  const handleTemplateSelect = (templateId: string) => {
    const template = templates?.results.find(t => t.id.toString() === templateId)
    if (template) {
      setSelectedTemplate(templateId)
      setNewMessage(template.content)
    }
  }

  // Build property options from tenants' current_unit.property (no new fetch)
  const propertyOptions = Array.from(
    new Map(
      (tenants?.results || [])
        .map(t => {
          const p = t.current_unit?.property
          return p ? [String(p.id), p.name || `Property #${p.id}`] : null
        })
        .filter(Boolean) as [string, string][]
    )
  ).map(([id, name]) => ({ id, name }))

  // Add filteredUsers for individual search
  const filteredUsers: Tenant[] = (tenants?.results || []).filter((t: Tenant) => {
    const q = searchQuery.toLowerCase()
    const name = t.user?.full_name?.toLowerCase() || ""
    const phone = (t.user?.phone || t.phone || "").toLowerCase()
    return name.includes(q) || phone.includes(q)
  })

  const handleSend = () => {
    if (!newMessage.trim()) return
    let recipients: string[] = []
    let groups: string[] = []
    switch (recipientType) {
      case 'group':
        if (selectedGroup) groups = [selectedGroup]
        break
      case 'individual':
        // Prefer multi-selection; if none, fallback to single selection
        recipients = selectedUsers.length > 0 ? selectedUsers : (selectedUser ? [selectedUser] : [])
        break
      case 'manual':
        recipients = manualNumbers.split(',').map(num => num.trim()).filter(Boolean)
        break
    }
    onSend(newMessage, recipients, groups, selectedPropertyId || undefined)
    setNewMessage("")
    setSelectedGroup('')
    setSelectedUser('')               // reset single-select
    setSelectedUsers([])              // reset multi-select
    setManualNumbers('')
    setSelectedPropertyId('')
  }

  const handleGroupSelect = (groupId: string) => {
    setSelectedGroup(groupId)
    const tenantsList = tenants?.results || []
    const scopedTenants = selectedPropertyId
      ? tenantsList.filter(t => String(t.current_unit?.property?.id) === selectedPropertyId)
      : tenantsList

    switch (groupId) {
      case 'all-tenants':
        setSelectedMembers(scopedTenants)
        break
      case 'overdue-rent':
        const overdueTenantsData = scopedTenants.filter(tenant => parseFloat(tenant.balance_due) > 0)
        setSelectedMembers(overdueTenantsData)
        break
      case 'all-landlords':
        setSelectedMembers([])
        break
      default:
        const selectedGroupObj = tenantGroups?.results.find(g => g.id.toString() === groupId)
        if (selectedGroupObj?.tenants && selectedGroupObj.tenants.length > 0) {
          const grpMembers = selectedGroupObj.tenants
          const filtered = selectedPropertyId
            ? grpMembers.filter(t => String(t.current_unit?.property?.id) === selectedPropertyId)
            : grpMembers
          setSelectedMembers(filtered)
        } else {
          setSelectedMembers([])
        }
        break
    }
}

  const handleRemoveMember = (memberId: string) => {
    setSelectedMembers(prev => prev.filter(member => member.id.toString() !== memberId))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <Label className="text-base font-medium min-w-[120px]">Template</Label>
        <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a template" />
          </SelectTrigger>
          <SelectContent>
            {templates?.results.map((template) => (
              <SelectItem key={template.id} value={template.id.toString()}>
                {template.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        <Label className="text-base font-medium">Recipients</Label>
        <RadioGroup
          value={recipientType}
          onValueChange={(value) => setRecipientType(value as RecipientType)}
          className="space-y-3"
        >
          <div className="flex items-center space-x-3 p-2 rounded-md hover:bg-accent/50 transition-colors">
            <RadioGroupItem value="group" id="group" />
            <Users className="w-5 h-5 text-muted-foreground" />
            <Label htmlFor="group" className="flex-1 cursor-pointer">Select a Group</Label>
          </div>
          <div className="flex items-center space-x-3 p-2 rounded-md hover:bg-accent/50 transition-colors">
            <RadioGroupItem value="individual" id="individual" />
            <User className="w-5 h-5 text-muted-foreground" />
            <Label htmlFor="individual" className="flex-1 cursor-pointer">Search an Individual</Label>
          </div>
          <div className="flex items-center space-x-3 p-2 rounded-md hover:bg-accent/50 transition-colors">
            <RadioGroupItem value="manual" id="manual" />
            <Phone className="w-5 h-5 text-muted-foreground" />
            <Label htmlFor="manual" className="flex-1 cursor-pointer">Enter Mobile Number(s)</Label>
          </div>
        </RadioGroup>

        {recipientType === 'group' && (
          <div className="mt-2 space-y-3">
            <Select value={selectedGroup} onValueChange={handleGroupSelect}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-tenants">All Tenants</SelectItem>
                <SelectItem value="overdue-rent">Tenants with Overdue Rent</SelectItem>
                <SelectItem value="all-landlords">All Landlords</SelectItem>
                {tenantGroups?.results.map((group) => (
                  <SelectItem key={group.id} value={group.id.toString()}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Optional Property filter */}
            <Select value={selectedPropertyId} onValueChange={(val) => setSelectedPropertyId(val)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Filter by property (optional)" />
              </SelectTrigger>
              <SelectContent>
                {propertyOptions.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedMembers.length > 0 && (
              <SelectedGroupMembers
                members={selectedMembers}
                onRemoveMember={handleRemoveMember}
              />
            )}
          </div>
        )}

        {recipientType === 'individual' && (
          <div className="space-y-2 mt-2">
            <Input
              type="text"
              placeholder="Search by name or phone"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            {/* Selected chips */}
            {selectedUsers.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {(tenants?.results || [])
                  .filter(t => selectedUsers.includes(t.id.toString()))
                  .map(t => (
                    <span
                      key={`chip-${t.id}`}
                      className="inline-flex items-center gap-2 px-2 py-1 rounded bg-accent text-accent-foreground text-xs"
                    >
                      {t.user?.full_name || t.phone || t.user?.phone}
                      <button
                        className="rounded-sm hover:bg-muted px-1"
                        onClick={() =>
                          setSelectedUsers(prev => prev.filter(id => id !== t.id.toString()))
                        }
                      >
                        ×
                      </button>
                    </span>
                  ))}
              </div>
            )}

            {searchQuery && (
              <div className="max-h-40 overflow-y-auto border rounded-md p-2">
                {filteredUsers?.map((user: Tenant) => {
                  const id = user.id.toString()
                  const isSelected = selectedUsers.includes(id) || selectedUser === id
                  return (
                    <div
                      key={user.id}
                      aria-selected={isSelected}
                      tabIndex={0}
                      className={`p-2 cursor-pointer rounded transition-colors focus:outline-none focus:ring-2 focus:ring-ring
                        ${isSelected ? 'bg-accent text-accent-foreground' : 'hover:bg-muted'}
                      `}
                      onClick={() => {
                        // Toggle in multi-select; also set single-select for legacy flow
                        setSelectedUser(id)
                        setSelectedUsers(prev =>
                          prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
                        )
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          setSelectedUser(id)
                          setSelectedUsers(prev =>
                            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
                          )
                        }
                      }}
                    >
                      {user.user?.full_name} - {user.phone || user.user?.phone}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {recipientType === 'manual' && (
          <Textarea
            placeholder="Enter numbers separated by commas (e.g., +1234567890, +0987654321)"
            value={manualNumbers}
            onChange={(e) => setManualNumbers(e.target.value)}
            className="min-h-[80px] mt-2"
          />
        )}
      </div>

      <div className="space-y-2">
        <Label className="text-base font-medium">Message</Label>
        <Textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message here"
          className="min-h-[140px]"
        />
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSend} className="w-full sm:w-auto px-6">
          <Send className="w-4 h-4 mr-2" />
          Send Message
        </Button>
      </div>
    </div>
  )
}

type RecipientType = 'group' | 'individual' | 'manual'