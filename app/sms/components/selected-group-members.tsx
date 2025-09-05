import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { Tenant } from "../types"

interface SelectedGroupMembersProps {
  members: Tenant[]
  onRemoveMember: (memberId: string) => void
}

export function SelectedGroupMembers({ members, onRemoveMember }: SelectedGroupMembersProps) {
  return (
    <div className="border rounded-md p-4 space-y-2">
      <h3 className="font-medium mb-2">Selected Recipients ({members.length})</h3>
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {members.map((member) => (
          <div key={member.id} className="flex items-center justify-between bg-gray-50 p-2 rounded dark:bg-gray-800">
            <span>{member.user?.full_name} - {member.phone}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemoveMember(member.id.toString())}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}