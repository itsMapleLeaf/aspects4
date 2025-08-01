import * as Ariakit from "@ariakit/react"
import { Link } from "react-router"

export function AppLogoLink() {
	return (
		<Link
			to="/"
			className="transition hover:text-primary-300"
			aria-label="Home"
		>
			<Ariakit.Heading className="heading-xl">AspectsVTT</Ariakit.Heading>
		</Link>
	)
}
