'use client';

import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList } from '@/components/ui/tabs';
import { useCanvas } from '@/context/context';
import { TabsTrigger } from '@radix-ui/react-tabs';
import { FabricImage } from 'fabric';
import {
    Download,
    ImageIcon,
    Loader2,
    Palette,
    Search,
    Trash,
    Trash2,
    WandSparkles,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { HexColorPicker } from 'react-colorful';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import { useConvexMutation } from '@/hooks/useConvexQuery';
import { api } from '@/convex/_generated/api';

const UNSPLASH_ACCESS_KEY = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY;
const UNSPLASH_API_URL = 'https://api.unsplash.com';

const BackgroundControls = ({ project }: { project: any }) => {
    const { canvasEditor, processingMessage, setProcessingMessage } = useCanvas();
    const { mutate: updateProject } = useConvexMutation(api.projects.updateProject);

    const [backgroundColor, setBackgroundColor] = useState('#9a1d1d'); // Default white color
    const [searchQuery, setSearchQuery] = useState(''); // User's search input
    const [unsplashImages, setUnsplashImages] = useState<any[]>([]); // Search result from unsplash
    const [isSearching, setIsSearching] = useState(false); // Loading state for searching
    const [isGenerating, setIsGenerating] = useState(false); // Loading state for generating AI Background
    const [selectedImageId, setSelectedImageId] = useState<string | null>(null); // Track which image is being processed
    const [promptQuery, setPromptQuery] = useState(''); // Image Prompt state

    // Get the currently selected or main image
    const getActiveImage = (): FabricImage | null => {
        if (!canvasEditor) return null;
        const objects = canvasEditor.getObjects();

        const imgObj = objects.find((obj) => (obj as any).type === 'image') as
            | FabricImage
            | undefined;
        return imgObj instanceof FabricImage ? imgObj : null;
    };

    // Background removal using ImageKit
    const handleBackgroundRemoval = async () => {
        const mainImage = getActiveImage();
        if (!mainImage || !project) return;

        setProcessingMessage('Removing background with AI...');

        try {
            const currentImageUrl = project.currentImageUrl || project.originalImageUrl;

            const bgRemovedUrl = currentImageUrl.includes('ik.imagekit.io')
                ? `${currentImageUrl.split('?')[0]}?tr=e-removedotbg`
                : currentImageUrl;

            const processedImage = await FabricImage.fromURL(bgRemovedUrl, {
                crossOrigin: 'anonymous', // Required for CORS when loading external Images
            });

            const currentProps = {
                left: mainImage.left, // X position
                top: mainImage.top, // Y position
                scaleX: mainImage.scaleX, // Horizontal Scale
                scaleY: mainImage.scaleY, // Vertical Scale
                angle: mainImage.angle, // Rotation angle
                originX: mainImage.originX, // Transform Origin X
                originY: mainImage.originY, // Transform Origin Y
            };

            canvasEditor?.remove(mainImage); // Remove original Image
            canvasEditor?.set(currentProps); // Apply saved properties
            canvasEditor?.add(processedImage); // Add processed Image

            processedImage.setCoords();

            canvasEditor?.setActiveObject(processedImage);
            canvasEditor?.calcOffset(); // Recalculate canvas offset for proper mouse interactions
            canvasEditor?.requestRenderAll(); // Force re-renders

            await updateProject({
                projectId: project._id,
                canvasState: canvasEditor?.toJSON(), // Save current canvas state
                isBackgroundRemoved: true, // Setting background removed to true
            });
        } catch (error) {
            console.error('Error Removing Background', error);
            toast.error('Failed to remove background. Please try again.');
        } finally {
            setProcessingMessage(null);
        }
    };

    // Set canvas background color
    const handleColorBackground = () => {
        if (!canvasEditor) return;

        canvasEditor.backgroundImage = undefined;
        canvasEditor.backgroundColor = backgroundColor;
        canvasEditor.requestRenderAll(); // Re-render to show the change
    };

    // Search Unsplash images
    const searchUnsplashImages = async () => {
        if (!searchQuery.trim() || !UNSPLASH_ACCESS_KEY) return;
        setIsSearching(true);

        try {
            const response = await fetch(
                `${UNSPLASH_API_URL}/search/photos?query=${encodeURIComponent(searchQuery)}&per_page=15`,
                {
                    headers: {
                        Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`, // Unsplash requires this format
                    },
                }
            );

            if (!response.ok) toast.error('Failed to search images');

            const data = await response.json();
            setUnsplashImages(data.results || []); // Store search results
        } catch (error) {
            console.error('Error searching Unsplash:', error);
            toast.error('Failed to search images. Please try again!');
        } finally {
            setIsSearching(false); // Hide loading state
        }
    };

    // Handle search on Enter key
    const handleSearchKeyPress = (e: any) => {
        if (e.key === 'Enter') {
            searchUnsplashImages();
        }
    };

    // Set image as canvas background
    const handleImageBackground = async (imageUrl: string, imageId: string) => {
        if (!canvasEditor) return;
        setSelectedImageId(imageId); // show loading for this specific image

        try {
            // Download and trigger Unsplash download endpoint (required by Unsplash API)
            if (UNSPLASH_ACCESS_KEY) {
                fetch(`${UNSPLASH_API_URL}/photos/${imageId}/download`, {
                    headers: {
                        Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
                    },
                }).catch(() => {}); // Silent fail - analytics tracking shouldn't break functionality
            }

            // Create fabric image from URL
            const fabricImage = await FabricImage.fromURL(imageUrl, {
                crossOrigin: 'anonymous', // Required for CORS
            });

            // USE PROJECT DIMENSIONS instead of canvas dimensions for proper scaling
            const canvasWidth = project.width; // Logical canvas width
            const canvasHeight = project.height; // Logical canvas height

            // Calculate scales
            const scaleX = canvasWidth / fabricImage.width;
            const scaleY = canvasHeight / fabricImage.height;

            // Use Math.max to FILL the entire canvas (ensures no empty space)
            const scale = Math.max(scaleX, scaleY);

            fabricImage.set({
                scaleX: scale,
                scaleY: scale,
                originX: 'center', // Center the image horizontally
                originY: 'center', // Center the image Vertically
                left: canvasWidth / 2, // Use project dimensions
                top: canvasHeight / 2, // Use project dimensions
            });

            canvasEditor.backgroundImage = fabricImage;
            canvasEditor.requestRenderAll();
            setSelectedImageId(null); // Clear loading state
        } catch (error) {
            console.error('Error setting background image:', error);
            toast.error('Failed to set background image. Please try again.');
            setSelectedImageId(null); // Clear loading state
        }
    };

    // Remove canvas background (both color and image)
    const handleClearCanvasBackground = () => {
        if (!canvasEditor) return;

        canvasEditor.set({
            backgroundColor: undefined, // Remove color background
            backgroundImage: undefined, // Remove image background
        });
        canvasEditor.requestRenderAll(); // Re-render canvs
    };

    if (!canvasEditor) {
        return (
            <div className="p-4">
                <p className="text-white/70 text-sm">Canvas not ready</p>
            </div>
        );
    }

    // TODO: Point of Improvement: We can add a Input box for prompt based background change. => refer to fabric.js for this.

    return (
        <div className="space-y-6 relative h-full">
            {/* AI background removal */}
            <div className=" pb-5 border-b border-white/10">
                <h3 className="text-sm font-medium text-white mb-2">AI Background Removal</h3>
                <p className="text-xs text-white/70 mb-4">
                    Automatically remove the background from your image using AI
                </p>

                <Button
                    variant="primary"
                    className="w-full"
                    onClick={handleBackgroundRemoval}
                    disabled={processingMessage !== null || getActiveImage() === null} // Disable if processing or no image
                >
                    <Trash className="h-4 w-4 mr-2" />
                    Remove Image Background
                </Button>
            </div>

            {/* Show warning if no image is available */}
            {!getActiveImage() && (
                <p className="text-xs text-amber-400">
                    Please add an image to the canvas first to remove its background
                </p>
            )}

            {/* AI Background Generator */}
            {/* <div className=" pb-5 border-b border-white/10">
                <h4 className="text-sm font-medium text-white mb-2">AI Background Generator</h4>
                <p className="text-xs text-white/70 mb-4">
                    Generate background images using AI from your text prompt
                </p>

                <div className="flex gap-2">
                    <Input
                        value={promptQuery}
                        onChange={(e) => setPromptQuery(e.target.value)}
                        placeholder="Describe the background you want..."
                        onKeyDown={(e) => {}} // Allow Enter to search
                        className="flex-1 bg-slate-700 border-white/20 text-white"
                    />

                    <Button
                        variant="primary"
                        disabled={isSearching || !promptQuery.trim()} // Disable if searching or empty query
                        onClick={searchUnsplashImages}
                    >
                        {isSearching ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <WandSparkles className="h-4 w-4" />
                        )}
                    </Button>
                </div>
            </div> */}

            <Tabs defaultValue="color" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-slate-700/50 ">
                    <TabsTrigger
                        value="color"
                        className="flex items-center justify-center rounded-lg py-1 
                                data-[state=active]:bg-slate-700 data-[state=active]:text-white"
                    >
                        <Palette className="w-4 h-4 mr-2" />
                        Color
                    </TabsTrigger>
                    <TabsTrigger
                        value="image"
                        className="flex items-center justify-center rounded-lg py-1 
                                data-[state=active]:bg-slate-700 data-[state=active]:text-white"
                    >
                        <ImageIcon className="w-4 h-4 mr-2" />
                        Image
                    </TabsTrigger>
                </TabsList>

                {/* Color Tab */}
                <TabsContent value="color" className="space-y-4 mt-6">
                    <div>
                        <h3 className="text-sm font-medium text-white mb-2">
                            Solid Color Background
                        </h3>
                        <p className="text-xs text-white/70 mb-4">
                            Choose a solid color for your canvas background
                        </p>
                    </div>

                    <div className="space-y-4">
                        <HexColorPicker
                            color={backgroundColor}
                            onChange={setBackgroundColor}
                            style={{ width: '100%' }}
                        />

                        <div className="flex item-center gap-2">
                            <Input
                                value={backgroundColor}
                                onChange={(e) => setBackgroundColor(e.target.value)}
                                placeholder="#ffffff"
                                className="flex-1 bg-slate-700 border-white/20 text-white"
                            />
                            {/* Color preview square */}
                            <div
                                className="w-10 h-10 rounded border border-white/20"
                                style={{ backgroundColor }}
                            />
                        </div>
                        <Button
                            variant="primary"
                            className="w-full"
                            onClick={handleColorBackground}
                        >
                            <Palette className="w-4 h-4 mr-2" />
                            Apply Color
                        </Button>
                    </div>
                </TabsContent>

                {/* Bg Image Tab  */}
                <TabsContent value="image" className="space-y-4 mt-6">
                    <div>
                        <h3 className="text-sm font-medium text-white mb-2">Image Background</h3>
                        <p className="text-xs text-white/70 mb-4">
                            Search and use high-quality images from Unsplash
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search for backgrounds..."
                            onKeyDown={handleSearchKeyPress} // Allow Enter to search
                            className="flex-1 bg-slate-700 border-white/20 text-white"
                        />

                        <Button
                            variant="primary"
                            disabled={isSearching || !searchQuery.trim()} // Disable if searching or empty query
                            onClick={searchUnsplashImages}
                        >
                            {isSearching ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Search className="h-4 w-4" />
                            )}
                        </Button>
                    </div>

                    {unsplashImages.length > 0 && (
                        <div className="space-y-3">
                            <h4 className="text-sm font-medium text-white">
                                Search Results ({unsplashImages.length || 0})
                            </h4>

                            <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-3">
                                {unsplashImages.map((img) => {
                                    return (
                                        <div
                                            key={img.id}
                                            className="relative group cursor-pointer rounded-lg overflow-hidden border border-white/10
                                        hover:border-cyan-400 transition-colors"
                                            onClick={() =>
                                                handleImageBackground(img.urls.regular, img.id)
                                            }
                                        >
                                            <Image
                                                src={img.urls.small}
                                                alt={img.alt_description || 'Background Image'}
                                                className="w-full h-24 object-cover"
                                                width={96}
                                                height={96}
                                                loading="lazy"
                                            />

                                            {selectedImageId === img.id && (
                                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                    <Loader2 className="h-5 w-5 animate-spin text-white" />
                                                </div>
                                            )}

                                            <div
                                                className="absolute inset-0 bg-black/0 group-hover:bg-black/30 
                                                transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100"
                                            >
                                                <Download className="h-5 w-5 text-white" />
                                            </div>

                                            <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-1">
                                                <p className="text-xs text-white/80 truncate">
                                                    by {img.user.name}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {!isSearching && unsplashImages?.length === 0 && searchQuery && (
                        <div className="text-center py-8">
                            <ImageIcon className="h-12 w-12 text-white/30 mx-auto mb-3" />
                            <p className="text-white/70 text-sm">
                                No images found for &quot;{searchQuery}&quot;
                            </p>
                            <p className="text-xs text-white/50">Try a different search term</p>
                        </div>
                    )}

                    {!searchQuery && unsplashImages?.length === 0 && (
                        <div className="text-center py-8">
                            <Search className="h-12 w-12 text-white/30 mx-auto mb-3" />
                            <p className="text-white/70 text-sm">Search for background images</p>
                            <p className="text-xs text-white/50">Powered by Unsplash</p>
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            <div className="py-4 border-t border-white/10 w-full">
                <Button variant="outline" className="w-full" onClick={handleClearCanvasBackground}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear Canvas Background
                </Button>
            </div>
        </div>
    );
};

export default BackgroundControls;
