import { UserIcon } from "@heroicons/react/24/outline";
import { Button } from "@heroui/button";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/dropdown";
import { useAuth } from "@/context/AuthProvider";
import { useNavigate } from "react-router-dom";



export default function UserDropdown() {

const { signOut } = useAuth();
const navigate = useNavigate();

const items = [
    {
        key: "Profile",
        label: "Profil",
        action: async () => {
            navigate("/dashboard/profile", { replace: true });
        }
    },
    // {
    //     key: "Settings",
    //     label: "Settings",
    //     action:() => {
    //         navigate("/settings", { replace: true });
    //     }
    // },
    {
        key: "Pricing",
        label: "Preise",
        action:() => {
            navigate("/pricing", { replace: true });
        }
    },
    {
        key: "Logout",
        label: "Abmelden",
        action: async () => {
            await signOut();
            navigate("/signin", { replace: true });
        }
    },
    // {
    //     label: "Subscription",
    //     key: "Subscription",
    //     action:() => {
    //         navigate("/subscription", { replace: true });
    //     }
    // }
]

return (
    <Dropdown>
      <DropdownTrigger>
        <Button variant="flat" color="primary" isIconOnly className="rounded-full">
            <UserIcon className="w-5 h-5" /> 
        </Button>
      </DropdownTrigger>
      <DropdownMenu aria-label="Dynamic Actions" items={items}>
        {(item) => (
          <DropdownItem
            key={item.key}
            onPress={item.action}
            >
            {item.label}
          </DropdownItem>
        )}
      </DropdownMenu>
    </Dropdown>
  );
}
