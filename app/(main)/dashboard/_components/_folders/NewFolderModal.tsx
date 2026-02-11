import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { api } from '@/convex/_generated/api';
import { useConvexMutation } from '@/hooks/useConvexQuery';
import { Loader2 } from 'lucide-react';
import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { toast } from 'sonner';

interface NewFolderModalProps {
    isOpen: boolean;
    onClose: () => void;
    setActiveFolder: Dispatch<SetStateAction<{ id: string; name: string } | null>>;
    rename?: boolean;
    folderNewName?: string;
    folderId?: string; // Required for renaming
}

const NewFolderModal = ({
    isOpen,
    onClose,
    setActiveFolder,
    rename = false,
    folderNewName = '',
    folderId,
}: NewFolderModalProps) => {
    const [folderName, setFolderName] = useState('');

    const { mutate: createFolder, isLoading: creating } = useConvexMutation(
        api.folders.createFolder
    );
    const { mutate: renameFolder, isLoading: renaming } = useConvexMutation(
        api.folders.renameFolder
    );

    // Pre-fill name if renaming
    useEffect(() => {
        if (rename && folderNewName) {
            setFolderName(folderNewName);
        } else {
            setFolderName('');
        }
    }, [rename, folderNewName, isOpen]);

    const handleClose = () => {
        setFolderName('');
        onClose();
    };

    const handleSubmit = async () => {
        const nameTrimmed = folderName.trim();
        if (!nameTrimmed) return;

        try {
            if (rename && folderId) {
                await renameFolder({ folderId, newName: nameTrimmed });
                toast.success('Folder renamed successfully!');

                setActiveFolder({ id: folderId, name: nameTrimmed });
            } else {
                await createFolder({ name: nameTrimmed });
                toast.success('Folder created successfully!');

                // if (newFolderId) {
                //     setActiveFolder({ id: newFolderId, name: nameTrimmed });
                // }
            }

            handleClose();
        } catch (error) {
            console.error('Error:', error);
            toast.error(
                error instanceof Error
                    ? error.message
                    : 'Failed to perform action. Please try again.'
            );
        }
    };

    const loading = rename ? renaming : creating;

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{rename ? 'Rename Folder' : 'Create Folder'}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <Input
                        placeholder="Folder name"
                        value={folderName}
                        onChange={(e) => setFolderName(e.target.value)}
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                    />

                    <div className="flex justify-end gap-2">
                        <Button variant="ghost" onClick={handleClose}>
                            Cancel
                        </Button>

                        <Button
                            variant="primary"
                            disabled={!folderName.trim() || loading}
                            onClick={handleSubmit}
                            className="flex items-center gap-2"
                        >
                            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                            {rename
                                ? loading
                                    ? 'Renaming...'
                                    : 'Rename'
                                : loading
                                  ? 'Creating...'
                                  : 'Create Folder'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default NewFolderModal;
