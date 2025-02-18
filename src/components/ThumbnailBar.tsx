// /src/components/ThumbnailBar.tsx

import React from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import type {
	DropResult,
	DroppableProvided,
	DraggableProvided,
} from "@hello-pangea/dnd";
import { ProductMediaItem as MediaItemType } from "./ProductMedia";
import { Video } from "lucide-react";

interface ThumbnailBarProps {
	mediaItems: MediaItemType[];
	setMediaItems: React.Dispatch<React.SetStateAction<MediaItemType[]>>;
}

export const ThumbnailBar: React.FC<ThumbnailBarProps> = ({
	mediaItems,
	setMediaItems,
}) => {
	const handleOnDragEnd = (result: DropResult) => {
		if (!result.destination) return;
		const items = Array.from(mediaItems);
		const [draggedItem] = items.splice(result.source.index, 1);
		items.splice(result.destination.index, 0, draggedItem);
		setMediaItems(items);
	};

	return (
		<DragDropContext onDragEnd={handleOnDragEnd}>
			<Droppable droppableId="thumbnails" direction="horizontal">
				{(provided: DroppableProvided) => (
					<div
						className="flex flex-wrap gap-x-2 gap-y-2 p-2 border-b"
						ref={provided.innerRef}
						{...provided.droppableProps}
					>
						{mediaItems.map((item, index) => (
							<Draggable
								key={item.media_id}
								draggableId={item.media_id}
								index={index}
							>
								{(providedDraggable: DraggableProvided) => (
									<div
										className="w-16 h-16 border rounded overflow-hidden cursor-move"
										ref={providedDraggable.innerRef}
										{...providedDraggable.draggableProps}
										{...providedDraggable.dragHandleProps}
									>
										{item.url
											.toLowerCase()
											.includes("youtube") ||
										item.url
											.toLowerCase()
											.includes("youtu.be") ? (
											<div
												className="flex items-center justify-center w-full h-full bg-gray-200 dark:bg-gray-700"
												title={
													item.title ||
													"Youtube Thumbnail"
												}
											>
												<Video className="w-6 h-6 text-gray-500 dark:text-gray-300" />
											</div>
										) : (
											<img
												src={item.url}
												alt={item.title || "Thumbnail"}
												title={
													item.title || "Thumbnail"
												}
												className="object-cover w-full h-full"
											/>
										)}
									</div>
								)}
							</Draggable>
						))}
						{provided.placeholder}
					</div>
				)}
			</Droppable>
		</DragDropContext>
	);
};
