import * as Ariakit from "@ariakit/react"
import { useQuery } from "convex/react"
import { Link } from "wouter"
import { api } from "../../../convex/_generated/api"
import { AppHeader } from "../app/AppHeader.tsx"
import { ListCard } from "../ui/ListCard.tsx"
import { RelativeTimestamp } from "../ui/RelativeTimestamp.tsx"
import { CreateRoomDialog } from "./CreateRoomDialog.tsx"

export function RoomList() {
	const rooms = useQuery(api.rooms.list) ?? []
	return (
		<Ariakit.HeadingLevel>
			<div className="flex min-h-screen w-full flex-col">
				<AppHeader />
				<main
					aria-labelledby="roomListHeading"
					className="mx-auto w-full max-w-screen-md px-6 py-4"
				>
					<div className="mb-4 flex items-center justify-between">
						<Ariakit.Heading
							id="roomListHeading"
							className="text-2xl font-light text-white"
						>
							Your rooms
						</Ariakit.Heading>
						<CreateRoomDialog />
					</div>
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
						<ul aria-label="Rooms">
							{rooms.map((room) => (
								<li key={room._id}>
									<ListCard
										element={<Link to={`/rooms/${room.slug}`} />}
										heading={room.name}
										tags={[
											{
												icon: "mingcute:time-fill",
												iconLabel: "Created",
												text: (
													<RelativeTimestamp timestamp={room._creationTime} />
												),
											},
										]}
									/>
								</li>
							))}
						</ul>
						{rooms.length === 0 && (
							<div className="col-span-full flex flex-col items-center justify-center p-8 text-center">
								<p className="mb-4 text-gray-400">
									You don't have any rooms yet
								</p>
							</div>
						)}
					</div>
				</main>
			</div>
		</Ariakit.HeadingLevel>
	)
}
