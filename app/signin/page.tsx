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
export default async function Page({ searchParams: sp }: { searchParams?: any }) {
  // Resolve Next's Promise-wrapped searchParams if present
  const searchParams = typeof sp?.then === 'function' ? await sp : (sp ?? {})

  const callbackUrl = typeof searchParams?.callbackUrl === 'string' ? searchParams.callbackUrl : undefined
  const error = typeof searchParams?.error === 'string' ? searchParams.error : undefined

  return (
    <>
      <SignInContent
        initialSearchParams={{ callbackUrl, error }}
        initialPathname="/signin"
      />
    </>
  )
}