'use client';

import { Dispatch, SetStateAction, useState } from 'react';
import NewFolderModal from './NewFolderModal';
import FolderCard from './FolderCard';

type FolderGridTypes = {
    folders: any[];
    setActiveFolder: Dispatch<SetStateAction<{ id: string; name: string } | null>>;
};

const FolderGrid = ({ folders, setActiveFolder }: FolderGridTypes) => {
    const [renameModal, setRenameModal] = useState<{ id: string; name: string } | null>(null);

    return (
        <>
            {folders.map((folder) => {
                return (
                    <FolderCard
                        key={folder?._id}
                        folder={folder}
                        setRenameModal={setRenameModal}
                        setActiveFolder={setActiveFolder}
                    />
                );
            })}

            {renameModal && (
                <NewFolderModal
                    isOpen={true}
                    onClose={() => setRenameModal(null)}
                    setActiveFolder={setActiveFolder}
                    rename
                    folderId={renameModal.id} // Pass the folder ID for renaming
                    folderNewName={renameModal.name}
                />
            )}
        </>
    );
};

export default FolderGrid;
