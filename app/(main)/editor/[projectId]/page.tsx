'use client';

import { useParams } from 'next/navigation';

const Editor = () => {
    const { projectId } = useParams();
    return <div>Editor: {projectId}</div>;
};

export default Editor;
