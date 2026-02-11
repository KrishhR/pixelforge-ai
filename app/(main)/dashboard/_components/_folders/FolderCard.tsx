'use client';

import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { api } from '@/convex/_generated/api';
import { useConvexMutation } from '@/hooks/useConvexQuery';
import { formatDistanceToNow } from 'date-fns';
import { EllipsisVertical, Folder, Loader2 } from 'lucide-react';
import { Dispatch, SetStateAction, useState } from 'react';
import { toast } from 'sonner';

type FolderCardTypes = {
    folder: any;
    setRenameModal: Dispatch<SetStateAction<{ id: string; name: string } | null>>;
    setActiveFolder: Dispatch<SetStateAction<{ id: string; name: string } | null>>;
};
const FolderCard = ({ folder, setRenameModal, setActiveFolder }: FolderCardTypes) => {
    const [loadingFolderId, setLoadingFolderId] = useState<string | null>(null);

    const { mutate: deleteFolder } = useConvexMutation(api.folders.deleteFolder);

    // Format the project's last update time into a human-readable relative string
    // e.g. "3 minutes ago", "2 days ago"
    const getLastUpdatedAt = (date: Date) =>
        formatDistanceToNow(new Date(date), { addSuffix: true });

    const openFolder = (id: string, name: string) => {
        setLoadingFolderId(id);
        setTimeout(() => {
            setActiveFolder({ id, name });
            setLoadingFolderId(null);
        }, 300);
    };

    const handleRename = (id: string, name: string) => {
        setRenameModal({ id, name });
    };

    const handleDeleleFolder = async (id: string, folderName: string) => {
        const confirmed = confirm(
            `Are you sure you want to delete "${folderName}"? This action cannot be undone.`
        );

        if (confirmed) {
            try {
                await deleteFolder({ folderId: id });
                toast.success('Folder deleted successfully!');
            } catch (err) {
                console.error('Error Deleting folder: ', err);
                toast.error('Failed to delete folder. Please try again.');
            }
        }
    };

    const isLoading = loadingFolderId === folder._id;
    return (
        <div
            key={folder._id}
            onClick={() => openFolder(folder._id, folder.name)}
            className="group cursor-pointer rounded-lg border border-white/10 bg-white/5 p-5 transition hover:bg-white/10"
        >
            <div className="flex items-center justify-between gap-4">
                {/* Left */}
                <div className="flex items-center gap-3 min-w-0">
                    {isLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin text-white/70" />
                    ) : (
                        <Folder className="h-5 w-5 text-white/70" />
                    )}

                    <div className="min-w-0">
                        <h3 className="truncate text-white font-medium">{folder.name}</h3>
                        <p className="text-white/50 text-sm truncate">
                            Created {getLastUpdatedAt(folder.createdAt)}
                        </p>
                    </div>
                </div>

                {/* Right */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="glass" size="icon" onClick={(e) => e.stopPropagation()}>
                            <EllipsisVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent
                        align="end"
                        className="w-48 bg-slate-800 border-slate-700"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <DropdownMenuItem onClick={() => openFolder(folder._id, folder.name)}>
                            Open
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleRename(folder?._id, folder?.name)}>
                            Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            className="text-red-400"
                            onClick={() => handleDeleleFolder(folder?._id, folder?.name)}
                        >
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
};

export default FolderCard;
