'use client';

import { api } from '@/convex/_generated/api';
import { useConvexQuery } from '@/hooks/useConvexQuery';
import ProjectCard from '../_projects/ProjectCard';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

type FolderType = {
    activeFolder: { id: string; name: string };
};

const Folder = ({ activeFolder }: FolderType) => {
    const router = useRouter();

    const { data: projects, isLoading } = useConvexQuery(
        api.projects.getProjectsInFolder,
        activeFolder?.id ? { folderId: activeFolder.id } : undefined
    );

    const handleEditProject = (projectId: string) => {
        router.push(`editor/${projectId}`);
    };

    if (isLoading) {
        return (
            <div className="min-h-75 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
            </div>
        );
    }

    if (projects && projects.length > 0) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {projects.map((project: any) => (
                    <ProjectCard
                        key={project._id}
                        project={project}
                        onEdit={() => handleEditProject(project._id)}
                        fromFolder
                    />
                ))}
            </div>
        );
    }

    return (
        <div>
            <h1 className="text-3xl font-semibold text-white mb-2">{activeFolder?.name}</h1>
            <p className="text-white/60 mb-8">Projects inside this folder</p>
            <div className="rounded-lg border border-dashed border-white/20 p-16 text-center text-white/60">
                This folder is empty. Kindly go to All Projects and assign projects to folders.
            </div>
        </div>
    );
};

export default Folder;
