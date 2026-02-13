import { UserCog } from "lucide-react";

export default function AdminProfile() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Admin Profile</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>
      <div className="stat-card flex flex-col items-center justify-center py-16">
        <UserCog className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Profile settings</p>
      </div>
    </div>
  );
}
