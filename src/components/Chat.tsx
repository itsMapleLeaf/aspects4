import { panel } from "~/styles/panel.ts"

export function Chat() {
	return (
		<div className="flex h-full w-64 flex-col gap-2">
			<div className="flex min-h-0 flex-1 flex-col justify-end gap-2 overflow-y-auto">
				<div className={panel("flex flex-col")}>
					<p className="text-sm text-gray-300">sender</p>
					<p>message</p>
				</div>
				<div className={panel("flex flex-col")}>
					<p className="text-sm text-gray-300">sender</p>
					<p>message</p>
				</div>
				<div className={panel("flex flex-col")}>
					<p className="text-sm text-gray-300">sender</p>
					<p>message</p>
				</div>
				<div className={panel("flex flex-col")}>
					<p className="text-sm text-gray-300">sender</p>
					<p>message</p>
				</div>
				<div className={panel("flex flex-col")}>
					<p className="text-sm text-gray-300">sender</p>
					<p>message</p>
				</div>
			</div>
			<div className={panel("p-0")}>
				<textarea
					placeholder="Say something!"
					className="block field-sizing-content w-full resize-none px-3 py-2"
				/>
			</div>
		</div>
	)
}
