import { Heading, HeadingLevel } from "@ariakit/react"
import { useAuthActions } from "@convex-dev/auth/react"
import { useActionState, useState } from "react"
import { Button } from "./ui/Button.tsx"
import { Icon } from "./ui/Icon.tsx"
import { Input } from "./ui/Input.tsx"

export function AuthScreen() {
	const [isSignUp, setIsSignUp] = useState(false)
	const [email, setEmail] = useState("")
	const [name, setName] = useState("")
	const [password, setPassword] = useState("")
	const [confirmPassword, setConfirmPassword] = useState("")
	const { signIn } = useAuthActions()

	const [error, formAction, isPending] = useActionState(async () => {
		if (isSignUp && password !== confirmPassword) {
			return "Passwords don't match"
		}

		try {
			if (isSignUp) {
				await signIn("password", {
					flow: "signUp",
					email,
					password,
					name,
				})
			} else {
				await signIn("password", {
					flow: "signIn",
					email,
					password,
				})
			}
		} catch (err) {
			return err instanceof Error ?
					err.message
				:	"An error occurred during authentication"
		}
	}, null)

	return (
		<div className="grid min-h-screen place-items-center bg-gray-950 p-4">
			<HeadingLevel>
				<div className="flex w-full max-w-md flex-col items-center gap-8">
					<div className="text-center">
						<h1 className="text-4xl font-light text-white">Aspects VTT</h1>
						<p className="mt-2 text-gray-400">
							A minimal virtual tabletop built for the Aspects of Nature RPG
							system
						</p>
					</div>

					<div className="w-full panel rounded-lg p-6">
						<Heading className="mb-6 text-xl font-light text-white">
							{isSignUp ? "Create an account" : "Sign in to continue"}
						</Heading>

						<form action={formAction} className="flex flex-col gap-4">
							<Input
								type="email"
								label="Email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
							/>

							{isSignUp && (
								<Input
									type="text"
									label="Display name"
									value={name}
									onChange={(e) => setName(e.target.value)}
									required
								/>
							)}

							<Input
								type="password"
								label="Password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								required
							/>

							{isSignUp && (
								<Input
									type="password"
									label="Confirm password"
									value={confirmPassword}
									onChange={(e) => setConfirmPassword(e.target.value)}
									required
								/>
							)}

							{error && <p className="text-sm text-red-400">{error}</p>}

							<Button
								type="submit"
								icon={<Icon icon="mingcute:open-door-fill" />}
								className="mt-2"
								pending={isPending}
							>
								{isSignUp ? "Sign up" : "Sign in"}
							</Button>
						</form>

						<div className="mt-4 text-center">
							<p className="text-sm text-gray-400">
								{isSignUp ?
									"Already have an account? "
								:	"Don't have an account? "}
								<button
									type="button"
									onClick={() => setIsSignUp(!isSignUp)}
									className="text-primary-400 hover:underline"
								>
									{isSignUp ? "Sign in" : "Sign up"}
								</button>
							</p>
						</div>

						<div className="mt-6 flex items-center gap-4">
							<div className="h-px flex-1 bg-gray-700"></div>
							<span className="text-xs text-gray-500">OR</span>
							<div className="h-px flex-1 bg-gray-700"></div>
						</div>

						<AnonymousSignInButton />
					</div>
				</div>
			</HeadingLevel>
		</div>
	)
}

function AnonymousSignInButton() {
	const { signIn } = useAuthActions()
	const [name, setName] = useState("")

	const [error, anonymousAction, isPending] = useActionState(async () => {
		if (!name) {
			return "Please enter a display name."
		}
		try {
			await signIn("anonymous", { name })
		} catch (err) {
			return err instanceof Error ?
					err.message
				:	"An error occurred during anonymous authentication"
		}
	}, null)

	return (
		<form action={anonymousAction} className="mt-4">
			<Input
				type="text"
				label="Display name"
				required
				value={name}
				onChange={(event) => setName(event.target.value)}
			/>
			{error && <p className="mt-2 text-sm text-red-400">{error}</p>}
			<Button
				type="submit"
				icon={<Icon icon="mingcute:ghost-fill" />}
				className="mt-4 w-full"
				pending={isPending}
			>
				Sign in anonymously
			</Button>
		</form>
	)
}
