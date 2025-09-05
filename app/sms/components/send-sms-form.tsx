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

type RecipientType = 'group' | 'individual' | 'manual'

interface SendSmsFormProps {
  templates?: { count: number; results: SmsTemplate[] }
  tenants?: { count: number; results: Tenant[] }
  tenantGroups?: { count: number; results: TenantGroup[] }
  onSend: (message: string, recipients: string[], groups: string[]) => void
}

export function SendSmsForm({ templates, tenants, tenantGroups, onSend }: SendSmsFormProps) {
  const [newMessage, setNewMessage] = useState("")
  const [selectedTemplate, setSelectedTemplate] = useState("")
  const [recipientType, setRecipientType] = useState<RecipientType>('group')
  const [selectedGroup, setSelectedGroup] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUser, setSelectedUser] = useState<string>('')
  const [manualNumbers, setManualNumbers] = useState('')
  const [selectedMembers, setSelectedMembers] = useState<Tenant[]>([])

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

  const handleSend = () => {
    if (!newMessage.trim()) return

    let recipients: string[] = []
    let groups: string[] = []

    switch (recipientType) {
      case 'group':
        if (selectedGroup) groups = [selectedGroup]
        break
      case 'individual':
        if (selectedUser) recipients = [selectedUser]
        break
      case 'manual':
        recipients = manualNumbers.split(',').map(num => num.trim()).filter(Boolean)
        break
    }

    onSend(newMessage, recipients, groups)
    setNewMessage("")
    setSelectedGroup('')
    setSelectedUser('')
    setManualNumbers('')
  }

  const filteredUsers = searchQuery
    ? tenants?.results.filter(tenant =>
        tenant.user?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tenant.phone?.includes(searchQuery)
      )
    : []

  const handleGroupSelect = (groupId: string) => {
    setSelectedGroup(groupId)
    
    // Handle default groups
    switch (groupId) {
      case 'all-tenants':
        setSelectedMembers(tenants?.results || [])
        break
      case 'overdue-rent':
        // Filter tenants with positive balance_due
        const overdueTenantsData = tenants?.results.filter(tenant => 
          parseFloat(tenant.balance_due) > 0
        ) || []
        setSelectedMembers(overdueTenantsData)
        break
      case 'all-landlords':
        // You'll need to fetch landlords data or handle this case appropriately
        setSelectedMembers([])
        break
      default:
        // Handle custom tenant groups
        const selectedGroup = tenantGroups?.results.find(g => g.id.toString() === groupId)
        if (selectedGroup?.tenants && selectedGroup.tenants.length > 0) {
          setSelectedMembers(selectedGroup.tenants)
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
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
          <SelectTrigger className="w-[300px]">
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
        <Label>Recipients</Label>
        <RadioGroup
          value={recipientType}
          onValueChange={(value) => setRecipientType(value as RecipientType)}
          className="space-y-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="group" id="group" />
            <Label htmlFor="group">Select a Group</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="individual" id="individual" />
            <Label htmlFor="individual">Search an Individual</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="manual" id="manual" />
            <Label htmlFor="manual">Enter Mobile Number(s)</Label>
          </div>
        </RadioGroup>

        {recipientType === 'group' && (
          <>
            <Select value={selectedGroup} onValueChange={handleGroupSelect}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a group" />
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

            {selectedMembers.length > 0 && (
              <SelectedGroupMembers
                members={selectedMembers}
                onRemoveMember={handleRemoveMember}
              />
            )}
          </>
        )}

        {recipientType === 'individual' && (
          <div className="space-y-2">
            <Input
              type="text"
              placeholder="Search by name or phone number"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <div className="max-h-40 overflow-y-auto border rounded-md p-2">
                {filteredUsers?.map((user) => (
                  <div
                    key={user.id}
                    className={`p-2 cursor-pointer hover:bg-gray-100 rounded ${selectedUser === user.id.toString() ? 'bg-gray-100' : ''}`}
                    onClick={() => setSelectedUser(user.id.toString())}
                  >
                    {user.user?.full_name} - {user.phone}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {recipientType === 'manual' && (
          <Textarea
            placeholder="Enter phone numbers separated by commas"
            value={manualNumbers}
            onChange={(e) => setManualNumbers(e.target.value)}
            className="min-h-[80px]"
          />
        )}
      </div>

      <div className="space-y-2">
        <Label>Message</Label>
        <Textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message here"
          className="min-h-[100px]"
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button onClick={handleSend}>
          <Send className="w-4 h-4 mr-2" />
          Send Message
        </Button>
      </div>
    </div>
  )
}