'use client';

import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useCanvas } from '@/context/context';
import { api } from '@/convex/_generated/api';
import { useConvexMutation } from '@/hooks/useConvexQuery';
import { FabricImage } from 'fabric';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Wand2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { getMainImage } from '../../_utils';

const DIRECTIONS = [
    { key: 'top', label: 'Top', icon: ArrowUp },
    { key: 'bottom', label: 'Bottom', icon: ArrowDown },
    { key: 'left', label: 'Left', icon: ArrowLeft },
    { key: 'right', label: 'Right', icon: ArrowRight },
];
type Direction = (typeof DIRECTIONS)[number]['key'];

const FOCUS_MAP: Record<Direction, string> = {
    left: 'fo-right', // Original image stays on right when extending left
    right: 'fo-left', // Original image stays on left when extending right
    top: 'fo-bottom', // Original image stays on bottom when extending top
    bottom: 'fo-top', // Original image stays on top when extending bottom
} as const;

const AiExtenderControls = ({ project }: { project: any }) => {
    const { canvasEditor, setProcessingMessage } = useCanvas();

    const [selectedDirection, setSelectedDirection] = useState<Direction | null>(null);
    const [extensionAmount, setExtensionAmount] = useState(200);

    const { mutate: updateProject } = useConvexMutation(api.projects.updateProject);

    const getImageSrc = (image: FabricImage | null) => {
        if (!image) return;
        return image.getSrc();
    };

    const hasBackgroundRemoval = () => {
        const imageSrc = getImageSrc(getMainImage(canvasEditor));
        return (
            imageSrc?.includes('e-bgremove') || // Imagekit bg removal
            imageSrc?.includes('e-removedotbg') || // Alternative bg removal
            imageSrc?.includes('e-changebg') // Background change (also removes original)
        );
    };

    const calculateDimensions = () => {
        const img = getMainImage(canvasEditor);
        if (!img || !selectedDirection) return { width: 0, height: 0 };

        const currentWidth = img.width * (img.scaleX || 1);
        const currentHeight = img.height * (img.scaleY || 1);

        const isHorizontal = ['left', 'right'].includes(selectedDirection);
        const isVertical = ['top', 'bottom'].includes(selectedDirection);

        return {
            // Add extension amount only to the relevant dimension
            width: Math.round(currentWidth + (isHorizontal ? extensionAmount : 0)),
            height: Math.round(currentHeight + (isVertical ? extensionAmount : 0)),
        };
    };

    const handleSelectDirection = (direction: Direction) => {
        // Toggle Selection - if same direction is clicked, then deselects it
        setSelectedDirection((prev) => (prev === direction ? null : direction));
    };

    const buildExtensionUrl = (imageUrl: string) => {
        if (!imageUrl || !selectedDirection) return;

        const baseUrl = imageUrl.split('?')[0];
        const { width, height } = calculateDimensions();

        const transformations = [
            'bg-genfill', // AI generative fill for new areas
            `w-${width}`, // New width
            `h-${height}`, // New height
            'cm-pad_resize', // Pad resize mode (adds space rather than cropping)
        ];

        const focus = FOCUS_MAP[selectedDirection];
        if (focus) transformations.push(focus);

        return `${baseUrl}?tr=${transformations.join(',')}`;
    };

    const applyExtension = async () => {
        const mainImage = getMainImage(canvasEditor);
        if (!mainImage || !selectedDirection) return;

        setProcessingMessage('Extending image with AI...');

        try {
            const currentImageUrl = getImageSrc(mainImage);
            const extendedUrl = buildExtensionUrl(currentImageUrl!);

            const extendedImage = await FabricImage.fromURL(extendedUrl!, {
                crossOrigin: 'anonymous', // Required for CORS
            });

            const scale = Math.min(
                project.width / extendedImage.width, // Scale to fit width
                project.height / extendedImage.height // Scale to fit height
                // Dont scale up, only scale down
            );

            extendedImage.set({
                left: project.width / 2, // Center horizontally
                top: project.height / 2, // Center vertically
                originX: 'center', // Use center as origin for positioning
                originY: 'center', // Use center as origin for positioning
                scaleX: scale, // Apply calculated scale
                scaleY: scale, // Apply calculated scale
                selectable: true, // Allow user to select/move
                evented: true, // Allow events
            });

            canvasEditor?.remove(mainImage); // Remove original
            canvasEditor?.add(extendedImage); // Add extendded image
            canvasEditor?.setActiveObject(extendedImage); // Select the new image
            canvasEditor?.requestRenderAll(); // Refresh canvas display

            await updateProject({
                projectId: project._id,
                currentImageUrl: extendedUrl, // Update the current image url
                canvasState: canvasEditor?.toJSON(), // Save canvas state
            });

            setSelectedDirection(null);
            toast.success('Image extended successfully');
        } catch (error) {
            console.error('Error applying extension:', error);
            toast.error('Failed to extend image. Please try again.');
        } finally {
            // Hide processing message
            setProcessingMessage(null);
        }
    };

    if (!canvasEditor) {
        return (
            <div className="p-4">
                <p className="text-white/70 text-sm">Canvas not ready</p>
            </div>
        );
    }

    if (hasBackgroundRemoval()) {
        return (
            <div className="bg-amber-500/10 p-4 rounded-lg border border-amber-500/20">
                <h3 className="font-medium text-amber-400 mb-2">Extension Not Available</h3>
                <p className="text-sm text-amber-300/80">
                    AI Extension cannot be used on images with removed backgrounds. Use extension
                    first, then remove background.
                </p>
            </div>
        );
    }

    const { width: newWidth, height: newHeight } = calculateDimensions();
    const currentImage = getMainImage(canvasEditor);

    if (!currentImage) {
        return <div className="p-4 text-white/70 text-sm">Please add an image first</div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-sm font-medium text-white mb-3">Select Extension Direction</h3>
                <p className="text-xs text-white/70 mb-3">
                    Choose one direction to extend your image
                </p>

                <div className="grid grid-cols-2 gap-3">
                    {DIRECTIONS.map(({ key, label, icon: Icon }) => (
                        <Button
                            key={key}
                            onClick={() => handleSelectDirection(key)}
                            variant={selectedDirection === key ? 'default' : 'outline'}
                            className={`flex items-center gap-2 ${
                                selectedDirection === key ? 'bg-cyan-500 hover:bg-cyan-600' : ''
                            }`}
                        >
                            <Icon className="h-4 w-4" />
                            {label}
                        </Button>
                    ))}
                </div>
            </div>

            <div>
                <div className="flex items-center justify-between mb-2">
                    <label className="text-white text-sm">Extension Amount</label>
                    <span className="text-xs text-white/70">{extensionAmount}px</span>
                </div>
                <Slider
                    value={[extensionAmount]}
                    onValueChange={([value]) => setExtensionAmount(value)}
                    min={50} // Minimum extension
                    max={500} // Maximum extension
                    step={25} // step size
                    className="w-full my-3"
                    disabled={!selectedDirection} // Disabled if no direction selected
                />
            </div>

            {selectedDirection && (
                <div className="bg-slate-700/30 rounded-lg p-3">
                    <h4 className="text-sm font-medium text-white mb-2">Extension Preview</h4>

                    <div className="text-xs text-white/70 space-x-1 leading-relaxed">
                        <div>
                            Current: {Math.round(currentImage.width * (currentImage.scaleX || 1))} x{' '}
                            {Math.round(currentImage.height * (currentImage.scaleY || 1))} px
                        </div>

                        <div className="text-cyan-400">
                            Extended: {newWidth} x {newHeight} px
                        </div>

                        <div className="text-white/50">
                            Canvas: {project.width} x {project.height} px (unchanged)
                        </div>

                        <div className="text-cyan-300">
                            Direction: {DIRECTIONS.find((d) => d.key === selectedDirection)?.label}
                        </div>
                    </div>
                </div>
            )}

            <Button
                onClick={applyExtension}
                disabled={!selectedDirection}
                className="w-full"
                variant="primary"
            >
                <Wand2 className="h-4 w-4" />
                Apply AI Extension
            </Button>

            <div className="bg-slate-700/30 p-3 rounded-lg">
                <p className="text-xs text-white/70">
                    <strong>How it works:</strong> Select one direction → Set amount → Apply
                    extension. AI will intelligently fill the new area in that direction.
                </p>
            </div>
        </div>
    );
};

export default AiExtenderControls;
