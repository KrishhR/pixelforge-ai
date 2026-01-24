import { SignUp } from '@clerk/nextjs';
import { shadcn } from '@clerk/themes';

const SignUpPage = () => {
    return <SignUp appearance={{ baseTheme: shadcn }} />;
};

export default SignUpPage;
