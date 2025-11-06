"use client"

import { useState } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Shield, Save, Loader2 } from "lucide-react"
import { useUser } from "@/lib/context/user-context"  // Change this import
import { useToast } from "@/hooks/use-toast"
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function Profile() {
  const { user, loading, error, updateProfile, updatePhoto } = useUser()  // Use useUser instead of useAuth
  const { toast } = useToast()
  const router = useRouter()
  const [updating, setUpdating] = useState(false)

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return
    
    const file = e.target.files[0]
    if (file.size > 1024 * 1024) {
      toast({
        title: "Error",
        description: "File size must be less than 1MB",
        variant: "destructive",
      })
      return
    }

    try {
      setUpdating(true)
      await updatePhoto(file)
      toast({
        title: "Success",
        description: "Profile photo updated successfully",
        variant: "success",
      })
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update profile photo",
        variant: "destructive",
      })
    } finally {
      setUpdating(false)
    }
  }

  const handleProfileUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formElement = e.currentTarget
    const formData = new FormData(formElement)
    
    try {
      setUpdating(true)
      await updateProfile({
        first_name: formData.get('firstName') as string,
        last_name: formData.get('lastName') as string,
        phone: formData.get('phone') as string,
        bio: formData.get('bio') as string,
        country: formData.get('country') as string,
        city_state: formData.get('town') as string,
        gender: formData.get('gender') as string,
        date_of_birth: formData.get('dateOfBirth') as string,
      })
      toast({
        title: "Success",
        description: "Profile updated successfully",
        variant: "success" as const,
      })
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      })
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="h-6 w-40 bg-muted rounded" />
            <div className="h-6 w-24 bg-muted rounded" />
          </div>
          <div className="grid w-full grid-cols-2 gap-2">
            <div className="h-10 bg-muted rounded" />
            <div className="h-10 bg-muted rounded" />
          </div>
          <div className="space-y-4">
            <div className="h-8 w-48 bg-muted rounded" />
            <div className="h-4 w-64 bg-muted rounded" />
            <div className="grid gap-4 md:grid-cols-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 w-24 bg-muted rounded" />
                  <div className="h-10 w-full bg-muted rounded" />
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <div className="h-4 w-24 bg-muted rounded" />
              <div className="h-24 w-full bg-muted rounded" />
            </div>
            <div className="flex gap-2">
              <div className="h-10 w-28 bg-muted rounded" />
              <div className="h-10 w-28 bg-muted rounded" />
            </div>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (!user || error) {
    return null
  }

  return (
    <MainLayout>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">Profile Settings</h1>
      </div>

      <Tabs defaultValue="account" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your account details and profile information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleProfileUpdate}>
                <div className="flex items-center space-x-4 mb-6">
                  <Avatar className="h-20 w-20">
                    <AvatarImage 
                      src={user?.profile_image || "/avatar.jpg"} 
                      alt={user?.first_name || "User"}
                      className="object-cover"
                    />
                    <AvatarFallback>{user?.first_name?.[0]}{user?.last_name?.[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <Button variant="outline" className="relative" disabled={updating}>
                      <input
                        type="file"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        accept="image/jpeg,image/png,image/gif"
                        onChange={handlePhotoChange}
                      />
                      {updating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Change Photo'
                      )}
                    </Button>
                    <p className="text-sm text-muted-foreground mt-2">JPG, GIF or PNG. 1MB max.</p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      defaultValue={user?.first_name}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      defaultValue={user?.last_name}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      defaultValue={user?.email}
                      disabled
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      name="phone"
                      defaultValue={user?.phone}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Input
                      id="role"
                      defaultValue={user?.role}
                      disabled
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      name="country"
                      defaultValue={user?.country || ''}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="town">Town</Label>
                    <Input
                      id="town"
                      name="town"
                      defaultValue={user?.city_state || ''}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <select
                      id="gender"
                      name="gender"
                      defaultValue={user?.gender || ''}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">Select gender</option>
                      <option value="M">Male</option>
                      <option value="F">Female</option>
                      <option value="O">Other</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <Input
                      type="date"
                      id="dateOfBirth"
                      name="dateOfBirth"
                      defaultValue={user?.date_of_birth || ''}
                    />
                  </div>
                </div>

                <div className="space-y-2 mt-4">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    name="bio"
                    defaultValue={user?.bio || ''}
                    className="min-h-[100px]"
                  />
                </div>

                <Button type="submit" className="mt-6" disabled={updating}>
                  {updating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Password & Security</CardTitle>
              <CardDescription>Manage your password and security settings</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Password management is handled through Firebase Authentication.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </MainLayout>
  )
}
