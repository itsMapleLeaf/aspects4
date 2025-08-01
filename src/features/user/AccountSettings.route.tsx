import * as Ariakit from "@ariakit/react"
import { useMutation, useQuery } from "convex/react"
import { startTransition, useActionState, useRef, useState } from "react"
import { Link } from "react-router"
import { api } from "../../../convex/_generated/api"
import { AppHeader } from "../app/AppHeader.tsx"
import { useFileUpload } from "../files/useFileUpload.ts"
import { Button } from "../ui/Button.tsx"
import { CropperDialog } from "../ui/CropperDialog.tsx"
import { Field } from "../ui/Field.tsx"
import { Icon } from "../ui/Icon.tsx"
import { Input } from "../ui/Input.tsx"
import { LoadingScreen } from "../ui/LoadingScreen.tsx"

export default function AccountSettings() {
	const user = useQuery(api.auth.me)

	if (user === undefined) {
		return <LoadingScreen className="min-h-screen" />
	}

	if (user === null) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<p className="text-white">Please sign in to access account settings.</p>
			</div>
		)
	}

	return <AccountSettingsForm user={user} />
}

function AccountSettingsForm({
	user,
}: {
	user: NonNullable<ReturnType<typeof useQuery<typeof api.auth.me>>>
}) {
	const updateProfile = useMutation(api.users.updateProfile)
	const updateAvatar = useMutation(api.users.updateAvatar)
	const uploadFile = useFileUpload()

	const [name, setName] = useState(user.name ?? "")
	const [email, setEmail] = useState(user.email ?? "")
	const [imageToCrop, setImageToCrop] = useState<string | null>(null)
	const avatarInputRef = useRef<HTMLInputElement>(null)

	const [updateError, saveAction, isSaving] = useActionState(async () => {
		try {
			const updates: Parameters<typeof updateProfile>[0] = {}

			if (name.trim() !== user.name) {
				updates.name = name.trim()
			}

			if (email.trim() !== user.email) {
				updates.email = email.trim()
			}

			if (Object.keys(updates).length > 0) {
				const updatedUser = await updateProfile(updates)
				if (updatedUser) {
					setName(updatedUser.name ?? "")
					setEmail(updatedUser.email ?? "")
				}
			}
		} catch (err) {
			return err instanceof Error ?
					err.message
				:	"An error occurred while updating your profile"
		}
	}, null)

	const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0]
		if (!file) return

		// Create object URL for cropping
		const imageUrl = URL.createObjectURL(file)
		setImageToCrop(imageUrl)
	}

	const [avatarError, handleCropComplete, isUploadingAvatar] = useActionState(
		async (_state: string | void, croppedImageBlob: Blob) => {
			try {
				const storageId = await uploadFile(croppedImageBlob)
				await updateAvatar({ storageId })
				setImageToCrop(null)
			} catch (error) {
				return error instanceof Error ? error.message : String(error)
			}
		},
	)

	const handleCropCancel = () => {
		if (imageToCrop) {
			URL.revokeObjectURL(imageToCrop)
		}
		setImageToCrop(null)
	}

	return (
		<div className="flex min-h-screen w-full flex-col">
			<AppHeader />
			<main className="mx-auto w-full max-w-screen-md px-6 py-8">
				<Ariakit.HeadingLevel>
					<div className="mb-6 flex items-center gap-4">
						<Link to="/" className="text-gray-400 transition hover:text-white">
							<Icon icon="mingcute:arrow-left-fill" className="size-6" />
						</Link>
						<Ariakit.Heading className="text-3xl font-light text-white">
							Account Settings
						</Ariakit.Heading>
					</div>

					<div className="panel rounded-lg p-6">
						<div className="mb-6">
							<Ariakit.Heading className="mb-2 text-xl font-light text-white">
								Avatar
							</Ariakit.Heading>
							<div className="flex items-center gap-4">
								<button
									type="button"
									onClick={() => avatarInputRef.current?.click()}
									className="overflow-clip rounded-full border border-transparent bg-gray-950 p-px transition hover:border-primary-400 hover:brightness-75"
								>
									{user.image ?
										<img
											src={user.image}
											alt="Profile"
											className="size-16 rounded-full object-cover"
										/>
									:	<div className="flex size-16 items-center justify-center rounded-full bg-gray-700">
											<Icon
												icon="mingcute:user-4-line"
												className="size-8 text-gray-400"
											/>
										</div>
									}
								</button>
								<div className="flex flex-col gap-1">
									<label>
										<Button
											render={<span />}
											icon={
												isUploadingAvatar ?
													<Icon
														icon="mingcute:loading-3-fill"
														className="animate-spin"
													/>
												:	<Icon icon="mingcute:upload-2-fill" />
											}
											disabled={isUploadingAvatar}
										>
											{isUploadingAvatar ? "Uploading..." : "Upload New Image"}
										</Button>
										<input
											type="file"
											accept="image/*"
											className="hidden"
											onChange={handleAvatarChange}
											disabled={isUploadingAvatar}
											ref={avatarInputRef}
										/>
									</label>
									{user.image && (
										<Button
											appearance="ghost"
											icon={<Icon icon="mingcute:delete-2-fill" />}
											onClick={async () => {
												await updateAvatar({ storageId: null })
											}}
										>
											Remove
										</Button>
									)}
								</div>
							</div>
							{avatarError && (
								<p className="mt-2 text-sm text-red-400">{avatarError}</p>
							)}
						</div>

						<form action={saveAction} className="flex flex-col gap-4">
							<Field label="Display Name" htmlFor="name">
								<Input
									id="name"
									type="text"
									value={name}
									onChange={(e) => setName(e.target.value)}
									placeholder="Enter your display name"
									required
								/>
							</Field>

							<Field label="Email" htmlFor="email">
								<Input
									id="email"
									type="email"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									placeholder="Enter your email"
									required
								/>
							</Field>

							{updateError && (
								<p className="text-sm text-red-400">{updateError}</p>
							)}

							<div className="flex justify-end pt-4">
								<Button
									type="submit"
									icon={<Icon icon="mingcute:check-fill" />}
									pending={isSaving}
									disabled={name === user.name && email === user.email}
								>
									{isSaving ? "Saving..." : "Save Changes"}
								</Button>
							</div>
						</form>
					</div>
				</Ariakit.HeadingLevel>
			</main>

			{imageToCrop && (
				<CropperDialog
					imageSrc={imageToCrop}
					onCropComplete={(blob) => {
						startTransition(() => {
							handleCropComplete(blob)
						})
					}}
					onCancel={handleCropCancel}
					aspectRatio={1}
				/>
			)}
		</div>
	)
}
