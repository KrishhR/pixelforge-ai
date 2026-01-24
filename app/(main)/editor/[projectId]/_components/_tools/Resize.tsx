'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCanvas } from '@/context/context';
import { api } from '@/convex/_generated/api';
import { useConvexMutation } from '@/hooks/useConvexQuery';
import { Expand, Lock, Monitor, Unlock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
/**
 * Type for predefined aspect ratio options
 */
type TypeResizeAspectRatio = {
    name: string;
    ratio: number[];
    label: string;
};

// Common social/media aspect ratio presets
const RESIZE_ASPECT_RATIOS: TypeResizeAspectRatio[] = [
    { name: 'Instagram Story', ratio: [9, 16], label: '9:16' },
    { name: 'Instagram Post', ratio: [1, 1], label: '1:1' },
    { name: 'Youtube Thumbnail', ratio: [16, 9], label: '16:9' },
    { name: 'Portrait', ratio: [2, 3], label: '2:3' },
    { name: 'Facebook Cover', ratio: [851, 315], label: '2.7:1' },
    { name: 'Twitter Header', ratio: [3, 1], label: '3:1' },
];

const ResizeControl = ({ project }: { project: any }) => {
    const { canvasEditor, processingMessage, setProcessingMessage } = useCanvas();

    const [newWidth, setNewWidth] = useState<number>(+project?.width || 800); // Target Width
    const [newHeight, setNewHeight] = useState<number>(+project?.height || 600); // Target Height
    const [lockAspectRatio, setLockAspectRatio] = useState<boolean>(false); // Whether to maintain proportions
    const [selectedPreset, setSelectedPreset] = useState<string | null>(null); // Currently selected preset

    const {
        mutate: updateProject,
        data,
        isLoading,
    } = useConvexMutation(api.projects.updateProject);

    // Detect whether user actually changed dimensions
    const hasChanges: boolean = newWidth !== project?.width || newHeight !== project?.height;

    /**
     * Trigger window resize after successful update
     * (helps canvas recalc layout in parent containers)
     */
    useEffect(() => {
        if (!isLoading && data) {
            setTimeout(() => {
                window.dispatchEvent(new Event('resize'));
            }, 500);
        }
    }, [data, isLoading]);

    /**
     * Handle manual width input
     * Updates height automatically if aspect ratio is locked
     */
    const handleWidthChange = (value: string) => {
        const width = parseInt(value) || 0;
        setNewWidth(width);

        if (lockAspectRatio && project) {
            const ratio = project.height / project.width; // Current aspect ratio
            setNewHeight(Math.round(width * ratio)); // Apply ratio to new width
        }

        setSelectedPreset(null);
    };

    /**
     * Handle manual height input
     * Updates width automatically if aspect ratio is locked
     */
    const handleHeightChange = (value: string) => {
        const height = parseInt(value) || 0;
        setNewHeight(height);

        if (lockAspectRatio && project) {
            const ratio = project.height / project.width; // Current aspect ratio
            setNewWidth(Math.round(height * ratio)); // Apply ratio to new height
        }

        setSelectedPreset(null);
    };

    // Calculate dimensions for aspect ratio based on original canvas size
    const calculateAspectRatioDimensions = (ratio: number[]) => {
        if (!project) return { width: project.width, height: project.height };

        const [ratioWidth, ratioHeight] = ratio;

        const originalArea = project.width * project.height; // Preserve total Pixel area
        const aspectRatio = ratioWidth / ratioHeight;

        const newHeight = Math.sqrt(originalArea / aspectRatio);
        const newWidth = newHeight * aspectRatio;

        return {
            width: Math.round(newWidth),
            height: Math.round(newHeight),
        };
    };

    // Apply a predefined aspect ratio preset
    const applyAspectRatio = (aspectRatio: TypeResizeAspectRatio) => {
        const dimensions = calculateAspectRatioDimensions(aspectRatio.ratio);
        setNewWidth(dimensions.width);
        setNewHeight(dimensions.height);
        setSelectedPreset(aspectRatio.name);
    };

    // Calculates zoom level so canvas fits inside its container
    const calculateViewportScale = () => {
        const container = canvasEditor?.getElement().parentElement;

        if (!container) return 1;

        const containerWidth = container.clientWidth - 40; // 40px padding
        const containerHeight = container?.clientHeight - 40;

        const scaleX = containerWidth / newWidth;
        const scaleY = containerHeight / newHeight;

        return Math.min(scaleX, scaleY, 1);
    };

    // Applies resize to Fabric canvas and persists it
    const handleApplyResize = async () => {
        if (
            !canvasEditor ||
            !project ||
            (newWidth === project?.width && newHeight === project?.height)
        ) {
            return; // No changes needed
        }

        setProcessingMessage('Resizing canvas...');

        try {
            // Resize the canvas
            canvasEditor.setWidth(newWidth); // Internal canvas width
            canvasEditor.setHeight(newHeight); // Internal canvas height

            // Calculate and apply viewport scale
            const viewportScale = calculateViewportScale();

            canvasEditor.setDimensions(
                {
                    width: newWidth * viewportScale, // Visual Width
                    height: newHeight * viewportScale, // Visual height
                },
                { backstoreOnly: false } // Update both canvas layers
            );

            canvasEditor.setZoom(viewportScale); // set zoom level
            canvasEditor.calcOffset(); // Recalculate mouse coordinates
            canvasEditor.requestRenderAll(); // Trigger redraw

            // Update project in database
            await updateProject({
                projectId: project?._id,
                width: newWidth,
                height: newHeight,
                canvasState: canvasEditor.toJSON(), // Save current canvas state
            });
        } catch (error) {
            console.error('Error resizing canvas:', error);
            toast.error('Failed to resize canvas. Please try again.');
        } finally {
            setProcessingMessage(null);
        }
    };

    if (!canvasEditor || !project) {
        return (
            <div className="p-4">
                <p className="text-white/70 text-sm">Canvas not ready</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Current canvas size */}
            <div className="bg-slate-700/30 rounded-lg p-3">
                <h4 className="text-sm font-medium text-white mb-2">Current Size</h4>
                <div className="text-xs text-white/70">
                    {project.width} x {project.height} pixels
                </div>
            </div>

            {/* Custom resize inputs */}
            <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-white">Custom Size</h3>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setLockAspectRatio(!lockAspectRatio)}
                        className="text-white/70 hover:text-white p-1"
                    >
                        {lockAspectRatio ? (
                            <Lock className="h-4 w-4" /> // Locked - Proportions maintained
                        ) : (
                            <Unlock className="h-4 w-4" /> // Unlocked - Free Size
                        )}
                    </Button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <Input
                            type="number"
                            value={newWidth}
                            onChange={(e) => handleWidthChange(e.target.value)}
                            min="100"
                            max="5000"
                            className="bg-slate-700 border-white/20 text-white"
                        />
                    </div>
                    <div>
                        <Input
                            type="number"
                            value={newHeight}
                            onChange={(e) => handleHeightChange(e.target.value)}
                            min="100" // Minimum reasonable canvas width
                            max="5000" // Maximum to prevent memory issues
                            className="bg-slate-700 border-white/20 text-white"
                        />
                    </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                    <span className="text-white/70">
                        {lockAspectRatio ? 'Aspect ratio locked' : 'Free resize'}
                    </span>
                </div>
            </div>

            {/* Predefined Aspect ratios */}
            <div className="space-y-3">
                <h3 className="text-sm font-medium text-white">Aspect Ratios</h3>
                <div className="grid grid-cols-1 px-3 gap-2 max-h-65 overflow-y-auto">
                    {RESIZE_ASPECT_RATIOS.map(
                        (aspectRatio: TypeResizeAspectRatio, index: number) => {
                            const dimensions = calculateAspectRatioDimensions(aspectRatio.ratio);

                            return (
                                <Button
                                    key={aspectRatio.name}
                                    variant={
                                        selectedPreset === aspectRatio.name ? 'default' : 'outline'
                                    }
                                    size="sm"
                                    onClick={() => applyAspectRatio(aspectRatio)}
                                    className={`justify-between h-auto py-2 ${
                                        selectedPreset === aspectRatio.name
                                            ? 'bg-cyan-500 hover:bg-cyan-600'
                                            : 'text-left'
                                    }`}
                                >
                                    <div>
                                        <div className="font-medium">{aspectRatio.name}</div>
                                        <div className="text-xs opacity-70">
                                            {dimensions.width} * {dimensions.height} (
                                            {aspectRatio.label})
                                        </div>
                                    </div>
                                    <Monitor className="h-4 w-4" />
                                </Button>
                            );
                        }
                    )}
                </div>
            </div>

            {/* Resize preview */}
            {hasChanges && (
                <div className="bg-slate-700/30 rounded-lg p-3">
                    <h4 className="text-sm font-medium text-white mb-2">New Size Preview</h4>
                    <div className="text-xs text-white/70">
                        <div>
                            New Canvas: {newWidth} * {newHeight} pixels
                        </div>
                        <div className="text-cyan-400">
                            {/* Indicates whether canvas will grow or shrink */}
                            {newWidth > project.width || newHeight > project.height
                                ? 'Canvas will be expanded' // Growing - add space
                                : 'Canvas will be cropped'}{' '}
                            {/* Shrinking - may cut content */}
                        </div>
                        <div className="text-white/50 mt-1">
                            Objects will maintain their current size and position
                        </div>
                    </div>
                </div>
            )}

            {/* Apply button */}
            <Button
                onClick={handleApplyResize}
                className="w-full"
                variant="primary"
                disabled={!hasChanges || processingMessage != null} // Disabling if no changes or processing
            >
                <Expand className="h-4 w-4 mr-2" />
                Apply Resize
            </Button>

            {/* Help text */}
            <div className="bg-slate-700/30 rounded-lg p-3">
                <p className="text-xs text-white/70 leading-normal">
                    <strong>Resize Canvas:</strong> Changes canvas dimensions.
                    <br />
                    <strong>Aspect Ratios:</strong> Smart sizing based on your current canvas.
                    <br />
                    Objects maintain their size and dimensions.
                </p>
            </div>
        </div>
    );
};

export default ResizeControl;
