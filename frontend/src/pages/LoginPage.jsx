import Layout from "../components/layout/Layout";
import LoginForm from "../components/auth/LoginForm";

export default function LoginPage() {
  return (
    <Layout showSearch={true}>
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center">
        <LoginForm />
      </div>
    </Layout>
  );
}