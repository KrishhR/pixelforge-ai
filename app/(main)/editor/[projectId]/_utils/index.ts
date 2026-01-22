import { Canvas, FabricImage } from 'fabric';

/**
 * Returns the first image object found on the Fabric canvas.
 * This function ignores the currently active/selected object
 * and searches all objects by type `"image"`.
 *
 * @param canvasEditor - The Fabric canvas instance to search in.
 * @returns The first `FabricImage` found, or `null` if none exists.
 */
export const getMainImage = (canvasEditor: Canvas | null): FabricImage | null => {
    if (!canvasEditor) return null;

    const imgObj = canvasEditor.getObjects().find((obj) => (obj as any).type === 'image') as
        | FabricImage
        | undefined;

    return imgObj instanceof FabricImage ? imgObj : null;
};

/**
 * Returns the currently active image on the Fabric canvas if one is selected.
 * If no active image is selected, it falls back to the first `FabricImage`
 * found on the canvas.
 *
 * @param canvasEditor - The Fabric canvas instance to search in.
 * @returns The active or first `FabricImage` found, or `null` if none exists.
 */
export const getActiveImage = (canvasEditor: Canvas | null): FabricImage | null => {
    if (!canvasEditor) return null;

    const activeObject = canvasEditor.getActiveObject();

    // Return the active object if it is a FabricImage
    if (activeObject instanceof FabricImage) return activeObject;

    // Otherwise, return the first FabricImage on the canvas
    const objects = canvasEditor.getObjects();
    const imgObj = objects.find((obj) => obj instanceof FabricImage);

    return imgObj instanceof FabricImage ? imgObj : null;
};
