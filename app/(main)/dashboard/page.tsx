'use client';

import { Button } from '@/components/ui/button';
import { api } from '@/convex/_generated/api';
import { useConvexQuery } from '@/hooks/useConvexQuery';
import { Plus, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { BarLoader } from 'react-spinners';
import NewProjectModal from './_components/_projects/NewProjectModal';
import ProjectGrid from './_components/_projects/ProjectGrid';
import useSyncUserPlan from '@/hooks/useSyncUserPlan';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Breadcrumb,
    BreadcrumbList,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import NewFolderModal from './_components/_folders/NewFolderModal';
import FolderGrid from './_components/_folders/FolderGrid';
import Folder from './_components/_folders/Folder';

const Dashboard = () => {
    const { data: projects, isLoading } = useConvexQuery(api.projects.getUserProjects);
    const { data: folders, isLoading: folderLoading } = useConvexQuery(api.folders.getUserFolders);

    const [showNewProjectModal, setShowNewProjectModal] = useState(false); // Controls visibility of the "New Project" modal
    const [showNewFolderModal, setShowNewFolderModal] = useState(false);
    const [activeFolder, setActiveFolder] = useState<{ id: string; name: string } | null>(null);

    useSyncUserPlan(); // Ensures the user's plan is up to date when dashboard loads

    return (
        <div className="min-h-screen pt-28 pb-16">
            <div className="container mx-auto px-6">
                <Tabs
                    defaultValue="projects"
                    onValueChange={() => setActiveFolder(null)}
                    className="w-full mx-auto"
                >
                    {/* Top Bar */}
                    <TabsList className="grid w-full grid-cols-2 bg-slate-700/50 ">
                        <TabsTrigger
                            value="projects"
                            className="flex items-center justify-center rounded-lg py-1 
                                data-[state=active]:bg-slate-700 data-[state=active]:text-white"
                        >
                            All Projects
                        </TabsTrigger>
                        <TabsTrigger
                            value="folders"
                            className="flex items-center justify-center rounded-lg py-1 
                                data-[state=active]:bg-slate-700 data-[state=active]:text-white"
                        >
                            Folders
                        </TabsTrigger>
                    </TabsList>

                    <div className="border-b border-white/10 mb-8" />

                    {/* ===================== */}
                    {/* ALL PROJECTS TAB */}
                    {/* ===================== */}
                    <TabsContent value="projects" className="mt-0">
                        <div className="flex items-center justify-between mb-6">
                            <div className="mb-6">
                                <h1 className="text-3xl font-semibold text-white mb-1">
                                    Your Projects
                                </h1>
                                <p className="text-white/60">
                                    Create and manage your AI-powered image designs
                                </p>
                            </div>

                            <Button
                                onClick={() => setShowNewProjectModal(true)}
                                variant="primary"
                                size="lg"
                                className="gap-2"
                            >
                                <Plus className="h-5 w-5" />
                                New Project
                            </Button>
                        </div>

                        {isLoading ? (
                            <BarLoader width="100%" color="white" />
                        ) : projects && Array.isArray(projects) && projects.length > 0 ? (
                            <ProjectGrid projects={projects} folders={folders} />
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <h3 className="text-2xl font-semibold text-white mb-3">
                                    Create Your First Project
                                </h3>
                                <p className="text-white/70 mb-8 max-w-md">
                                    Upload an image to start editing with our powerful AI tools
                                </p>

                                <Button
                                    onClick={() => setShowNewProjectModal(true)}
                                    variant="primary"
                                    size="xl"
                                    className="gap-2"
                                >
                                    <Sparkles className="h-5 w-5" />
                                    Start Creating
                                </Button>
                            </div>
                        )}
                    </TabsContent>

                    {/* ===================== */}
                    {/* FOLDERS TAB */}
                    {/* ===================== */}
                    <TabsContent value="folders" className="mt-0">
                        <div className="flex items-center justify-between mb-6">
                            {/* Breadcrumbs */}
                            <Breadcrumb className="mb-6">
                                <BreadcrumbList>
                                    <BreadcrumbItem>
                                        <BreadcrumbLink
                                            asChild
                                            className={!activeFolder ? 'text-white' : ''}
                                        >
                                            <Button
                                                variant="glass"
                                                onClick={() => setActiveFolder(null)}
                                            >
                                                Folders
                                            </Button>
                                        </BreadcrumbLink>
                                    </BreadcrumbItem>

                                    {activeFolder !== null && (
                                        <>
                                            <BreadcrumbSeparator />
                                            <BreadcrumbItem>
                                                <Button variant="glass">
                                                    <BreadcrumbPage>
                                                        {activeFolder.name}
                                                    </BreadcrumbPage>
                                                </Button>
                                            </BreadcrumbItem>
                                        </>
                                    )}
                                </BreadcrumbList>
                                <p className="text-white/60 mt-4">
                                    Organize your projects into folders
                                </p>
                            </Breadcrumb>
                            {!activeFolder && (
                                <Button
                                    onClick={() => setShowNewFolderModal(true)}
                                    variant="primary"
                                    size="lg"
                                    className="gap-2"
                                >
                                    <Plus className="h-5 w-5" />
                                    New Folder
                                </Button>
                            )}
                        </div>

                        {/* Folder List View */}
                        {folderLoading ? (
                            <BarLoader width="100%" color="white" />
                        ) : !activeFolder ? (
                            folders && folders.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <FolderGrid
                                        folders={folders}
                                        setActiveFolder={setActiveFolder}
                                    />
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-24 text-center">
                                    <h3 className="text-2xl font-semibold text-white mb-3">
                                        Create Your First Folder
                                    </h3>
                                    <Button
                                        onClick={() => setShowNewFolderModal(true)}
                                        variant="primary"
                                        size="xl"
                                        className="gap-2"
                                    >
                                        <Sparkles className="h-5 w-5" />
                                        Create New Folder
                                    </Button>
                                </div>
                            )
                        ) : null}

                        {/* Folder Detail View */}
                        {activeFolder && <Folder activeFolder={activeFolder} />}
                    </TabsContent>
                </Tabs>

                <NewProjectModal
                    isOpen={showNewProjectModal}
                    onClose={() => setShowNewProjectModal(false)}
                />

                <NewFolderModal
                    isOpen={showNewFolderModal}
                    onClose={() => setShowNewFolderModal(false)}
                    setActiveFolder={setActiveFolder}
                />
            </div>
        </div>
    );
};

export default Dashboard;
