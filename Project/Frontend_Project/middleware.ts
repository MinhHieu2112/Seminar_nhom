import { type NextRequest, NextResponse } from 'next/server'

// Routes that require authentication
const protectedRoutes = ['/dashboard', '/courses', '/practice', '/projects', '/forum', '/learning-path', '/profile']

// Admin routes
const adminRoutes = ['/admin']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route))

  if (isProtectedRoute || isAdminRoute) {
    // Get auth token from cookies
    const token = request.cookies.get('sb-auth-token')?.value

    if (!token) {
      // Redirect to sign-in
      const url = request.nextUrl.clone()
      url.pathname = '/auth/sign-in'
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}
