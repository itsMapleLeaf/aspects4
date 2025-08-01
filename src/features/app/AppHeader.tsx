import { Link } from "react-router"
import { Button } from "../ui/Button.tsx"
import { UserButton } from "../user/UserButton.tsx"
import { AppLogoLink } from "./AppLogoLink.tsx"

export function AppHeader({ left }: { left?: React.ReactNode }) {
	return (
		<header
			aria-label="Site header"
			className="flex h-16 items-center gap-6 px-6"
		>
			<div className="flex items-center gap-2">
				<AppLogoLink />
				{left}
			</div>
			<div className="ml-auto flex items-center gap-1">
				<Button
					appearance="ghost"
					render={<Link to="/templates" />}
					icon="mingcute:document-fill"
				>
					Templates
				</Button>
			</div>
			<UserButton />
		</header>
	)
}
