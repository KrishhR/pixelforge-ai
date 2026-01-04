'use client';

import { Button } from '@/components/ui/button';
import { useCanvas } from '@/context/context';
import { FabricImage, Rect, TDegree } from 'fabric';
import {
    CheckCheck,
    Crop,
    LucideProps,
    Maximize,
    RectangleHorizontal,
    RectangleVertical,
    Smartphone,
    Square,
    X,
} from 'lucide-react';
import { ForwardRefExoticComponent, RefAttributes, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

type TypeCropAspectRatio = {
    label: string;
    value: number | null;
    icon: ForwardRefExoticComponent<Omit<LucideProps, 'ref'> & RefAttributes<SVGSVGElement>>;
    ratio?: string;
};

type ImagePropsTypes = {
    left: number;
    top: number;
    width: number;
    height: number;
    scaleX: number;
    scaleY: number;
    angle: number | TDegree;
    selectable: boolean;
    evented: boolean;
};

const CROP_ASPECT_RATIOS: TypeCropAspectRatio[] = [
    {
        label: 'Freeform',
        value: null,
        icon: Maximize,
    },
    {
        label: 'Square',
        value: 1,
        icon: Square,
        ratio: '1:1',
    },
    {
        label: 'Widescreen',
        value: 16 / 9,
        icon: RectangleHorizontal,
        ratio: '16:9',
    },
    {
        label: 'Portrait',
        value: 4 / 5,
        icon: RectangleVertical,
        ratio: '4:5',
    },
    {
        label: 'Story',
        value: 9 / 16,
        icon: Smartphone,
        ratio: '9:16',
    },
];

const CropContent = () => {
    const { canvasEditor, activeTool } = useCanvas();

    const [isCropMode, setIsCropMode] = useState<boolean>(false); // whether crop mode is active or not
    const [selectedImage, setSelectedImage] = useState<FabricImage | null>(null); // The image being cropped
    const [selectedRatio, setSelectedRatio] = useState<number | null>(null); // Currently selected aspect ratio
    const [cropRect, setCropRect] = useState<Rect | null>(null); // The blue crop rectangle overlay
    const [originalProps, setOriginalProps] = useState<ImagePropsTypes | null>(null); // store original image properties for restoration

    const hasInitializedRef = useRef(false);

    // Get the currently selected or main image
    const getActiveImage = (): FabricImage | null => {
        if (!canvasEditor) return null;
        const activeObject = canvasEditor.getActiveObject();

        if (activeObject instanceof FabricImage) return activeObject;

        const objects = canvasEditor.getObjects();
        const imgObj = objects.find((obj) => obj instanceof FabricImage);
        return imgObj instanceof FabricImage ? imgObj : null;
    };

    const removeAllCropRectangles = () => {
        if (!canvasEditor) return;

        const objects = canvasEditor.getObjects();
        const rectsToRemove = objects.filter((obj) => obj.type === 'rect');

        rectsToRemove.forEach((rect) => {
            canvasEditor.remove(rect);
        });

        canvasEditor.requestRenderAll();
    };

    // Create the crop rectangle overlay
    const createCropRectangle = (image: FabricImage) => {
        const bounds = image.getBoundingRect(); // Calculate image bounds on canvas

        const cropRectangle = new Rect({
            left: bounds.left + bounds.width * 0.1,
            top: bounds.top + bounds.height * 0.1,
            width: bounds.width * 0.8,
            height: bounds.height * 0.8,
            fill: 'transparent', // See through interior
            stroke: '#00bcd4', // Cyan border color
            strokeWidth: 2,
            strokeDashArray: [5, 5], // Dashed line effect
            selectable: true, // User can select and resize
            evented: true,
            name: 'cropRect', // Indentifier for this rectangle

            // VISUAL STYLING FOR CROP HANDLES
            cornerColor: '#00bcd4', // Cyan resize handles
            cornerSize: 12,
            transparentCorners: false,
            cornerStyle: 'circle',
            borderColor: '#00bcd4',
            borderScaleFactor: 1,

            // Custom property to identify crop rectangles
            isCropRectangle: true,
        });

        // Handle scaling with aspect ratio constraint
        cropRectangle.on('scaling', () => {
            const rect = cropRectangle as Rect;

            if (selectedRatio && selectedRatio !== null) {
                const currentRatio = (rect.width! * rect.scaleX!) / (rect.height! * rect.scaleY!);

                if (Math.abs(currentRatio - selectedRatio) > 0.01) {
                    const newHeight = (rect.width! * rect.scaleX!) / selectedRatio;
                    // / rect.scaleY!;
                    rect.set({ height: newHeight / rect.scaleY! });
                    rect.setCoords();
                }
            }

            canvasEditor?.requestRenderAll();
        });

        canvasEditor?.add(cropRectangle);
        canvasEditor?.setActiveObject(cropRectangle);
        setCropRect(cropRectangle);
    };

    const initializeCropMode = (image: FabricImage) => {
        if (!image || isCropMode) return; // prevent double initialization
        removeAllCropRectangles();

        const originalImage: ImagePropsTypes = {
            left: image.left!,
            top: image.top!,
            width: image.width!,
            height: image.height!,
            scaleX: image.scaleX!,
            scaleY: image.scaleY!,
            angle: image.angle || 0,
            selectable: image.selectable,
            evented: image.evented,
        };

        setOriginalProps(originalImage);
        setSelectedImage(image);
        setIsCropMode(true);

        image.set({
            evented: false,
            selectable: false,
        });

        createCropRectangle(image);
        canvasEditor?.requestRenderAll();
    };

    const exitCropMode = () => {
        if (!isCropMode) return;

        removeAllCropRectangles();
        setCropRect(null);

        if (selectedImage && originalProps) {
            selectedImage.set({
                selectable: originalProps.selectable,
                evented: originalProps.evented,
                // Restore position and transformation
                left: originalProps.left,
                top: originalProps.top,
                scaleX: originalProps.scaleX,
                scaleY: originalProps.scaleY,
                angle: originalProps.angle,
            });

            canvasEditor?.setActiveObject(selectedImage);
        }

        setIsCropMode(false);
        setOriginalProps(null);
        setSelectedImage(null);
        setSelectedRatio(null);

        if (canvasEditor) {
            canvasEditor.requestRenderAll();
        }
    };

    // Handle tool activation/deactivation
    useEffect(() => {
        if (activeTool === 'crop' && canvasEditor && !isCropMode) {
            const activeImage = getActiveImage();

            if (activeImage) {
                initializeCropMode(activeImage);
            }
        } else if (activeTool !== 'crop' && isCropMode) {
            exitCropMode();
        }
    }, [activeTool, canvasEditor]);

    // Cleanup when component unmounts
    useEffect(() => {
        return () => {
            if (isCropMode) {
                exitCropMode();
            }
        };
    }, []);

    // Apply aspect ratio constraint to crop rectangle
    const applyAspectRatio = (ratio: number | null) => {
        setSelectedRatio(ratio);

        if (!cropRect || ratio == null) return;

        // Calculate new dimensions maintaining aspect ratio
        const currentWidth = cropRect.width! * cropRect.scaleX!;
        const newHeight = currentWidth / ratio;

        cropRect.set({
            height: newHeight / cropRect.scaleY!,
            scaleY: cropRect.scaleX!, // Keep scaling uniform
        });

        cropRect.setCoords();
        canvasEditor?.requestRenderAll();
    };

    const applyCrop = () => {
        if (!selectedImage || !cropRect) {
            toast.error('Image or crop area not found');
            return;
        }

        try {
            const cropBounds = cropRect.getBoundingRect();
            const imageBounds = selectedImage.getBoundingRect();

            const cropX = Math.max(0, cropBounds.left - imageBounds.left);
            const cropY = Math.max(0, cropBounds.top - imageBounds.top);
            const cropWidth = Math.min(cropBounds.width, imageBounds.width - cropX);
            const cropHeight = Math.min(cropBounds.height, imageBounds.height - cropY);

            const imageScaleX = selectedImage.scaleX || 1;
            const imageScaleY = selectedImage.scaleY || 1;

            const actualCropX = cropX / imageScaleX;
            const actualCropY = cropY / imageScaleY;
            const actualCropWidth = cropWidth / imageScaleX;
            const actualCropHeight = cropHeight / imageScaleY;

            const croppedImage = new FabricImage(selectedImage.getElement(), {
                left: cropBounds.left + cropBounds.width / 2,
                top: cropBounds.top + cropBounds.height / 2,

                originX: 'center',
                originY: 'center',
                selectable: true,
                evented: true,

                // APPLY Crop properties with Fabric Js properties
                cropX: actualCropX,
                cropY: actualCropY,
                width: actualCropWidth,
                height: actualCropHeight,
                scaleX: imageScaleX,
                scaleY: imageScaleY,
            });

            // Replace the original image
            canvasEditor?.remove(selectedImage);
            canvasEditor?.add(croppedImage);
            canvasEditor?.setActiveObject(croppedImage);
            canvasEditor?.requestRenderAll();

            // Exit crop mode
            exitCropMode();
        } catch (error) {
            console.error('Error applying crop:', error);
            toast.error('Failed to apply crop. Please try again.');
            exitCropMode();
        }
    };

    if (!canvasEditor) {
        return (
            <div className="p-4">
                <p className="text-sm text-white/70">Canvas not ready</p>
            </div>
        );
    }

    const activeImage = getActiveImage();

    console.log(activeImage, 'obj');

    return (
        <div className="space-y-6">
            {isCropMode && (
                <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-2">
                    <p className="text-cyan-400 text-sm font-medium">✂️ Crop Mode Active</p>
                    <p className="text-cyan-300/80 text-xs mt-1">
                        Adjust the blue rectangle to set crop area
                    </p>
                </div>
            )}

            {!isCropMode && activeImage && (
                <Button
                    variant="primary"
                    className="w-full"
                    onClick={() => initializeCropMode(activeImage)}
                >
                    <Crop className="w-4 h-4 mr-2" />
                    Start Cropping
                </Button>
            )}

            {isCropMode && (
                <div>
                    <h3 className="text-sm font-medium text-white mb-3">Crop Aspect Ratios</h3>
                    <div className="grid grid-cols-3 gap-2">
                        {CROP_ASPECT_RATIOS.map((aspectRatio: TypeCropAspectRatio) => {
                            const IconComponent = aspectRatio.icon;

                            return (
                                <button
                                    key={aspectRatio.label}
                                    onClick={() => applyAspectRatio(aspectRatio.value)}
                                    className={`text-center p-3 border rounded-lg transition-colors cursor-pointer 
                                        ${
                                            selectedRatio === aspectRatio.value
                                                ? 'border-cyan-400 bg-cyan-400/10' // highlighted when selected
                                                : 'border-white/20 hover:border-white/40 hover:bg-white/5'
                                        }`}
                                >
                                    <IconComponent className="h-6 w-6 mx-auto mb-2 text-white" />
                                    <div className="text-xs text-white">{aspectRatio.label}</div>
                                    {aspectRatio.ratio && (
                                        <div className="text-xs text-white/70">
                                            {aspectRatio.ratio}
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {isCropMode && (
                <div className="space-y-3 pt-4 border-t border-white/10">
                    <Button onClick={applyCrop} className="w-full" variant="primary">
                        <CheckCheck className="h-4 w-4 mr-2" />
                        Apply Crop
                    </Button>

                    <Button onClick={() => exitCropMode()} className="w-full" variant="outline">
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                    </Button>
                </div>
            )}

            <div className="bg-slate-700/30 rounded-lg p-3">
                <p className="text-xs text-white/70">
                    <strong>How to crop:</strong>
                    <br />
                    1. Click &quot;Start Cropping&quot;
                    <br />
                    2. Drag the blue rectangle to select crop area
                    <br />
                    3. Choose aspect ratio (optional)
                    <br />
                    4. Click &quot;Apply Crop&quot; to finalize
                </p>
            </div>
        </div>
    );
};

export default CropContent;
