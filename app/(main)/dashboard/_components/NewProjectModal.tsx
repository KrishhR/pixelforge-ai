import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
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
import UpgradeModal from '@/components/UpgradeModal';
import { api } from '@/convex/_generated/api';
import { useConvexMutation, useConvexQuery } from '@/hooks/useConvexQuery';
import { usePlanAccess } from '@/hooks/usePlanAccess';
import { Crown, ImageIcon, Loader2, Upload, X } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';

const NewProjectModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
    const [isUploading, setIsUploading] = useState<boolean>(false);
    const [projectTitle, setProjectTitle] = useState<string>('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [showUpgradeModal, setShowUpgradeModal] = useState<boolean>(false);

    const router = useRouter();

    const { isFree, canCreateProject } = usePlanAccess();
    const { data: projects } = useConvexQuery(api.projects.getUserProjects);
    const { data: currentUser } = useConvexQuery(api.users.getCurrentUser);
    const { mutate: createProject } = useConvexMutation(api.projects.create);

    const currentProjectCount = (Array.isArray(projects) && projects?.length) || 0;
    const isUnlimited = (currentUser as { unlimitedProjects?: boolean })?.['unlimitedProjects'] === true;
    const canCreate = isUnlimited || canCreateProject(currentProjectCount);

    const handleClose = () => {
        setSelectedFile(null);
        setPreviewUrl(null);
        setProjectTitle('');
        setIsUploading(false);
        onClose();
    };

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const file = acceptedFiles[0];

        if (file) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
            const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
            setProjectTitle(nameWithoutExt || 'Untitled Project');
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.gif'],
        },
        maxFiles: 1,
        maxSize: 20 * 1024 * 1024, // 20MB limit
    });

    const handleCreateProject = async () => {
        if (!canCreate) {
            setShowUpgradeModal(true);
            return;
        }

        if (!selectedFile || !projectTitle.trim()) {
            toast.error('Please select an image and enter a project title');
            return;
        }

        setIsUploading(true);

        try {
            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('fileName', selectedFile.name);

            const uploadResponse = await fetch('api/imagekit/upload', {
                method: 'POST',
                body: formData,
            });
            const uploadData = await uploadResponse.json();

            if (!uploadData.success) {
                throw new Error(uploadData.error || 'Failed to upload image');
            }

            const projectId = await createProject({
                title: projectTitle.trim(),
                originalImageUrl: uploadData.url,
                currentImageUrl: uploadData.url,
                thumbnailUrl: uploadData.thumbnailUrl,
                width: uploadData.width || 800,
                height: uploadData.height || 600,
                canvasState: null,
            });

            toast.success('Project created successfully!');
            router.push(`/editor/${projectId}`);
        } catch (error) {
            console.error('Error creating project: ', error);
            toast.error(
                error instanceof Error
                    ? error.message
                    : 'Failed to create project. Please try again.'
            );
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={handleClose}>
                <DialogContent aria-description="content">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-white">
                            Create New Project
                        </DialogTitle>

                        {!isUnlimited && isFree && (
                            <Badge variant="secondary" className="bg-slate-700 text-white/70">
                                {currentProjectCount}/3 Projects
                            </Badge>
                        )}
                    </DialogHeader>

                    <div className="space-y-6">
                        {!isUnlimited && isFree && currentProjectCount >= 2 && (
                            <Alert className="bg-amber-500/10 border-amber-500/50">
                                <Crown className="h-5 w-5 text-amber-400" />
                                <AlertDescription className="text-amber-300/80">
                                    <div className="font-semibold text-amber-400 mb-1">
                                        {currentProjectCount === 2
                                            ? 'Last Free Project'
                                            : 'Project Limit Reached'}
                                    </div>
                                    {currentProjectCount === 2
                                        ? 'This will be your last free project. Upgrade to Pixelforge Pro for unlimited projects.'
                                        : 'Free plan is limited to 3 projects. Upgrade to Pixelforge Pro to create more projects.'}
                                </AlertDescription>
                            </Alert>
                        )}

                        {/* Upload Area */}
                        {!selectedFile ? (
                            <div
                                {...getRootProps()}
                                className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all 
                                    ${isDragActive ? 'border-cyan-400 bg-cyan-400/5' : 'border-white/20 hover:border-white/40'}
                                    ${!canCreate ? 'opacity-50 pointer-events-none' : ''}
                                `}
                            >
                                <input {...getInputProps()} />
                                <Upload className="h-12 w-12 text-white/50 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-white mb-2">
                                    {isDragActive ? 'Drop your image here' : 'Upload an Image'}
                                </h3>

                                <p className="text-white/70 mb-2">
                                    {canCreate
                                        ? 'Drag and drop your image, or click to browse'
                                        : 'Upgrade to Pro to create more projects'}
                                </p>
                                <p className="text-white/50 text-sm">
                                    Supports PNG, JPG, WEBP upto 20MB
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="relative">
                                    <Image
                                        src={previewUrl!}
                                        alt="Preview"
                                        width="64"
                                        height="64"
                                        className="w-full h-64 object-cover rounded-xl border border-white/10"
                                        loading="lazy"
                                    />
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-green"
                                        onClick={() => {
                                            setSelectedFile(null);
                                            setPreviewUrl(null);
                                            setProjectTitle('');
                                        }}
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="project-title" className="text-white">
                                        Project Title
                                    </Label>
                                    <Input
                                        id="project-title"
                                        type="text"
                                        value={projectTitle}
                                        onChange={(e) => setProjectTitle(e.target.value)}
                                        placeholder="Enter project name..."
                                        className="bg-slate-700 border-white/20 text-white placeholder-white/50 focus:border-cyan-400 focus:ring-cyan-400"
                                    />
                                </div>

                                <div className="bg-slate-700/50 rounded-lg p-4">
                                    <div className="flex items-center gap-3">
                                        <ImageIcon className="h-4 w-4 text-cyan-400" />
                                        <div>
                                            <p className="text-white font-medium">
                                                {selectedFile.name}
                                            </p>
                                            <p className="text-white/70 text-sm">
                                                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="gap-3">
                        <Button
                            variant="ghost"
                            onClick={handleClose}
                            disabled={isUploading}
                            className="text-white/70 hover:text-white"
                        >
                            Cancel
                        </Button>

                        <Button
                            onClick={handleCreateProject}
                            variant="primary"
                            disabled={!selectedFile || !projectTitle.trim() || isUploading}
                        >
                            {isUploading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Creating..
                                </>
                            ) : (
                                'Create Project'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <UpgradeModal
                isOpen={showUpgradeModal}
                onClose={() => setShowUpgradeModal(false)}
                restrictedTool="projects"
                reason="Free plan is limited to 3 projects. Upgrade to Pro for unlimited projects and access to all AI editing tools."
            />
        </>
    );
};

export default NewProjectModal;
