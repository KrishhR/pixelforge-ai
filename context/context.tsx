import { ToolIdTypes } from '@/hooks/usePlanAccess';
import { Canvas } from 'fabric';
import { createContext, useContext } from 'react';

export type CanvasContextTypes = {
    canvasEditor: Canvas | null;
    setCanvasEditor: React.Dispatch<React.SetStateAction<Canvas | null>>;
    processingMessage: string | null;
    setProcessingMessage: React.Dispatch<React.SetStateAction<string | null>>;
    activeTool: ToolIdTypes;
    onToolChange: React.Dispatch<React.SetStateAction<ToolIdTypes>>;
    isCroppingRef: { current: boolean };
};

export const CanvasContext = createContext<CanvasContextTypes | null>(null);

export const useCanvas = () => {
    const context = useContext(CanvasContext);

    if (!context) {
        throw new Error('Context error');
    }

    return context;
};
