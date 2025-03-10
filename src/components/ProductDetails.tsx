// /src/components/ProductDetails.tsx

import { ChangeEvent, useEffect, useState, useRef } from "react";
import { Box, Barcode, FileText, Eye } from "lucide-react";
import { updateProduct } from "../lib/api_client/products";
import { Modal } from "../components/Modal";
import Toast from "../components/Toast";
import { Product } from "../types/Interfaces";
import { LoadingModal } from "./LoadingModal";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';

export interface ProductDetailsProps {
	product: Product;
	onInputChange: (
		e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
	) => void;
}

export function ProductDetails({
	product,
	onInputChange,
}: ProductDetailsProps) {
	// Extract the relevant fields from the product
	const { id: productId, sku: productSKU, name, description } = product;

	// Store the original details on mount.
	const [originalDetails, setOriginalDetails] = useState({
		productSKU,
		name,
		description,
	});

	// Toast state for showing notifications.
	const [toast, setToast] = useState<{
		message: string;
		type: "success" | "error";
	} | null>(null);

	// Loading state for API operations
	const [isLoading, setIsLoading] = useState(false);

	// Track whether to show the description preview modal.
	const [showDescriptionPreview, setShowDescriptionPreview] = useState(false);

	// Add state for the link modal
	const [linkModalOpen, setLinkModalOpen] = useState(false);
	const [linkUrl, setLinkUrl] = useState('');
	const [isProcessingLink, setIsProcessingLink] = useState(false);

	useEffect(() => {
		setOriginalDetails({ productSKU, name, description });
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const detailsUnchanged =
		JSON.stringify(originalDetails) ===
		JSON.stringify({ productSKU, name, description });

	const handleSaveDetails = async () => {
		setIsLoading(true);
		try {
			// Call your API to update the product details.
			await updateProduct({
				id: productId.toString(),
				name: name,
				sku: productSKU,
				description: description,
			});
			setOriginalDetails({ productSKU, name, description });
			setToast({
				message: "Product details updated successfully.",
				type: "success",
			});
		} catch (error: any) {
			console.error("Error updating product details", error);
			setToast({
				message: "Error updating product details: " + error.message,
				type: "error",
			});
		} finally {
			setIsLoading(false);
		}
	};

	const editor = useEditor({
		extensions: [
			StarterKit,
			Link.configure({
				openOnClick: false,
				HTMLAttributes: {
					class: 'text-blue-500 underline cursor-pointer hover:text-blue-700',
				},
			}),
			Image.configure({
				allowBase64: true,
				HTMLAttributes: {
					class: 'max-w-full h-auto rounded-md',
				},
			}),
			TextAlign.configure({
				types: ['heading', 'paragraph'],
				alignments: ['left', 'center', 'right'],
				defaultAlignment: 'left',
			}),
			Underline,
		],
		content: description,
		onUpdate: ({ editor }) => {
			const html = editor.getHTML();
			// Create a synthetic event to work with existing onInputChange
			const e = {
				target: {
					name: 'description',
					value: html
				}
			} as React.ChangeEvent<HTMLTextAreaElement>;
			onInputChange(e);
		},
	});

	// Update the editor when description changes from outside
	useEffect(() => {
		if (editor && description !== editor.getHTML()) {
			editor.commands.setContent(description);
		}
	}, [description, editor]);

	// Add handleLinkSubmit function
	const handleLinkSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		setIsProcessingLink(true);
		
		if (linkUrl.trim() && editor) {
			editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl.trim() }).run();
		}
		
		// Reset and close
		setLinkUrl('');
		setLinkModalOpen(false);
		setIsProcessingLink(false);
	};

	return (
		<div>
			<fieldset className="border rounded-lg p-4 border-cyan-200 dark:border-cyan-700">
				<legend className="text-2xl font-medium text-gray-700 dark:text-gray-300 px-2">
					Product Details
				</legend>
				<div className="space-y-4">
					<div>
						<label
							htmlFor="name"
							className="block text-sm font-medium text-gray-700 dark:text-gray-300"
						>
							Product Name
						</label>
						<div className="mt-1 relative">
							<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
								<Box className="h-5 w-5 text-gray-400" />
							</div>
							<input
								type="text"
								name="name"
								id="name"
								value={name}
								onChange={onInputChange}
								className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-gray-700"
							/>
						</div>
					</div>

					<div>
						<label
							htmlFor="sku"
							className="block text-sm font-medium text-gray-700 dark:text-gray-300"
						>
							Product SKU
						</label>
						<div className="mt-1 relative">
							<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
								<Barcode className="h-5 w-5 text-gray-400" />
							</div>
							<input
								type="text"
								name="sku"
								id="sku"
								value={productSKU}
								onChange={onInputChange}
								className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-gray-700"
							/>
						</div>
					</div>

					<div>
						<label
							htmlFor="description"
							className="block text-sm font-medium text-gray-700 dark:text-gray-300"
						>
							Description
							<button
								type="button"
								onClick={() => setShowDescriptionPreview(true)}
								disabled={!description.trim()}
								className={`inline-flex items-center gap-1 ml-2 px-3 py-1 text-xs rounded focus:outline-none ${
									description.trim()
										? "text-white bg-blue-600 hover:bg-blue-700"
										: "text-gray-500 bg-blue-900 cursor-not-allowed"
								}`}
							>
								<Eye className="h-4 w-4" />
								Preview
							</button>
						</label>
						<div className="mt-1 relative">
							<div className="border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden">
								<div className="flex flex-wrap gap-1 p-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-600">
									<button
										type="button"
										className={`p-1 rounded ${editor?.isActive('bold') ? 'bg-gray-200 dark:bg-gray-700' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
										onClick={() => editor?.chain().focus().toggleBold().run()}
										title="Bold"
									>
										<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
											<path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path>
											<path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path>
										</svg>
									</button>
									<button
										type="button"
										className={`p-1 rounded ${editor?.isActive('italic') ? 'bg-gray-200 dark:bg-gray-700' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
										onClick={() => editor?.chain().focus().toggleItalic().run()}
										title="Italic"
									>
										<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
											<line x1="19" y1="4" x2="10" y2="4"></line>
											<line x1="14" y1="20" x2="5" y2="20"></line>
											<line x1="15" y1="4" x2="9" y2="20"></line>
										</svg>
									</button>
									<button
										type="button"
										className={`p-1 rounded ${editor?.isActive('underline') ? 'bg-gray-200 dark:bg-gray-700' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
										onClick={() => editor?.chain().focus().toggleUnderline().run()}
										title="Underline"
									>
										<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
											<path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"></path>
											<line x1="4" y1="21" x2="20" y2="21"></line>
										</svg>
									</button>
									<div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>
									<div className="relative">
										<button
											type="button"
											className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center`}
											onClick={() => {
												const menu = document.getElementById('heading-menu');
												menu?.classList.toggle('hidden');
											}}
											title="Headings"
										>
											<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
												<path d="M6 12h12"></path>
												<path d="M6 4h12"></path>
												<path d="M6 20h12"></path>
											</svg>
											<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1">
												<polyline points="6 9 12 15 18 9"></polyline>
											</svg>
										</button>
										<div id="heading-menu" className="absolute z-10 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-lg hidden">
											<button
												type="button"
												className={`w-full px-3 py-1 text-left ${editor?.isActive('heading', { level: 1 }) ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
												onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
											>
												<span className="text-xl font-bold">Heading 1</span>
											</button>
											<button
												type="button"
												className={`w-full px-3 py-1 text-left ${editor?.isActive('heading', { level: 2 }) ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
												onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
											>
												<span className="text-lg font-bold">Heading 2</span>
											</button>
											<button
												type="button"
												className={`w-full px-3 py-1 text-left ${editor?.isActive('heading', { level: 3 }) ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
												onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
											>
												<span className="text-base font-bold">Heading 3</span>
											</button>
											<button
												type="button"
												className={`w-full px-3 py-1 text-left ${editor?.isActive('paragraph') ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
												onClick={() => editor?.chain().focus().setParagraph().run()}
											>
												<span className="text-sm">Normal text</span>
											</button>
										</div>
									</div>
									<div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>
									<button
										type="button"
										className={`p-1 rounded ${editor?.isActive({ textAlign: 'left' }) ? 'bg-gray-200 dark:bg-gray-700' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
										onClick={() => editor?.chain().focus().setTextAlign('left').run()}
										title="Align Left"
									>
										<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
											<line x1="17" y1="10" x2="3" y2="10"></line>
											<line x1="21" y1="6" x2="3" y2="6"></line>
											<line x1="21" y1="14" x2="3" y2="14"></line>
											<line x1="17" y1="18" x2="3" y2="18"></line>
										</svg>
									</button>
									<button
										type="button"
										className={`p-1 rounded ${editor?.isActive({ textAlign: 'center' }) ? 'bg-gray-200 dark:bg-gray-700' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
										onClick={() => editor?.chain().focus().setTextAlign('center').run()}
										title="Align Center"
									>
										<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
											<line x1="18" y1="10" x2="6" y2="10"></line>
											<line x1="21" y1="6" x2="3" y2="6"></line>
											<line x1="21" y1="14" x2="3" y2="14"></line>
											<line x1="18" y1="18" x2="6" y2="18"></line>
										</svg>
									</button>
									<button
										type="button"
										className={`p-1 rounded ${editor?.isActive({ textAlign: 'right' }) ? 'bg-gray-200 dark:bg-gray-700' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
										onClick={() => editor?.chain().focus().setTextAlign('right').run()}
										title="Align Right"
									>
										<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
											<line x1="21" y1="10" x2="7" y2="10"></line>
											<line x1="21" y1="6" x2="3" y2="6"></line>
											<line x1="21" y1="14" x2="3" y2="14"></line>
											<line x1="21" y1="18" x2="7" y2="18"></line>
										</svg>
									</button>
									<div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>
									<button
										type="button"
										className={`p-1 rounded ${editor?.isActive('bulletList') ? 'bg-gray-200 dark:bg-gray-700' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
										onClick={() => editor?.chain().focus().toggleBulletList().run()}
										title="Bullet List"
									>
										<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
											<line x1="8" y1="6" x2="21" y2="6"></line>
											<line x1="8" y1="12" x2="21" y2="12"></line>
											<line x1="8" y1="18" x2="21" y2="18"></line>
											<line x1="3" y1="6" x2="3.01" y2="6"></line>
											<line x1="3" y1="12" x2="3.01" y2="12"></line>
											<line x1="3" y1="18" x2="3.01" y2="18"></line>
										</svg>
									</button>
									<button
										type="button"
										className={`p-1 rounded ${editor?.isActive('orderedList') ? 'bg-gray-200 dark:bg-gray-700' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
										onClick={() => editor?.chain().focus().toggleOrderedList().run()}
										title="Ordered List"
									>
										<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
											<line x1="10" y1="6" x2="21" y2="6"></line>
											<line x1="10" y1="12" x2="21" y2="12"></line>
											<line x1="10" y1="18" x2="21" y2="18"></line>
											<path d="M4 6h1v4"></path>
											<path d="M4 10h2"></path>
											<path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"></path>
										</svg>
									</button>
									<button
										type="button"
										className={`p-1 rounded ${editor?.isActive('link') ? 'bg-gray-200 dark:bg-gray-700' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
										onClick={() => setLinkModalOpen(true)}
										title="Link"
									>
										<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
											<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
											<path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
										</svg>
									</button>
								</div>
								<EditorContent 
									editor={editor} 
									className="p-4 prose prose-sm max-w-full min-h-[8rem] focus:outline-none dark:bg-gray-700 dark:text-white [&_.is-editor-empty]:before:text-gray-400 [&_.is-editor-empty]:before:content-[attr(data-placeholder)] [&_.is-editor-empty]:before:float-left [&_.is-editor-empty]:before:pointer-events-none [&_p]:my-1 [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:text-xl [&_h2]:font-bold [&_h3]:text-lg [&_h3]:font-semibold [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-blue-500 [&_a]:underline [&_u]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-gray-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_img]:max-w-full [&_img]:h-auto [&_.text-left]:text-left [&_.text-center]:text-center [&_.text-right]:text-right"
								/>
							</div>
						</div>
					</div>
				</div>
				{/* Save Details Button */}
				<div className="mt-4 flex justify-center">
					<button
						type="button"
						onClick={handleSaveDetails}
						disabled={detailsUnchanged || isLoading}
						className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 ${
							detailsUnchanged || isLoading
								? "text-gray-500 bg-blue-900 cursor-not-allowed"
								: "text-white bg-blue-600 hover:bg-blue-700"
						}`}
					>
						Save Details
					</button>
				</div>
			</fieldset>
			{toast && (
				<Toast
					message={toast.message}
					type={toast.type}
					onClose={() => setToast(null)}
				/>
			)}
			{/* Description Preview Modal */}
			{showDescriptionPreview && (
				<Modal
					isOpen={showDescriptionPreview}
					title="Description Preview"
					onClose={() => setShowDescriptionPreview(false)}
				>
					<div className="p-4 max-h-[80vh] overflow-y-auto">
						<div
							dangerouslySetInnerHTML={{ __html: description }}
						/>
					</div>
				</Modal>
			)}
			{/* Loading Modal */}
			<LoadingModal
				isOpen={isLoading}
				message="Updating product details..."
			/>
			{/* Link URL Modal */}
			<Modal
				isOpen={linkModalOpen}
				onClose={() => {
					setLinkModalOpen(false);
					setLinkUrl('');
				}}
				title="Insert Link"
			>
				<form onSubmit={handleLinkSubmit} className="space-y-4">
					<div>
						<label htmlFor="linkUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
							URL
						</label>
						<input
							type="url"
							id="linkUrl"
							value={linkUrl}
							onChange={(e) => setLinkUrl(e.target.value)}
							placeholder="https://example.com"
							className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
							required
						/>
					</div>
					<div className="flex justify-end space-x-2">
						<button
							type="button"
							onClick={() => {
								setLinkModalOpen(false);
								setLinkUrl('');
							}}
							className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={isProcessingLink}
							className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
						>
							{isProcessingLink ? 'Adding...' : 'Add Link'}
						</button>
					</div>
				</form>
			</Modal>
		</div>
	);
}
