'use client';

import { useCanvas } from '@/context/context';
import { api } from '@/convex/_generated/api';
import { useConvexMutation } from '@/hooks/useConvexQuery';
import { Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Canvas, FabricImage, Point } from 'fabric';

interface CanvasEditorProps {
    project: any;
}

const CanvasEditor = ({ project }: CanvasEditorProps) => {
    const [isLoading, setIsLoading] = useState(true);

    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const canvasInstanceRef = useRef<Canvas | null>(null);
    const initializingRef = useRef(false);

    const { canvasEditor, setCanvasEditor, activeTool, onToolChange, isCroppingRef } = useCanvas();

    const { mutate: updateProject } = useConvexMutation(api.projects.updateProject);

    const calculateViewportScale = (): number => {
        if (!containerRef.current || !project) return 1;

        const container = containerRef.current;
        const containerWidth = container.clientWidth - 40; // 40px padding
        const containerHeight = container.clientHeight - 40;

        const scaleX = containerWidth / project.width;
        const scaleY = containerHeight / project.height;

        return Math.min(scaleX, scaleY, 1);
    };

    const initializeCanvas = async () => {
        if (initializingRef.current) return;
        initializingRef.current = true;

        try {
            setIsLoading(true);

            // Dispose previous canvas if it exists
            if (canvasInstanceRef.current) {
                try {
                    canvasInstanceRef.current.dispose();
                } catch (error) {
                    console.error('Error disposing previous canvas:', error);
                }
                canvasInstanceRef.current = null;
            }

            const viewportScale = calculateViewportScale();

            // Create new Canvas instance with proper configuration
            const canvas = new Canvas(canvasRef.current!, {
                width: project.width, // Logical canvas width (design dimensions)
                height: project.height, // Logical canvas height (design dimensions)
                backgroundColor: '#ffffff', // Default white background
                preserveObjectStacking: true, // Maintain object layer order
                controlsAboveOverlay: true, // Show selection controls above overlay
                selection: true, // Enable object selection
                hoverCursor: 'move', // Cursor when hovering over objects
                moveCursor: 'move', // Cursor when moving objects
                defaultCursor: 'default', // Default cursor
                allowTouchScrolling: false, // Disable touch scrolling (prevents conflicts)
                renderOnAddRemove: true, // Auto-render when objects are added or removed
                skipTargetFind: false, // Allow object target for interactions
            });

            // Set display dimensions with viewport scaling
            canvas.setDimensions(
                {
                    width: project.width * viewportScale, // Scaled display width
                    height: project.height * viewportScale, // Scaled display height
                },
                { backstoreOnly: false } // Update both CSS and canvas element dimensions
            );

            // Apply zoom to scale the entire canvas content
            canvas.setZoom(viewportScale);

            // High DPI (Retina) support
            const scaleFactor = window.devicePixelRatio || 1;
            if (scaleFactor > 1) {
                const canvasElement = canvas.getElement();
                const ctx = canvasElement.getContext('2d');

                if (ctx) {
                    // Increase canvas resolution for high DPI displays
                    canvasElement.width = scaleFactor * project.width;
                    canvasElement.height = scaleFactor * project.height;

                    // Scale the drawing context to match
                    ctx.scale(scaleFactor, scaleFactor);
                }
            }

            // Load project image if available
            if (project.currentImageUrl || project.originalImageUrl) {
                try {
                    // Use current image if available (may have transformations), fallback to original
                    const imageUrl = project.currentImageUrl || project.originalImageUrl;

                    // FabricImage.fromURL returns a Promise in v6
                    const fabricImage = await FabricImage.fromURL(
                        imageUrl!,
                        { crossOrigin: 'anonymous' } // Handle CORS for external images
                    );

                    // Calculate scaling to fit image within canvas while maintaining aspect ratio
                    const imgAspectRatio = fabricImage.width / fabricImage.height;
                    const canvasAspectRatio = project.width / project.height;

                    let scaleX: number, scaleY: number;
                    if (imgAspectRatio > canvasAspectRatio) {
                        // Image is wider than canvas - scale based on width
                        scaleX = project.width / fabricImage.width;
                        scaleY = scaleX;
                    } else {
                        // Image is taller than canvas - scale based on height
                        scaleY = project.height / fabricImage.height;
                        scaleX = scaleY;
                    }

                    // Set scale first, BEFORE setting position
                    fabricImage.set({
                        scaleX,
                        scaleY,
                        selectable: true,
                        evented: true,
                    });

                    // Add to canvas first
                    canvas.add(fabricImage);

                    // Now center the object - this will properly account for the scaled dimensions
                    fabricImage.setPositionByOrigin(
                        new Point(project.width / 2, project.height / 2),
                        'center',
                        'center'
                    );

                    canvas.setActiveObject(fabricImage);
                    canvas.requestRenderAll();
                } catch (error) {
                    console.error('Error loading project image:', error);
                }
            }

            // Load saved canvas state if available
            if (project.canvasState) {
                try {
                    // loadFromJSON returns a Promise in v6
                    await canvas.loadFromJSON(project.canvasState);
                    canvas.requestRenderAll(); // Force re-render after loading state
                } catch (error) {
                    console.error('Error loading canvas state:', error);
                }
            }

            canvas.calcOffset(); // Recalculate canvas position for event handling
            canvas.requestRenderAll(); // Trigger initial render

            setCanvasEditor(canvas); // Store canvas instance in context
            canvasInstanceRef.current = canvas;

            // Workaround for initial resize issues
            setTimeout(() => {
                window.dispatchEvent(new Event('resize'));
            }, 500);
        } catch (error) {
            console.error('Error initializing canvas:', error);
        } finally {
            setIsLoading(false);
            initializingRef.current = false;
        }
    };

    // Initialize canvas when component mounts or project changes
    useEffect(() => {
        if (!canvasRef.current || !project || initializingRef.current) return;

        initializeCanvas();

        // Cleanup function
        return () => {
            if (canvasInstanceRef.current) {
                try {
                    canvasInstanceRef.current.dispose();
                } catch (error) {
                    console.error('Error disposing canvas:', error);
                }
                canvasInstanceRef.current = null;
                setCanvasEditor(null);
            }
        };
    }, [project]);

    // Auto-save canvas state with debouncing
    const saveCanvasState = async () => {
        if (!canvasEditor || !project) return;

        try {
            // Export canvas to JSON format (includes all objects and properties)
            const canvasJSON = canvasEditor.toJSON();

            // Check if canvas state has actually changed
            if (JSON.stringify(canvasJSON) === JSON.stringify(project.canvasState)) {
                return; // No changes, skip save
            }

            // Save to database
            await updateProject({
                projectId: project._id,
                canvasState: canvasJSON,
            });
        } catch (error) {
            console.error('Error saving canvas state:', error);
        }
    };

    // Set up auto-save listeners
    useEffect(() => {
        if (!canvasEditor) return;
        let saveTimeout: NodeJS.Timeout;

        // Debounced save function - waits 2 seconds after last change
        const handleCanvasChange = () => {
            if (isCroppingRef.current) return;

            clearTimeout(saveTimeout);
            saveTimeout = setTimeout(() => {
                saveCanvasState();
            }, 2000);
        };

        // Listen for canvas modification events
        canvasEditor.on('object:modified', handleCanvasChange); // Object moved/transformed
        canvasEditor.on('object:added', handleCanvasChange); // New object added
        canvasEditor.on('object:removed', handleCanvasChange); // Object deleted

        return () => {
            clearTimeout(saveTimeout);
            canvasEditor.off('object:modified', handleCanvasChange);
            canvasEditor.off('object:added', handleCanvasChange);
            canvasEditor.off('object:removed', handleCanvasChange);
        };
    }, [canvasEditor, project]);

    // Handle window resize
    useEffect(() => {
        const handleResize = () => {
            if (!canvasEditor || !project) return;

            // Recalculate optimal scale for new window size
            const newScale = calculateViewportScale();

            // Update canvas display dimensions
            canvasEditor.setDimensions(
                {
                    width: project.width * newScale,
                    height: project.height * newScale,
                },
                { backstoreOnly: false }
            );

            canvasEditor.setZoom(newScale);
            canvasEditor.calcOffset(); // Update mouse event coordinates
            canvasEditor.requestRenderAll(); // Re-render with new dimensions
        };

        window.addEventListener('resize', handleResize);

        return () => window.removeEventListener('resize', handleResize);
    }, [canvasEditor, project]);

    // Update cursor based on active tool
    useEffect(() => {
        if (!canvasEditor) return;

        switch (activeTool) {
            case 'crop':
                // Crop tool shows crosshair cursor for precision selection
                canvasEditor.defaultCursor = 'crosshair';
                canvasEditor.hoverCursor = 'crosshair';
                break;
            default:
                // Default tools show standard cursor
                canvasEditor.defaultCursor = 'default';
                canvasEditor.hoverCursor = 'move';
        }
    }, [canvasEditor, activeTool]);

    // Handle automatic tab switching when text is selected
    useEffect(() => {
        if (!canvasEditor || !onToolChange) return;

        const handleSelection = (e: any) => {
            const selectedObject = e.selected?.[0];
            if (selectedObject && selectedObject.type === 'i-text') {
                onToolChange('text');
            }
        };

        canvasEditor.on('selection:created', handleSelection);
        canvasEditor.on('selection:updated', handleSelection);

        return () => {
            canvasEditor.off('selection:created', handleSelection);
            canvasEditor.off('selection:updated', handleSelection);
        };
    }, [canvasEditor, onToolChange]);

    return (
        <div
            ref={containerRef}
            className="relative flex items-center justify-center bg-secondary w-full h-full overflow-hidden"
        >
            {/* Checkered background pattern */}
            <div
                className="absolute inset-0 opacity-10 pointer-events-none"
                style={{
                    backgroundImage: `
                        linear-gradient(45deg, #64748b 25%, transparent 25%),
                        linear-gradient(-45deg, #64748b 25%, transparent 25%),
                        linear-gradient(45deg, transparent 75%, #64748b 75%),
                        linear-gradient(-45deg, transparent 75%, #64748b 75%)`,
                    backgroundSize: '20px 20px',
                    backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                }}
            />

            {/* Loading overlay */}
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-800/80 z-10">
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
                        <p className="text-white/70 text-sm">Loading Canvas...</p>
                    </div>
                </div>
            )}

            {/* Canvas element */}
            <div className="px-5">
                <canvas id="canvas" className="border" ref={canvasRef} />
            </div>
        </div>
    );
};

export default CanvasEditor;
