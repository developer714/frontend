export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <h1 className="text-4xl md:text-5xl font-extrabold text-indigo-700 mb-4">AI Monitor</h1>
      <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-xl">
        Advanced AI-powered home monitoring and security system. Keep your smart home safe, secure, and always connected.
      </p>
      <a href="/dashboard" className="btn-primary text-lg px-8 py-3">Go to Dashboard</a>
      <div className="mt-12 flex flex-col md:flex-row gap-6 w-full max-w-3xl">
        <div className="card flex-1">
          <h2 className="text-xl font-semibold mb-2">Real-time Alerts</h2>
          <p className="text-gray-500">Get instant notifications for unusual activity and critical events.</p>
        </div>
        <div className="card flex-1">
          <h2 className="text-xl font-semibold mb-2">Device Management</h2>
          <p className="text-gray-500">Easily add, remove, and monitor all your smart home devices.</p>
        </div>
        <div className="card flex-1">
          <h2 className="text-xl font-semibold mb-2">Secure & Private</h2>
          <p className="text-gray-500">Your data is encrypted and your privacy is always protected.</p>
        </div>
      </div>
    </div>
  );
} 