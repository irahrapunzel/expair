import ProfileAvatar from "@/components/avatar";

export default function AvatarNameCell({ avatar, name, size = 32 }) {
  return (
    <div className="flex items-center gap-3">
      <ProfileAvatar src={avatar} size={size} />
      <span className="text-sm font-medium text-white">{name}</span>
    </div>
  );
}



