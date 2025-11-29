import { AuthConfig } from 'convex/server';

const ISSUER_DOMAIN = 'https://super-gator-54.clerk.accounts.dev';
export default {
    providers: [
        {
            domain: process.env.CLERK_JWT_ISSUER_DOMAIN || ISSUER_DOMAIN,
            applicationID: 'convex',
        },
    ],
} satisfies AuthConfig;
