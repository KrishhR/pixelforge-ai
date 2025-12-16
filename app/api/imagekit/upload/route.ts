import { auth } from '@clerk/nextjs/server';
import ImageKit from 'imagekit';
import { NextRequest, NextResponse } from 'next/server';

const imagekit = new ImageKit({
    publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY!,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
    urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT!,
});

export const POST = async (request: NextRequest) => {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get('file');
        const fileName = formData.get('fileName') as string | null;

        if (!file || !(file instanceof File)) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const timeStamp = Date.now();
        const sanitisedFileName = fileName?.replace(/[^a-zA-Z0-9.-]/g, '_') || 'upload';

        const uniqueFileName = `${userId}/${timeStamp}_${sanitisedFileName}`;

        const uploadResponse = await imagekit.upload({
            file: buffer,
            fileName: uniqueFileName,
            folder: '/pixelForge-projects',
        });

        const thumbnailUrl = imagekit.url({
            src: uploadResponse.url,
            transformation: [
                {
                    width: 400,
                    height: 300,
                    cropMode: 'maintain_ar',
                    quality: 80,
                },
            ],
        });

        return NextResponse.json(
            {
                success: true,
                url: uploadResponse.url,
                thumbnailUrl,
                fileId: uploadResponse.fileId,
                width: uploadResponse.width,
                height: uploadResponse.height,
                size: uploadResponse.size,
                name: uploadResponse.name,
            },
            { status: 201 }
        );
    } catch (err) {
        console.error('Imagekit upload error: ', err);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to upload image',
                details: err instanceof Error ? err.message : err,
            },
            { status: 500 }
        );
    }
};
