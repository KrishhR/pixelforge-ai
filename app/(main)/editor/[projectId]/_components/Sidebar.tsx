import { useCanvas } from '@/context/context';
import { ToolIdTypes } from '@/hooks/usePlanAccess';
import { Crop, Expand, Eye, LucideProps, Maximize2, Palette, Sliders, Text } from 'lucide-react';
import { ForwardRefExoticComponent, RefAttributes } from 'react';
import CropContent from './_tools/Crop';
import ResizeControl from './_tools/Resize';
import AdjustControl from './_tools/Adjust';
import BackgroundControls from './_tools/AiBackground';
import TextControls from './_tools/Text';
import AiExtenderControls from './_tools/AiExtender';
import AiEditingControls from './_tools/AiEditing';

type ToolsConfigTypes = {
    [key in ToolIdTypes]: {
        title: string;
        icon: ForwardRefExoticComponent<Omit<LucideProps, 'ref'> & RefAttributes<SVGSVGElement>>;
        description: string;
    };
};
const TOOL_CONFIGS: ToolsConfigTypes = {
    resize: {
        title: 'Resize',
        icon: Expand,
        description: 'Change project dimensions',
    },
    crop: {
        title: 'Crop',
        icon: Crop,
        description: 'Crop and trim your image',
    },
    adjust: {
        title: 'Adjust',
        icon: Sliders,
        description: 'Brightness, contrast, and more (Manual saving required)',
    },
    background: {
        title: 'Background',
        icon: Palette,
        description: 'Remove or change background',
    },
    ai_extender: {
        title: 'AI Image Extender',
        icon: Maximize2,
        description: 'Extend image boundaries with AI',
    },
    text: {
        title: 'Add Text',
        icon: Text,
        description: 'Customize in Various Fonts',
    },
    ai_edit: {
        title: 'AI Editing',
        icon: Eye,
        description: 'Enhance image quality with AI',
    },
};

const EditorSidbar = ({ project }: { project: any }) => {
    const { activeTool } = useCanvas();

    const toolConfig = TOOL_CONFIGS[activeTool];

    if (!toolConfig) {
        return null;
    }

    const Icon = toolConfig.icon;
    const toolTitle = toolConfig.title;
    const toolDesc = toolConfig.description;

    return (
        <div className="min-w-96 max-w-100 border-r flex flex-col">
            <div className="p-4 border-b">
                <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 text-white" />
                    <h2 className="text-lg font-semibold text-white">{toolTitle}</h2>
                </div>
                <p className="text-sm text-white mt-1">{toolDesc}</p>
            </div>

            {/* Sidebar Content */}
            <div className="flex-1 p-4 overflow-y-scroll">
                {renderToolContent({ activeTool, project })}
            </div>
        </div>
    );
};

const renderToolContent = ({ activeTool, project }: { activeTool: ToolIdTypes; project: any }) => {
    switch (activeTool) {
        case 'resize':
            return <ResizeControl project={project} />;
        case 'crop':
            return <CropContent />;
        case 'adjust':
            return <AdjustControl />;
        case 'text':
            return <TextControls />;
        case 'background':
            return <BackgroundControls project={project} />;
        case 'ai_extender':
            return <AiExtenderControls project={project} />;
        case 'ai_edit':
            return <AiEditingControls project={project} />;

        default:
            return <div className="text-white">Select a tool to get started</div>;
    }
};
export default EditorSidbar;
