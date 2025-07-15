"use client"

import { useState } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { MessageSquare, Send, Users, Clock, Plus } from "lucide-react"

const conversations = [
  {
    id: 1,
    tenant: "John Doe",
    property: "Sunset Apartments",
    unit: "4B",
    lastMessage: "Thank you for the quick response!",
    timestamp: "2 hours ago",
    unread: 0,
    status: "active",
  },
  {
    id: 2,
    tenant: "Sarah Wilson",
    property: "Downtown Complex",
    unit: "2A",
    lastMessage: "When can the maintenance be scheduled?",
    timestamp: "1 day ago",
    unread: 2,
    status: "active",
  },
  {
    id: 3,
    tenant: "Mike Johnson",
    property: "Garden View",
    unit: "1C",
    lastMessage: "Payment has been sent",
    timestamp: "3 days ago",
    unread: 0,
    status: "active",
  },
]

const messageTemplates = [
  {
    id: 1,
    name: "Rent Reminder",
    content:
      "Hi {tenant_name}, this is a friendly reminder that your rent payment of ${amount} is due on {due_date}. Please let us know if you have any questions.",
  },
  {
    id: 2,
    name: "Maintenance Scheduled",
    content:
      "Hello {tenant_name}, your maintenance request has been scheduled for {date} between {time}. Please ensure someone is available to provide access.",
  },
  {
    id: 3,
    name: "Lease Renewal",
    content:
      "Dear {tenant_name}, your lease for {property} Unit {unit} expires on {lease_end}. Please contact us to discuss renewal options.",
  },
]

export default function SMS() {
  const [selectedConversation, setSelectedConversation] = useState<(typeof conversations)[0] | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [selectedTemplate, setSelectedTemplate] = useState("")

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      // Handle sending message
      setNewMessage("")
    }
  }

  return (
    <MainLayout>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">SMS Communications</h1>
        <div className="flex space-x-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Message
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Send New Message</DialogTitle>
                <DialogDescription>Send SMS to tenants</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="recipient">Recipient</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select tenant" />
                    </SelectTrigger>
                    <SelectContent>
                      {conversations.map((conv) => (
                        <SelectItem key={conv.id} value={conv.id.toString()}>
                          {conv.tenant} - {conv.property} {conv.unit}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="template">Template (Optional)</Label>
                  <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose template" />
                    </SelectTrigger>
                    <SelectContent>
                      {messageTemplates.map((template) => (
                        <SelectItem key={template.id} value={template.id.toString()}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                  />
                </div>
                <Button onClick={handleSendMessage} className="w-full">
                  <Send className="mr-2 h-4 w-4" />
                  Send Message
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="outline">
            <Users className="mr-2 h-4 w-4" />
            Bulk Message
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,247</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Conversations</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversations.length}</div>
            <p className="text-xs text-muted-foreground">Ongoing chats</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94%</div>
            <p className="text-xs text-muted-foreground">Within 24 hours</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Conversations</CardTitle>
            <CardDescription>Recent SMS conversations with tenants</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedConversation?.id === conversation.id
                      ? "bg-primary/10 border border-primary/20"
                      : "hover:bg-muted/50"
                  }`}
                  onClick={() => setSelectedConversation(conversation)}
                >
                  <div className="flex items-start space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="/placeholder.svg" />
                      <AvatarFallback>
                        {conversation.tenant
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium truncate">{conversation.tenant}</p>
                        {conversation.unread > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {conversation.unread}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {conversation.property} - {conversation.unit}
                      </p>
                      <p className="text-sm text-muted-foreground truncate mt-1">{conversation.lastMessage}</p>
                      <p className="text-xs text-muted-foreground mt-1">{conversation.timestamp}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              {selectedConversation ? `Chat with ${selectedConversation.tenant}` : "Select a conversation"}
            </CardTitle>
            {selectedConversation && (
              <CardDescription>
                {selectedConversation.property} - Unit {selectedConversation.unit}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {selectedConversation ? (
              <div className="space-y-4">
                <div className="h-96 border rounded-lg p-4 overflow-y-auto bg-muted/20">
                  <div className="space-y-4">
                    <div className="flex justify-end">
                      <div className="bg-primary text-primary-foreground rounded-lg px-3 py-2 max-w-xs">
                        <p className="text-sm">Hi John, just wanted to follow up on your maintenance request.</p>
                        <p className="text-xs opacity-70 mt-1">2:30 PM</p>
                      </div>
                    </div>
                    <div className="flex justify-start">
                      <div className="bg-muted rounded-lg px-3 py-2 max-w-xs">
                        <p className="text-sm">Thank you for the quick response!</p>
                        <p className="text-xs text-muted-foreground mt-1">2:45 PM</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Input
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  />
                  <Button onClick={handleSendMessage}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-96 text-muted-foreground">
                <div className="text-center">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4" />
                  <p>Select a conversation to start messaging</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Message Templates</CardTitle>
          <CardDescription>Pre-defined templates for common communications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {messageTemplates.map((template) => (
              <div key={template.id} className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">{template.name}</h4>
                <p className="text-sm text-muted-foreground mb-3 line-clamp-3">{template.content}</p>
                <Button variant="outline" size="sm">
                  Use Template
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </MainLayout>
  )
}
