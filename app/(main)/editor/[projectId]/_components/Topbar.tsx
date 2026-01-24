'use client';

import { Button } from '@/components/ui/button';
import UpgradeModal from '@/components/UpgradeModal';
import { useCanvas } from '@/context/context';
import { ToolIdTypes, usePlanAccess } from '@/hooks/usePlanAccess';
import {
    ArrowLeft,
    Crop,
    Expand,
    Eye,
    Lock,
    LucideProps,
    Maximize2,
    Palette,
    RotateCcw,
    RotateCw,
    Sliders,
    Text,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ForwardRefExoticComponent, RefAttributes, useState } from 'react';

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

const EditorTopbar = ({ project }: { project: any }) => {
    const router = useRouter();
    const { activeTool, onToolChange, canvasEditor } = useCanvas(); // Access editor-wide canvas state and tool selection
    const { hasAccess, canExport, isFree } = usePlanAccess(); // Subscription & permission helpers

    const [showUpgradeModal, setShowUpgradeModal] = useState<boolean>(false);
    const [restrictedTools, setRestrictedTools] = useState<ToolIdTypes | string | null>(null);

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

    return (
        <>
            {/* header row */}
            <div className="border-b px-6 py-3">
                <div className="flex items-center justify-between mb-4">
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

                    <div>Right Actions</div>
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
                        <Button variant="ghost" size="sm" className="text-white">
                            <RotateCcw className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-white">
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
