"use client"

import { useState } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useQueryClient } from '@tanstack/react-query'
import { useQuery } from "@tanstack/react-query"
import axios from "@/lib/axios"
import { SmsMessage, SmsTemplate, Tenant, TenantGroup, User } from "./types"
import { MessageDetailsModal } from "./components/message-details-modal"
import { EditTemplateDialog } from "./components/edit-template-dialog"
import { DeleteTemplateDialog } from "./components/delete-template-dialog"
import { SendSmsForm } from "./components/send-sms-form"
import { MessageHistory } from "./components/message-history"
import { useUser } from "@/lib/context/user-context"
import { Button } from "@/components/ui/button"
import { Plus, Send } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Users, MessageSquare, Clock } from 'lucide-react'
import { TenantGroupDialog } from "./components/tenant-group-dialog"

// Remove the local interface definitions since we're importing them from types.ts

export default function SMS() {
  const { user } = useUser() as { user: User | null }
  const queryClient = useQueryClient()
  const [selectedMessage, setSelectedMessage] = useState<SmsMessage | null>(null)
  const [editingTemplate, setEditingTemplate] = useState<SmsTemplate | null>(null)
  const [deletingTemplate, setDeletingTemplate] = useState<SmsTemplate | null>(null)
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false)
  
  // KEEP ONLY THESE QUERY DECLARATIONS (with trailing slashes removed)
  const { data: smsMessages } = useQuery<{ count: number, results: SmsMessage[] }>({ 
    queryKey: ["sms-messages"],
    queryFn: async () => {
      const response = await axios.get("/communications/messages/")  // Add trailing slash back
      return response.data
    }
  })

  const { data: templates } = useQuery<{ count: number, results: SmsTemplate[] }>({ 
    queryKey: ["sms-templates"],
    queryFn: async () => {
      const response = await axios.get("/communications/templates/")  // Add trailing slash back
      return response.data
    }
  })

  const { data: tenants } = useQuery<{ count: number, results: Tenant[] }>({ 
    queryKey: ["tenants"],
    queryFn: async () => {
      const response = await axios.get("/tenants/")  // Add trailing slash back
      return response.data
    }
  })

  // For the useQuery:
  const { data: tenantGroups } = useQuery<{ count: number, results: TenantGroup[] }>({ 
    queryKey: ["tenant-groups"],
    queryFn: async () => {
      const response = await axios.get("/tenants/groups")  // Remove trailing slash to match SimpleRouter
      return response.data
    }
  })
  
  // REMOVE THE DUPLICATE DECLARATIONS THAT WERE HERE
  
  // Corrected handleCreateGroup function (replaces the malformed block)
  const handleCreateGroup = async (data: { name: string; property: string; tenants: string[] }) => {
    try {
      await axios.post("/tenants/groups", {  // Remove trailing slash
        name: data.name,
        property: data.property,
        tenants: data.tenants,
        landlord: user?.landlord_profile?.id || user?.agent_profile?.managed_landlords[0]?.id
      })
      queryClient.invalidateQueries({ queryKey: ["tenant-groups"] })
      setIsGroupDialogOpen(false)
    } catch (error) {
      console.error('Failed to create group:', error)
    }
  }
  
  const handleSendMessage = async (message: string, recipients: string[], groups: string[]) => {
    try {
      // Separate manual numbers from tenant IDs
      const tenantIds = recipients.filter((r) => /^\d+$/.test(r)).map((r) => Number(r))
      const manualNumbers = recipients.filter((r) => !/^\d+$/.test(r))

      // Prefer landlord from selected group when available
      const groupLandlordId =
        (tenantGroups?.results || [])
          .find((g) => groups.length && String(g.id) === String(groups[0]))?.landlord?.id

      await axios.post("/communications/messages/bulk/", {
        body: message,
        recipient_groups: groups,
        individual_recipient: manualNumbers,
        individual_recipient_ids: tenantIds,
        landlord: groupLandlordId || user?.landlord_profile?.id || user?.agent_profile?.managed_landlords[0]?.id
      })
      queryClient.invalidateQueries({ queryKey: ["sms-messages"] })
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  const handleDeleteMessage = async (id: string) => {
    try {
      await axios.delete(`/communications/${id}/`)  // Add trailing slash back
      queryClient.invalidateQueries({ queryKey: ["sms-messages"] })
    } catch (error) {
      console.error('Failed to delete message:', error)
    }
  }

  const handleCreateTemplate = async (templateId: number | null, name: string, content: string) => {
    try {
      if (templateId) {
        await axios.put(`/communications/templates/${templateId}/`, {  // Add trailing slash back
          name,
          content,
          landlord: user?.landlord_profile?.id || user?.agent_profile?.managed_landlords[0]?.id
        })
      } else {
        await axios.post("/communications/templates/", {  // Add trailing slash back
          name,
          content,
          landlord: user?.landlord_profile?.id || user?.agent_profile?.managed_landlords[0]?.id
        })
      }
      queryClient.invalidateQueries({ queryKey: ["sms-templates"] })
    } catch (error) {
      console.error('Failed to save template:', error)
    }
  }

  const handleDeleteTemplate = async (templateId: number) => {
    try {
      await axios.delete(`/communications/templates/${templateId}/`)  // Add trailing slash back
      queryClient.invalidateQueries({ queryKey: ["sms-templates"] })
      setDeletingTemplate(null)
    } catch (error) {
      console.error('Failed to delete template:', error)
    }
  }

  // Add search state for message history
  const [searchTerm, setSearchTerm] = useState("")

  // Filter messages based on search
  const filteredMessages = smsMessages?.results.filter((msg: SmsMessage) => 
    msg.body.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  return (
    <MainLayout>
      <div className="container mx-auto py-6 space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4 px-6 py-4">  {/* Added px-6 py-4 for better padding/ containment */}
            <div className="flex flex-col space-y-1.5">
              <CardTitle>SMS</CardTitle>
              <CardDescription>Send messages to your tenants</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                className="text-xs px-2 py-1 md:text-sm md:px-4 md:py-2"  
                onClick={() => {
                  setEditingTemplate({
                    id: 0, 
                    name: '', 
                    content: '', 
                    landlord: user?.landlord_profile?.id || user?.agent_profile?.managed_landlords[0]?.id || 0,
                    created_at: new Date().toISOString(), 
                    updated_at: new Date().toISOString() 
                  })
                }}
              >
                <Plus className="mr-1 h-3 w-3 md:mr-2 md:h-4 md:w-4" /> Create Template  {/* Adjusted icon size responsively */}
              </Button>
              <Button 
                variant="outline" 
                className="text-xs px-2 py-1 md:text-sm md:px-4 md:py-2"  
                onClick={() => setIsGroupDialogOpen(true)}
              >
                <Plus className="mr-1 h-3 w-3 md:mr-2 md:h-4 md:w-4" /> Create Group  {/* Adjusted icon size responsively */}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <SendSmsForm
              templates={templates}
              tenants={tenants}
              tenantGroups={tenantGroups}
              onSend={handleSendMessage}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 px-4 py-3 md:px-6 md:py-4">
            <div className="flex flex-col space-y-1.5">
              <CardTitle>Message History</CardTitle>
              <CardDescription>View and manage sent messages</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <Badge variant="secondary" className="flex items-center text-xs px-2 py-1 md:text-sm md:px-3 md:py-1">
                <Users className="w-3 h-3 mr-1 md:w-4 md:h-4" />
                {smsMessages?.count || 0} Recipients
              </Badge>
              <Badge variant="secondary" className="flex items-center text-xs px-2 py-1 md:text-sm md:px-3 md:py-1">
                <MessageSquare className="w-3 h-3 mr-1 md:w-4 md:h-4" />
                {filteredMessages.length || 0} Messages
              </Badge>
              <Badge variant="secondary" className="flex items-center text-xs px-2 py-1 md:text-sm md:px-3 md:py-1">
                <Clock className="w-3 h-3 mr-1 md:w-4 md:h-4" />
                Last 30 days
              </Badge>
              <Input 
                placeholder="Search messages..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full mt-2 md:mt-0 md:w-64"
              />
            </div>
          </CardHeader>
          <CardContent className="pt-4 md:pt-6">
            {smsMessages ? (
              <MessageHistory
                messages={{ count: filteredMessages.length, results: filteredMessages }}
                onMessageSelect={setSelectedMessage}
              />
            ) : (
              <div className="space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            )}
          </CardContent>
        </Card>

        {selectedMessage && (
          <MessageDetailsModal
            message={selectedMessage}
            onClose={() => setSelectedMessage(null)}
            onDelete={handleDeleteMessage}
          />
        )}

        <EditTemplateDialog
          isOpen={!!editingTemplate}
          onClose={() => setEditingTemplate(null)}
          onSubmit={handleCreateTemplate}
          template={editingTemplate}
        />

        <DeleteTemplateDialog
          isOpen={!!deletingTemplate}
          onClose={() => setDeletingTemplate(null)}
          onConfirm={handleDeleteTemplate}
          template={deletingTemplate}
        />

        <TenantGroupDialog
          isOpen={isGroupDialogOpen}
          onClose={() => setIsGroupDialogOpen(false)}
          onSubmit={handleCreateGroup}
        />
      </div>
    </MainLayout>
  )
}