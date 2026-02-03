'use client';

import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import UpgradeModal from '@/components/UpgradeModal';
import { useCanvas } from '@/context/context';
import { api } from '@/convex/_generated/api';
import { useConvexMutation, useConvexQuery } from '@/hooks/useConvexQuery';
import { ToolIdTypes, usePlanAccess } from '@/hooks/usePlanAccess';
import { Canvas, FabricImage, Point } from 'fabric';
import {
    ArrowLeft,
    ChevronDown,
    Crop,
    Download,
    Expand,
    Eye,
    FileImage,
    Loader2,
    Lock,
    LucideProps,
    Maximize2,
    Palette,
    RefreshCcw,
    RotateCcw,
    RotateCw,
    Save,
    Sliders,
    Text,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ForwardRefExoticComponent, RefAttributes, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

/**
 *  Tool definition shape
 */
type ToolsTypes = {
    id: ToolIdTypes;
    label: string;
    icon: ForwardRefExoticComponent<Omit<LucideProps, 'ref'> & RefAttributes<SVGSVGElement>>;
    isActive?: boolean;
    proOnly?: boolean;
};

type TypeFormat = 'JPEG' | 'WEBP' | 'PNG';

type ExportFormatTypes = {
    format: TypeFormat;
    quality: number;
    label: string;
    extension: string;
};

// All available editor tools
const TOOLS: ToolsTypes[] = [
    {
        id: 'resize',
        label: 'Resize',
        icon: Expand,
        isActive: true,
    },
    {
        id: 'crop',
        label: 'Crop',
        icon: Crop,
    },
    {
        id: 'adjust',
        label: 'Adjust',
        icon: Sliders,
    },
    {
        id: 'text',
        label: 'Text',
        icon: Text,
    },
    {
        id: 'background',
        label: 'AI Background',
        icon: Palette,
        proOnly: true,
    },
    {
        id: 'ai_extender',
        label: 'AI Image Extender',
        icon: Maximize2,
        proOnly: true,
    },
    {
        id: 'ai_edit',
        label: 'AI Editing',
        icon: Eye,
        proOnly: true,
    },
];

const EXPORTS_FORMATS: ExportFormatTypes[] = [
    {
        format: 'PNG',
        quality: 1.0,
        label: 'PNG (High Quality)',
        extension: 'png',
    },
    {
        format: 'JPEG',
        quality: 0.9,
        label: 'JPEG (90% Quality)',
        extension: 'jpg',
    },
    {
        format: 'JPEG',
        quality: 0.8,
        label: 'JPEG (80% Quality)',
        extension: 'jpg',
    },
    {
        format: 'WEBP',
        quality: 0.9,
        label: 'webP (90% Quality)',
        extension: 'webp',
    },
];

const EditorTopbar = ({ project }: { project: any }) => {
    const router = useRouter();
    const { activeTool, onToolChange, canvasEditor } = useCanvas(); // Access editor-wide canvas state and tool selection
    const { hasAccess, canExport, isFree } = usePlanAccess(); // Subscription & permission helpers

    const [showUpgradeModal, setShowUpgradeModal] = useState<boolean>(false);
    const [restrictedTools, setRestrictedTools] = useState<ToolIdTypes | 'export' | null>(null);
    const [isExporting, setIsExporting] = useState<boolean>(false);
    const [exportFormat, setExportFormat] = useState<ExportFormatTypes | null>(null);
    const [undoStack, setUndoStack] = useState<string[]>([]);
    const [redoStack, setRedoStack] = useState<string[]>([]);
    const [isUndoRedoOperation, setIsUndoRedoOperation] = useState<boolean>(false);
    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const { mutate: updateProject, isLoading: isSaving } = useConvexMutation(
        api.projects.updateProject
    );
    const { mutate: updateUser } = useConvexMutation(api.users.updateUser);
    const { data: user } = useConvexQuery(api.users.getCurrentUser);

    // Navigate back to the dashboard
    const handleBackToDashboard = () => {
        router.push('/dashboard');
    };

    // Handle tool selection with plan restriction checks
    const handleToolChange = (toolId: ToolIdTypes) => {
        if (!hasAccess(toolId)) {
            setRestrictedTools(toolId);
            setShowUpgradeModal(true);
            return;
        }
        onToolChange(toolId);
    };

    const handleResetToOriginal = async () => {
        if (!canvasEditor || !project || !project.originalImageUrl) {
            toast.error('No original image found to reset to');
            return;
        }

        try {
            canvasEditor.clear();
            canvasEditor.backgroundColor = '#ffffff';
            canvasEditor.backgroundImage = undefined;

            const fabricImage = await FabricImage.fromURL(project.originalImageUrl, {
                crossOrigin: 'anonymous', // Required for CORS
            });

            const imgAspectRatio = fabricImage.width / fabricImage.height;
            const canvasAspectRatio = project.width / project.height;

            const scale =
                imgAspectRatio > canvasAspectRatio
                    ? project.width / fabricImage.width
                    : project.height / fabricImage.height;

            fabricImage.set({
                scaleX: scale,
                scaleY: scale,
                selectable: true,
                evented: true,
            });

            fabricImage.filters = [];
            canvasEditor.add(fabricImage);
            fabricImage.setPositionByOrigin(
                new Point(project.width / 2, project.height / 2),
                'center',
                'center'
            );
            canvasEditor.centerObject(fabricImage);
            canvasEditor.setActiveObject(fabricImage);
            canvasEditor.requestRenderAll();

            await updateProject({
                projectId: project._id,
                canvasState: canvasEditor.toJSON(),
                currentImageUrl: project.originalImageUrl,
                activeTransformations: undefined,
                isBackgroundRemoved: false,
            });

            toast.success('Canvas set to original image.');
        } catch (error) {
            console.error('Error resetting canvas:', error);
            toast.error('Failed to reset canvas. Please try again.');
        }
    };

    const handleManualSave = async () => {
        try {
            await updateProject({
                projectId: project._id,
                canvasState: canvasEditor?.toJSON(),
            });
            toast.success('Project saved successfully!');
        } catch (error) {
            console.error('Error saving project:', error);
            toast.error('Failed to save project. Please try again.');
        }
    };

    const handleExport = async (exportConfig: ExportFormatTypes) => {
        if (!canvasEditor || !project) {
            toast.error('Canvas not ready for export');
            return;
        }

        if (!canExport(user?.exportsThisMonth || 0)) {
            setRestrictedTools('export');
            setShowUpgradeModal(true);
            return;
        }

        setIsExporting(true);
        setExportFormat(exportConfig);

        try {
            const currentZoom = canvasEditor.getZoom();
            const currentViewportTransform = canvasEditor.viewportTransform as [
                number,
                number,
                number,
                number,
                number,
                number,
            ];

            // Resetting for accurate export
            canvasEditor.setZoom(1);
            canvasEditor.setViewportTransform([1, 0, 0, 1, 0, 0]);
            // a, d -> scaling
            // b, c -> skewing
            // e, f -> translation (pan)
            canvasEditor.setDimensions({
                width: project.width,
                height: project.height,
            });
            canvasEditor.requestRenderAll();

            const dataUrl = canvasEditor.toDataURL({
                format: exportConfig.format.toLowerCase() as 'png' | 'webp' | 'jpeg',
                quality: exportConfig.quality,
                multiplier: 1,
            });

            canvasEditor.setZoom(currentZoom);
            canvasEditor.setViewportTransform(currentViewportTransform);
            canvasEditor.setDimensions({
                width: project.width * currentZoom,
                height: project.height * currentZoom,
            });

            canvasEditor.requestRenderAll();

            const link = document.createElement('a');
            link.download = `${project.title}.${exportConfig.extension}`;
            link.href = dataUrl;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            await updateUser({
                updates: {
                    exportsThisMonth: user?.exportsThisMonth + 1,
                },
            });

            toast.success(`Image exported as ${exportConfig.format}!`);
        } catch (error) {
            console.error('Error exporting image:', error);
            toast.error('Failed to export image. Please try again!');
        } finally {
            setIsExporting(false);
            setExportFormat(null);
        }
    };

    // Save canvas state to undo Stack
    const saveToUndoStack = () => {
        if (!canvasEditor || isUndoRedoOperation) return;
        const canvasState = JSON.stringify(canvasEditor.toJSON());

        setUndoStack((prev) => {
            if (prev[prev.length - 1] === canvasState) return prev; //Prevent duplicate states

            const newStack = [...prev, canvasState];
            // Limit undo stack to 20 items to prevent memory issues
            if (newStack.length > 20) {
                newStack.shift();
            }
            return newStack;
        });

        // Clear redo stack when new action is performed
        if (!isUndoRedoOperation) setRedoStack([]);
    };

    // Setup Undo/Redo listeners
    useEffect(() => {
        if (!canvasEditor) return;

        // Save initial state
        const initialState = JSON.stringify(canvasEditor.toJSON());
        setUndoStack([initialState]);
        setRedoStack([]);

        const handleCanvasModified = () => {
            if (isUndoRedoOperation) return;

            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
            // Debounce state saving to avoid too many saves
            saveTimeoutRef.current = setTimeout(() => {
                saveToUndoStack();
            }, 300);
        };

        // Listen to canvas events that should trigger state save
        canvasEditor.on('object:modified', handleCanvasModified);
        canvasEditor.on('object:added', handleCanvasModified);
        canvasEditor.on('object:removed', handleCanvasModified);
        canvasEditor.on('path:created', handleCanvasModified);

        return () => {
            canvasEditor.off('object:modified', handleCanvasModified);
            canvasEditor.off('object:added', handleCanvasModified);
            canvasEditor.off('object:removed', handleCanvasModified);
            canvasEditor.off('path:created', handleCanvasModified);
        };
    }, [canvasEditor, isUndoRedoOperation]);

    const handleUndo = async () => {
        if (!canvasEditor || undoStack.length <= 1) return;
        // Clearing debounce if any
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
            saveTimeoutRef.current = null;
        }

        setIsUndoRedoOperation(true);

        try {
            // Move current state to redo stack
            const currentState = JSON.stringify(canvasEditor.toJSON());
            setRedoStack((prev) => {
                const next = [...prev, currentState];
                if (next.length > 20) next.shift();
                return next;
            });

            // Remove last state from undo stack and apply the previous one
            setUndoStack((prevUndoStack) => {
                if (prevUndoStack.length <= 1) return prevUndoStack;

                const newUndoStack = [...prevUndoStack];
                newUndoStack.pop(); // Remove current state
                const previousState = newUndoStack[newUndoStack.length - 1];

                if (previousState) {
                    canvasEditor.loadFromJSON(JSON.parse(previousState)).then(() => {
                        canvasEditor.requestRenderAll();
                    });
                }

                return newUndoStack;
            });
        } catch (error) {
            console.error('Error during undo:', error);
            toast.error('Failed to undo action');
        } finally {
            setIsUndoRedoOperation(false);
        }
    };

    const handleRedo = async () => {
        if (!canvasEditor || redoStack.length === 0) return;
        // Clearing debounce if any
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
            saveTimeoutRef.current = null;
        }

        setIsUndoRedoOperation(true);

        try {
            // Get the latest state from redo stack
            const newRedoStack = [...redoStack];
            const nextState = newRedoStack.pop(); // Remove current state

            if (nextState) {
                // Save the current state to undo stack
                const currentState = JSON.stringify(canvasEditor.toJSON());
                setUndoStack((prev) => {
                    const next = [...prev, currentState];
                    if (next.length > 20) next.shift();
                    return next;
                });

                // Apply the redo state
                await canvasEditor.loadFromJSON(JSON.parse(nextState));
                canvasEditor.requestRenderAll();
                setRedoStack(newRedoStack);
                toast.success('Redid last action.');
            }
        } catch (error) {
            console.error('Error during redo:', error);
            toast.error('Failed to redo action');
        } finally {
            setIsUndoRedoOperation(false);
        }
    };

    // Check if undo/redo is available
    const canUndo = undoStack.length > 1;
    const canRedo = redoStack.length > 0;

    return (
        <>
            {/* header row */}
            <div className="border-b px-6 py-3">
                <div className="flex items-center justify-between mb-4">
                    {/* RETURN TO DASHBOARD BUTTON */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleBackToDashboard}
                        className="text-white hover:text-gray-300"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        All Projects
                    </Button>

                    <h1 className="font-extrabold capitalize">{project?.title}</h1>

                    <div className="flex items-center gap-3">
                        {/* RESET BUTTON */}
                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={handleResetToOriginal}
                            disabled={isSaving || !project.originalImageUrl}
                        >
                            {isSaving ? (
                                <>
                                    <RefreshCcw className="h-4 w-4 animate-spin" />
                                    Resetting...
                                </>
                            ) : (
                                <>
                                    <RefreshCcw className="h-4 w-4" />
                                    Reset
                                </>
                            )}
                        </Button>

                        {/* MANUAL SAVE BUTTON */}
                        <Button
                            variant="primary"
                            size="sm"
                            className="gap-2"
                            onClick={handleManualSave}
                            disabled={isSaving || !canvasEditor}
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4" />
                                    Save
                                </>
                            )}
                        </Button>

                        {/* EXPORT MENU */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="glass"
                                    size="sm"
                                    className="gap-2"
                                    disabled={isExporting || !canvasEditor}
                                >
                                    {isExporting ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Exporting {exportFormat?.format}...
                                        </>
                                    ) : (
                                        <>
                                            <Download className="h-4 w-4" />
                                            Export
                                            <ChevronDown className="h-4 w-4" />
                                        </>
                                    )}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align="end"
                                className="w-56 bg-slate-800 border-slate-700"
                            >
                                <DropdownMenuLabel className="px-3 py-2 text-sm text-white/70">
                                    Export Resolution: {project.width} x {project.height} px
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator className="bg-slate-700" />
                                {EXPORTS_FORMATS.map((config, index) => (
                                    <DropdownMenuItem
                                        key={index}
                                        className="text-white hover:bg-slate-700 cursor-pointer flex items-center gap-2"
                                        onClick={() => handleExport(config)}
                                    >
                                        <FileImage className="h-4 w-4" />
                                        <div className="flex-1">
                                            <div className="font-medium">{config.label}</div>
                                            <div className="text-xs text-white/50">
                                                {config.format} &#x2022;{' '}
                                                {Math.round(config.quality * 100)}% quality
                                            </div>
                                        </div>
                                    </DropdownMenuItem>
                                ))}
                                {/* Export Limit Info for Free Users */}
                                {isFree && (
                                    <>
                                        <DropdownMenuSeparator className="bg-slate-700" />
                                        <div className="px-3 py-2 text-xs text-white/50">
                                            Free Plan: {user?.exportsThisMonth || 0}/20 exports this
                                            month
                                            {(user?.exportsThisMonth || 0) >= 20 && (
                                                <div className="text-amber-400 mt-1">
                                                    Upgrade to Pro for unlimited exports
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* TOOLS ROW */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {TOOLS.map((tool: ToolsTypes) => {
                            const Icon = tool.icon;
                            const isActive = activeTool === tool.id;
                            const hasToolAccess = hasAccess(tool.id);
                            return (
                                <Button
                                    key={tool.id}
                                    variant={isActive ? 'default' : 'ghost'}
                                    size="sm"
                                    onClick={() => handleToolChange(tool.id)}
                                    className={`gap-2 relative ${
                                        isActive
                                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                                            : 'text-white hover:text-gray-300 hover:bg-gray-100'
                                    } ${!hasToolAccess ? 'opacity-60' : 'cursor-pointer'}`}
                                >
                                    <Icon className="h-4 w-4" />
                                    {tool.label}
                                    {tool.proOnly && !hasToolAccess && (
                                        <Lock className="h-3 w-3 text-amber-400" />
                                    )}
                                </Button>
                            );
                        })}
                    </div>

                    {/* UNDO/REDO BUTTONS */}
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            className={`text-white ${!canUndo ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-700'}`}
                            onClick={handleUndo}
                            disabled={!canUndo || isUndoRedoOperation}
                            title={`Undo ${undoStack.length - 1} actions available`}
                        >
                            <RotateCcw className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className={`text-white ${!canRedo ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-700'}`}
                            onClick={handleRedo}
                            disabled={!canRedo || isUndoRedoOperation}
                            title={`Redo ${redoStack.length - 1} actions available`}
                        >
                            <RotateCw className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            <UpgradeModal
                isOpen={showUpgradeModal}
                onClose={() => {
                    setShowUpgradeModal(false);
                    setRestrictedTools(null);
                }}
                restrictedTool={restrictedTools!}
                reason={
                    restrictedTools === 'export'
                        ? 'Free plan is limited to 20 exports per month. Upgrade to Pro for unlimited exports'
                        : ''
                }
            />
        </>
    );
};

export default EditorTopbar;
