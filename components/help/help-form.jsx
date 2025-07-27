import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Textarea } from "../ui/textarea"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../ui/select"
import { UploadCloud } from "lucide-react"

export function HelpForm() {
  return (
    <div className="max-w-2xl mx-auto bg-[#1C1B45] p-6 rounded-xl shadow-lg text-white">
      <h2 className="text-xl font-semibold mb-6 text-center">Create a ticket</h2>

      <form className="space-y-4">
        <Input placeholder="Your name *" />
        <Input type="email" placeholder="Your email *" />

        <Select>
          <SelectTrigger>
            <SelectValue placeholder="What's your problem, concern, or suggestion?" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="technical">Technical Issue</SelectItem>
            <SelectItem value="reporting">Reporting and Safety</SelectItem>
            <SelectItem value="product">Product Usage</SelectItem>
            <SelectItem value="account">Account Management</SelectItem>
            <SelectItem value="getting-started">Getting Started</SelectItem>
            <SelectItem value="policy">Policies and Legal</SelectItem>
          </SelectContent>
        </Select>

        <div className="bg-[#2E2C5A] rounded-md p-3 flex items-center space-x-3 cursor-pointer hover:bg-[#3A3870]">
          <UploadCloud className="text-white" />
          <span>Upload a photo for context</span>
        </div>

        <Textarea
          placeholder="Describe the ticket in detail *"
          rows={6}
          className="bg-[#2E2C5A] text-white placeholder:text-gray-400"
        />

        <Button type="submit" className="w-full bg-[#372BFF] hover:bg-[#5E53FF]">Submit</Button>
      </form>
    </div>
  )
}