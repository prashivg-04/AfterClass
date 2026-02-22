export default function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">AfterClass</h1>
          <p className="text-gray-600">{subtitle || "Continue your learning workflow"}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          {title && (
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">{title}</h2>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}
