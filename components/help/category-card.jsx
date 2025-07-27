import { Button } from "../ui/button"
import { Sparkles, ShieldAlert, Star, UserCog, BookOpenCheck, Gavel } from "lucide-react"

const icons = {
  "Technical Support": <Sparkles className="h-6 w-6" />,
  "Reporting and Safety": <ShieldAlert className="h-6 w-6" />,
  "Product Usage": <Star className="h-6 w-6" />,
  "Account Management": <UserCog className="h-6 w-6" />,
  "Getting Started": <BookOpenCheck className="h-6 w-6" />,
  "Policies and Legal": <Gavel className="h-6 w-6" />,
}

export function HelpCategoryCard({ title, desc }) {
  return (
    <div className="bg-[#1A1756] rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow duration-300">
      <div className="mb-4 text-white">{icons[title]}</div>
      <h2 className="text-lg font-semibold mb-2">{title}</h2>
      <p className="text-sm text-gray-300 mb-4">{desc}</p>
      <Button className="bg-[#372BFF] hover:bg-[#5E53FF] w-full">View</Button>
    </div>
  )
}