// Top-level server component exports and page wrapper
import SignInContent from './SignInContent'

export const metadata = {
  // Remove themeColor from here
}

// Move themeColor to viewport for App Router
export const viewport = {
  themeColor: '#0ea5e9'
}

// Default server component page rendering client content
export default function Page() {
  return (
    <>
      <SignInContent />
    </>
  )
}
