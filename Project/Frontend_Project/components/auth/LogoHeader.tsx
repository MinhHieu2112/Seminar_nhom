export function LogoHeader() {
  return (
    <div className="text-center space-y-3">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 shadow-xl shadow-purple-200">
        <span className="text-3xl font-bold text-white">C</span>
      </div>
      <div className="space-y-1">
        <div className="text-3xl font-bold">
          <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Codex
          </span>
        </div>
        <p className="text-gray-500 text-sm font-medium">
          Master programming with AI-powered learning
        </p>
      </div>
    </div>
  );
}
