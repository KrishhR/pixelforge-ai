import { SignIn } from '@clerk/nextjs';
import { shadcn } from '@clerk/themes';

const SignInPage = () => {
    return <SignIn appearance={{ baseTheme: shadcn }} />;
};

export default SignInPage;
