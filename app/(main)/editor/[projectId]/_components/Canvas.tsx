'use client';

import { useCanvas } from '@/context/context';
import { api } from '@/convex/_generated/api';
import { useConvexMutation } from '@/hooks/useConvexQuery';
import { Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Canvas, FabricImage } from 'fabric';

const CanvasEditor = ({ project }: { project: any }) => {
    const [isLoading, setIsLoading] = useState(true);

    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const canvasInstanceRef = useRef<Canvas | null>(null);
    const initializingRef = useRef(false);

    const { canvasEditor, setCanvasEditor, activeTool, onToolChange } = useCanvas();

    const { mutate: updateProject } = useConvexMutation(api.projects.updateProject);

    const calculateViewportScale = () => {
        if (!containerRef.current || !project) return 1;

        const container = containerRef.current;
        const containerWidth = container.clientWidth - 40; // 40px padding
        const containerHeight = container.clientHeight - 40;

        const scaleX = containerWidth / project.width;
        const scaleY = containerHeight / project.height;

        return Math.min(scaleX, scaleY, 1);
    };

    useEffect(() => {
        if (!canvasRef.current || !project || initializingRef.current) return;

        const initializeCanvas = async () => {
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

                const canvas = new Canvas(canvasRef.current!, {
                    width: project.width, // Logical canvas width (design dimensions)
                    height: project.height, // Logical canvas Height (design dimensions)

                    backgroundColor: '#ffffff', // Default white background

                    preserveObjectStacking: true, // Maintain object layer order
                    controlsAboveOverlay: true, // show selection controls above overlay
                    selection: true, // Enable object selection

                    hoverCursor: 'move', // Cursor when hovering over objects
                    moveCursor: 'move', // Cursor when moving objects
                    defaultCursor: 'default', // Default curson

                    allowTouchScrolling: false, // Disable touch scrolling (prevents conflicts)
                    renderOnAddRemove: true, // Auto-render when objects are added or removed
                    skipTargetFind: false, // Allow object target for interactions
                });

                canvas.setDimensions(
                    {
                        width: project.width * viewportScale, // Scaled display width
                        height: project.height * viewportScale, // Scaled display height
                    },
                    { backstoreOnly: true }
                );

                // Apply zoom to scale the entire canvas content
                canvas.setZoom(viewportScale);

                const scaleFactor = window.devicePixelRatio || 1;
                if (scaleFactor > 1) {
                    // Get the canvas element and its 2D context
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

                if (project.currentImageUrl || project.originalImageUrl) {
                    try {
                        // Use current image if available (may have transformations), fallback to original
                        const imageUrl = project.currentImageUrl || project.originalImageUrl;

                        const fabricImage = await FabricImage.fromURL(imageUrl, {
                            crossOrigin: 'anonymous', // Handle CORS for external images
                        });

                        // calculate scaling to fit image within canvas while maintaining aspect Ratio
                        const imgAspectRatio = fabricImage.width / fabricImage.height;
                        const canvasAspectRatio = project.width / project.height;

                        let scaleX, scaleY;
                        if (imgAspectRatio > canvasAspectRatio) {
                            // Image is wider than canvas - scale based on width
                            scaleX = project.width / fabricImage.width;
                            scaleY = scaleX;
                        } else {
                            // Image is taller than canvas - scale based on height
                            scaleY = project.height / fabricImage.height;
                            scaleX = scaleY;
                        }

                        fabricImage.set({
                            left: project.width / 2, // Center horizontally
                            top: project.height / 2, // Center vertically
                            originX: 'center', // Transform origin at the center
                            originY: 'center', // Transform origin at the center
                            scaleX, // Horizontal scale factor
                            scaleY, // Vertical scale factor
                            selectable: true, // allow user to select/move image
                            evented: true, // enable mouse/touch events
                        });

                        // Add image to canvas and ensure it's centered
                        canvas.add(fabricImage);
                        canvas.centerObject(fabricImage);
                    } catch (error) {
                        console.error('Error loading project image: ', error);
                    }
                }

                if (project.canvasState) {
                    try {
                        // Load JSON state - this will restore all objects and their properties
                        await canvas.loadFromJSON(project.canvasState);
                        canvas.requestRenderAll(); // force re-render after loading state
                    } catch (error) {
                        console.error('Error loading canvas state:', error);
                    }
                }

                canvas.calcOffset(); // recalculate canvas position for event handling
                canvas.requestRenderAll(); // trigger initial render

                setCanvasEditor(canvas); // store canvas instance in context
                canvasInstanceRef.current = canvas;

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

        initializeCanvas();
    }, [project]);

    const saveCanvasState = async () => {
        if (!canvasEditor || !project) return;

        try {
            // Export canvas to JSON format (includes all objects and properties)
            const canvasJSON = canvasEditor.toJSON();

            // Save to canvas database
            await updateProject({
                projectId: project._id,
                canvasState: canvasJSON,
            });
        } catch (error) {
            console.error('Error saving canvas state: ', error);
        }
    };

    useEffect(() => {
        if (!canvasEditor) return;
        let saveTimeout: NodeJS.Timeout;

        // Debounced save function - waits 2 seconds after last change
        const handleCanvasChange = () => {
            clearTimeout(saveTimeout);
            saveTimeout = setTimeout(() => {
                saveCanvasState();
            }, 2000);
        };

        // Listens for canvas modification events
        canvasEditor.on('object:modified', handleCanvasChange); // Object moved/transformed
        canvasEditor.on('object:added', handleCanvasChange); // New object added
        canvasEditor.on('object:removed', handleCanvasChange); // Object deleted

        return () => {
            clearTimeout(saveTimeout);
            canvasEditor.off('object:modified', handleCanvasChange);
            canvasEditor.off('object:added', handleCanvasChange);
            canvasEditor.off('object:removed', handleCanvasChange);
        };
    }, [canvasEditor]);

    useEffect(() => {
        const handleResize = () => {
            if (!canvasEditor || !project) return;

            // Recall optimal scale for new window resize
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

    return (
        <div
            ref={containerRef}
            className="relative flex items-center justify-center bg-secondary w-full h-full overflow-hidden"
        >
            <div
                className="absolute inset-0 opacity-10 pointer-events-none"
                style={{
                    backgroundImage: `
                        linear-gradient(45deg, #64748b 25%, transparent 25%),
                        linear-gradient(-45deg, #64748b 25%, transparent 25%),
                        linear-gradient(45deg, transparent 75%, #64748b 75%),
                        linear-gradient(-45deg, transparent 75%, #64748b 75%)`,
                    backgroundSize: '20px 20px',
                    backgroundPosition: '0 0, 0 10px, 10px -10px, 10px 0',
                }}
            />

            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-800/80 z-10">
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="w-8 h-8 animate-spin" />
                        <p className="text-white/70 text-sm">Loading Canvas...</p>
                    </div>
                </div>
            )}

            <div className="px-5">
                <canvas id="canvas" className="border" ref={canvasRef} />
            </div>
        </div>
    );
};

export default CanvasEditor;
