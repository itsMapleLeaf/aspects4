import { useMutation, useQuery } from "convex/react"
import { panel } from "~/styles/panel.ts"
import { api } from "../../convex/_generated/api"

const shortTimeFormat = new Intl.DateTimeFormat(undefined, {
	timeStyle: "short",
})
const fullDateFormat = new Intl.DateTimeFormat(undefined, {
	dateStyle: "long",
	timeStyle: "medium",
})

export function Chat() {
	const messages = useQuery(api.messages.list)
	const createMessage = useMutation(api.messages.create)
	return (
		<section aria-label="Chat" className="flex h-full w-64 flex-col gap-2">
			<ul className="-m-2 flex min-h-0 flex-1 flex-col justify-end gap-2 overflow-y-auto p-2">
				{messages?.map((message) => (
					<li key={message._id} className={panel("flex flex-col")}>
						<p className="text-sm text-gray-300">
							{message.sender} &bull;{" "}
							<time
								dateTime={new Date(message._creationTime).toISOString()}
								title={fullDateFormat.format(message._creationTime)}
							>
								{shortTimeFormat.format(message._creationTime)}
							</time>
						</p>
						<p>{message.content}</p>
					</li>
				))}
			</ul>
			<footer className={panel("p-0 focus-within:border-gray-700")}>
				<textarea
					placeholder="Say something!"
					className="block field-sizing-content w-full resize-none px-3 py-2 focus:outline-none"
					onKeyDown={(event) => {
						if (event.key === "Enter" && !event.shiftKey && !event.ctrlKey) {
							event.preventDefault()

							const content = event.currentTarget.value
							event.currentTarget.value = ""

							createMessage({
								sender: "someone",
								content,
							}).catch((error) => {
								console.error(error)
								alert("Oops, something went wrong. Try again.")
								event.currentTarget.value = content
							})
						}
					}}
				/>
			</footer>
		</section>
	)
}
