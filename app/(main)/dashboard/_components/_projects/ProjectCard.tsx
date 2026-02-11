import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/convex/_generated/api';
import { useConvexMutation } from '@/hooks/useConvexQuery';
import { Edit, Ellipsis, Folder, FolderInput, Trash } from 'lucide-react';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useState } from 'react';
import UpdateProjectModal from './UpdateProjectModal';

const ProjectCard = ({
    project,
    onEdit,
    folders,
    fromFolder,
}: {
    project: any;
    onEdit: () => void;
    folders?: any[];
    fromFolder?: boolean;
}) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const [moveToFolder, setMoveToFolder] = useState(false);
    const { mutate: deleteProject, isLoading } = useConvexMutation(api.projects.deleteProject);
    const { mutate: removeProjectFromFolder } = useConvexMutation(
        api.projects.removeProjectFromFolder
    );

    // Format the project's last update time into a human-readable relative string
    // e.g. "3 minutes ago", "2 days ago"
    const lastUpdatedAt = formatDistanceToNow(new Date(project.updatedAt), {
        addSuffix: true,
    });

    // Handles deletion of a project after user confirmation
    const handleDelete = async () => {
        const confirmed = confirm(
            `Are you sure you want to delete "${project.title}"? This action cannot be undone.`
        );

        if (confirmed) {
            try {
                await deleteProject({ projectId: project._id });
                toast.success('Project deleted successfully!');
            } catch (err) {
                console.error('Error Deleting Project: ', err);
                toast.error('Failed to delete project. Please try again.');
            }
        }
    };

    const getFolderName = (id: string) => {
        if (!folders && !Array.isArray(folders)) return;
        return folders.filter((folder) => folder._id === id)[0].name;
    };

    const handleRemoveFromFolder = async () => {
        try {
            await removeProjectFromFolder({ projectId: project?._id });
        } catch (error) {
            console.error('Error removing project from folder:', error);
            toast.error(
                error instanceof Error
                    ? error.message
                    : 'Failed to remove project from folder. Please try again.'
            );
        }
    };

    return (
        <>
            <Card
                className="py-0 group relative bg-slate-800/50 overflow-hidden hover:border-white/20 
        transition-all hover:transform hover:scale-[1.02]"
            >
                <div className="aspect-video bg-slate-70 relative overflow-hidden">
                    {project.thumbnailUrl && (
                        <Image
                            src={project.thumbnailUrl}
                            alt={project.title}
                            width={100}
                            height={100}
                            className="w-full h-full object-cover"
                        />
                    )}

                    <div
                        className={`absolute inset-0 bg-black/60 transition-opacity 
                        flex items-start justify-end
                        ${menuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                    >
                        {/* <Button variant="glass" size="sm" className="gap-2" onClick={onEdit}>
                            <Edit className="h-4 w-4" />
                            Edit
                        </Button> */}

                        {/* <Button
                            variant="glass"
                            size="sm"
                            className="gap-2 text-red-400 hover:text-red-300"
                            onClick={handleDelete}
                            disabled={isLoading}
                        >
                            <Trash className="h-4 w-4" />
                            Delete
                        </Button> */}

                        <div className="mt-2 mr-2 flex gap-2">
                            <Button variant="glass" size="sm" className="gap-2" onClick={onEdit}>
                                <Edit className="h-4 w-4" />
                                Edit
                            </Button>

                            <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="glass"
                                        size="icon"
                                        // className="mt-2 mr-2"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <Ellipsis className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>

                                <DropdownMenuContent
                                    align="end"
                                    className="w-48 bg-slate-800 border-slate-700"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {/* <DropdownMenuItem
                                        className="text-white hover:bg-slate-700 cursor-pointer flex items-center gap-2"
                                        onClick={onEdit}
                                    >
                                        <Edit className="h-4 w-4" />
                                        Edit
                                    </DropdownMenuItem> */}
                                    <DropdownMenuItem
                                        className="text-white hover:bg-slate-700 cursor-pointer flex items-center gap-2"
                                        onClick={() => setMoveToFolder(true)}
                                    >
                                        <FolderInput className="h-4 w-4" />
                                        Update
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    {project?.folderId && (
                                        <DropdownMenuItem
                                            variant="destructive"
                                            className="text-white hover:bg-slate-700 cursor-pointer flex items-center gap-2"
                                            onClick={() => handleRemoveFromFolder()}
                                        >
                                            <FolderInput className="h-4 w-4" />
                                            Remove from folder
                                        </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem
                                        variant="destructive"
                                        className="text-white hover:bg-slate-700 cursor-pointer flex items-center gap-2"
                                        onClick={handleDelete}
                                    >
                                        <Trash className="h-4 w-4" />
                                        Delete
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </div>

                <CardContent className="pb-6">
                    <h3 className="font-semibold text-white mb-1 truncate">{project.title}</h3>
                    {!fromFolder && project?.folderId && (
                        <Badge
                            variant="secondary"
                            className="flex items-center gap-2 text-xs text-white/70 mb-2 bg-slate-700"
                        >
                            <Folder className="h-5 w-5" />
                            <span>{getFolderName(project?.folderId)}</span>
                        </Badge>
                    )}
                    <div className="flex items-center justify-between text-white/70 text-sm">
                        <span>Updated {lastUpdatedAt}</span>
                        <Badge variant="secondary" className="text-xs bg-slate-700 text-white/70">
                            {project.width} x {project.height}
                        </Badge>
                    </div>
                </CardContent>
            </Card>

            <UpdateProjectModal
                isOpen={moveToFolder}
                onClose={() => setMoveToFolder(false)}
                project={project}
            />
        </>
    );
};

export default ProjectCard;
