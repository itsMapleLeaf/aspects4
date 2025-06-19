import { useAuthActions } from "@convex-dev/auth/react"
import { useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"
import { Icon } from "./ui/Icon.tsx"
import { Menu, MenuButton, MenuItem, MenuPanel } from "./ui/Menu.tsx"

export function UserButton() {
	const user = useQuery(api.auth.me)
	const { signOut } = useAuthActions()

	if (!user) {
		return
	}

	return (
		<Menu placement="bottom-end">
			<MenuButton className="-mx-3 flex h-10 items-center gap-3 rounded px-3 hover:bg-white/10">
				<div className="span sr-only">Account actions</div>
				<span aria-hidden>{user.name}</span>
				{user.image ?
					<img src={user?.image} alt="" className="size-8 rounded-full" />
				:	<Icon icon="mingcute:user-4-line" className="-mx-1 size-6" />}
			</MenuButton>
			<MenuPanel>
				<MenuItem onClick={signOut}>
					<Icon icon="mingcute:open-door-fill" />
					Sign out
				</MenuItem>
			</MenuPanel>
		</Menu>
	)
}
