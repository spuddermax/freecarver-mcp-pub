declare module "@hello-pangea/dnd" {
	import * as React from "react";

	export interface DropResult {
		draggableId: string;
		type: string;
		source: {
			index: number;
			droppableId: string;
		};
		destination: {
			index: number;
			droppableId: string;
		} | null;
	}

	export interface DroppableProvided {
		innerRef: (element: HTMLElement | null) => void;
		droppableProps: any;
		placeholder?: React.ReactNode;
	}

	export interface DraggableProvided {
		innerRef: (element: HTMLElement | null) => void;
		draggableProps: any;
		dragHandleProps: any;
	}

	// Minimal type definitions for exported components:
	export class DragDropContext extends React.Component<any, any> {}
	export class Droppable extends React.Component<any, any> {}
	export class Draggable extends React.Component<any, any> {}

	// Export any other types or components as needed
}
