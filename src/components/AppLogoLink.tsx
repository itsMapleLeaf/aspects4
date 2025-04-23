import * as Ariakit from "@ariakit/react"
import { Link } from "wouter"

export function AppLogoLink() {
	return (
		<Link to="/" className="transition hover:text-primary-300">
			<Ariakit.Heading className="heading-xl">AspectsVTT</Ariakit.Heading>
		</Link>
	)
}
