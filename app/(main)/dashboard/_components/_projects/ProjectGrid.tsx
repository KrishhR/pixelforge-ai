'use client';

import { useRouter } from 'next/navigation';
import ProjectCard from './ProjectCard';

const ProjectGrid = ({ projects, folders }: { projects: any[]; folders: any[] }) => {
    const router = useRouter();

    const handleEditProject = (projectId: string) => {
        router.push(`editor/${projectId}`);
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {projects.map((project) => (
                <ProjectCard
                    key={project?._id}
                    project={project}
                    onEdit={() => handleEditProject(project._id)}
                    folders={folders}
                />
            ))}
        </div>
    );
};

export default ProjectGrid;
