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
import { Plus } from "lucide-react"
// Add to the existing imports
import { TenantGroupDialog } from "./components/tenant-group-dialog"

// Remove the local interface definitions since we're importing them from types.ts

export default function SMS() {
  const { user } = useUser() as { user: User | null }
  const queryClient = useQueryClient()
  const [selectedMessage, setSelectedMessage] = useState<SmsMessage | null>(null)
  const [editingTemplate, setEditingTemplate] = useState<SmsTemplate | null>(null)
  const [deletingTemplate, setDeletingTemplate] = useState<SmsTemplate | null>(null)
  // Add to the state declarations
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false)
  
  // Add the handler function
  const handleCreateGroup = async (data: any) => {
    try {
      await axios.post("/tenants/groups/", {
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
  const { data: smsMessages } = useQuery<{ count: number, results: SmsMessage[] }>({ 
    queryKey: ["sms-messages"],
    queryFn: async () => {
      const response = await axios.get("/communications/messages/")
      return response.data
    }
  })

  const { data: templates } = useQuery<{ count: number, results: SmsTemplate[] }>({ 
    queryKey: ["sms-templates"],
    queryFn: async () => {
      const response = await axios.get("/communications/templates/")
      return response.data
    }
  })

  const { data: tenants } = useQuery<{ count: number, results: Tenant[] }>({ 
    queryKey: ["tenants"],
    queryFn: async () => {
      const response = await axios.get("/tenants/")
      return response.data
    }
  })

  const { data: tenantGroups } = useQuery<{ count: number, results: TenantGroup[] }>({ 
    queryKey: ["tenant-groups"],
    queryFn: async () => {
      const response = await axios.get("/tenants/groups/")
      return response.data
    }
  })

  const handleSendMessage = async (message: string, recipients: string[], groups: string[]) => {
    try {
      await axios.post("/communications/messages/bulk/", {
        body: message,
        recipient_groups: groups,
        individual_recipients: recipients
      })
      queryClient.invalidateQueries({ queryKey: ["sms-messages"] })
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  const handleDeleteMessage = async (id: string) => {
    try {
      await axios.delete(`/communications/${id}/`)
      queryClient.invalidateQueries({ queryKey: ["sms-messages"] })
    } catch (error) {
      console.error('Failed to delete message:', error)
    }
  }

  const handleCreateTemplate = async (templateId: number | null, name: string, content: string) => {
    try {
      if (templateId) {
        await axios.put(`/communications/templates/${templateId}/`, {
          name,
          content,
          landlord: user?.landlord_profile?.id || user?.agent_profile?.managed_landlords[0]?.id
        })
      } else {
        await axios.post("/communications/templates/", {
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
      await axios.delete(`/communications/templates/${templateId}/`)
      queryClient.invalidateQueries({ queryKey: ["sms-templates"] })
      setDeletingTemplate(null)
    } catch (error) {
      console.error('Failed to delete template:', error)
    }
  }

  return (
    <MainLayout>
      <div className="container mx-auto py-6 space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Send SMS</CardTitle>
              <CardDescription>Send SMS messages to your tenants</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setEditingTemplate({ 
                id: 0, 
                name: '', 
                content: '', 
                landlord: user?.landlord_profile?.id || user?.agent_profile?.managed_landlords[0]?.id || 0,
                created_at: new Date().toISOString(), 
                updated_at: new Date().toISOString() 
              })} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Create Template
              </Button>
              <Button onClick={() => setIsGroupDialogOpen(true)} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Create Group
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <SendSmsForm
              templates={templates}
              tenants={tenants}
              tenantGroups={tenantGroups}
              onSend={handleSendMessage}
            />
          </CardContent>
        </Card>

        <MessageHistory
          messages={smsMessages}
          onMessageSelect={setSelectedMessage}
        />

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