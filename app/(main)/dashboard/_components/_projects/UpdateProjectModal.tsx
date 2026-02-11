'use client';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { api } from '@/convex/_generated/api';
import { useConvexMutation, useConvexQuery } from '@/hooks/useConvexQuery';
import { ImageIcon, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

type UpdateProjectModalProps = {
    isOpen: boolean;
    onClose: () => void;
    project: any;
};

const UpdateProjectModal = ({ isOpen, onClose, project }: UpdateProjectModalProps) => {
    const [isUpdating, setIsUpdating] = useState(false);
    const [projectTitle, setProjectTitle] = useState('');
    const [selectedFolderId, setSelectedFolderId] = useState('');

    const { data: folders } = useConvexQuery(api.folders.getUserFolders);
    const { mutate: updateProject } = useConvexMutation(api.projects.updateProject);

    /** Sync state when project changes */
    useEffect(() => {
        if (!project) return;
        setProjectTitle(project.title ?? '');
        setSelectedFolderId(project.folderId ?? '');
    }, [project]);

    const handleClose = () => {
        setIsUpdating(false);
        onClose();
    };

    const handleUpdateProject = async () => {
        if (!projectTitle.trim()) {
            toast.error('Please enter a project title');
            return;
        }

        setIsUpdating(true);

        try {
            await updateProject({
                projectId: project._id,
                title: projectTitle.trim(),
                folderId: selectedFolderId || undefined,
            });

            toast.success('Project updated successfully!');
            onClose();
        } catch (error) {
            console.error('Error updating project:', error);
            toast.error(
                error instanceof Error
                    ? error.message
                    : 'Failed to update project. Please try again.'
            );
        } finally {
            setIsUpdating(false);
        }
    };

    const imgUrl = project?.currentImageUrl || '/placeholder.png';

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-white">
                        Update Project
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* IMAGE */}
                    <Image
                        src={imgUrl}
                        alt="Project preview"
                        width={400}
                        height={256}
                        className="w-full h-64 object-cover rounded-xl border border-white/10"
                    />

                    {/* TITLE */}
                    <div className="space-y-2">
                        <Label htmlFor="project-title" className="text-white">
                            Update Title <span className="text-orange-400">*</span>
                        </Label>
                        <Input
                            id="project-title"
                            value={projectTitle}
                            onChange={(e) => setProjectTitle(e.target.value)}
                            placeholder="Enter project name..."
                            className="bg-slate-700 border-white/20 text-white"
                        />
                    </div>

                    {/* FOLDER */}
                    <div className="space-y-2">
                        <Label className="text-white">Folder</Label>
                        <Select value={selectedFolderId} onValueChange={setSelectedFolderId}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select folder" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectLabel>Folders</SelectLabel>
                                    {folders &&
                                        Array.isArray(folders) &&
                                        folders.map((folder) => (
                                            <SelectItem key={folder._id} value={folder._id}>
                                                {folder.name}
                                            </SelectItem>
                                        ))}
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* INFO */}
                    <div className="bg-slate-700/50 rounded-lg p-4">
                        <div className="flex items-center gap-3">
                            <ImageIcon className="h-4 w-4 text-cyan-400" />
                            <div>
                                <p className="text-white font-medium">{project?.title}</p>
                                <p className="text-white/70 text-sm">
                                    {project?.width} × {project?.height} px
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="gap-3">
                    <Button variant="ghost" onClick={handleClose} disabled={isUpdating}>
                        Cancel
                    </Button>

                    <Button
                        variant="primary"
                        onClick={handleUpdateProject}
                        disabled={!projectTitle.trim() || isUpdating}
                    >
                        {isUpdating ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Updating…
                            </>
                        ) : (
                            'Update'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default UpdateProjectModal;
