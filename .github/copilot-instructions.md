# GitHub Copilot Instructions

This document provides guidelines for GitHub Copilot when working on the Aspects VTT project.

## Project Overview

Aspects VTT is a virtual tabletop application built with:

- **Frontend**: React 19 with TypeScript
- **Backend**: Convex (real-time database with auth)
- **UI Library**: Ariakit for accessibility
- **Routing**: Wouter
- **Styling**: Tailwind CSS
- **Icons**: Iconify (mingcute icon set)
- **Build Tool**: Vite
- **Package Manager**: Bun

## Code Quality Standards

### React Patterns

#### State Management

- **Avoid useEffect for state synchronization** - This is an anti-pattern that can break in some instances
- **Prefer mutations that return updated data** - Update backend mutations to return the new details, then set those details in state on the frontend
- **Use conditional rendering over state sync** - Move content into child components and only conditionally render when data is available

```tsx
// ❌ Avoid this pattern
useEffect(() => {
	if (updatedUser) {
		setName(updatedUser.name)
		setEmail(updatedUser.email)
	}
}, [updatedUser])

// ✅ Prefer this pattern
const updatedUser = await updateProfile(updates)
if (updatedUser) {
	setName(updatedUser.name ?? "")
	setEmail(updatedUser.email ?? "")
}

// ✅ Or even better - conditional rendering
function ParentComponent() {
	const user = useQuery(api.auth.me)

	if (!user) return <LoadingScreen />

	return <ChildComponent user={user} />
}
```

#### Loading States

- **Handle three authentication states explicitly**:
  - `user === undefined` (loading) - Show loading indicator
  - `user === null` (unauthenticated) - Show sign-in prompt
  - `user` has data (authenticated) - Show content
- **Use existing `LoadingScreen` component** for consistency
- **Prevent flash of unauthenticated state** with proper loading indicators

```tsx
if (user === undefined) {
	return <LoadingScreen className="min-h-screen" />
}

if (user === null) {
	return <div>Please sign in...</div>
}

return <AuthenticatedContent user={user} />
```

### Component Architecture

#### Prop Management

- **Lift state strategically** to minimize prop drilling while keeping components focused
- **Use callback patterns** to handle complex operations at the appropriate level
- **Pass simple callbacks down** rather than complex state objects when possible

```tsx
// ✅ Good - lift logic to appropriate level to avoid deep prop drilling
function ParentComponent() {
	const mutation = useMutation(api.action)
	const [state, setState] = useState()

	return (
		<ChildComponent
			onAction={async (id) => {
				const result = await mutation({ id, ...state })
				handleResult(result)
			}}
		/>
	)
}

// ❌ Avoid - excessive prop drilling
function ChildComponent({ mutation, state, handleResult }) {
	// Props drilled through multiple levels unnecessarily
}
```

#### Media Queries

- **Use modern media query syntax** with logical operators
- **Prefer semantic breakpoint names** that describe the viewport size

```tsx
// ✅ Modern syntax - uses logical operators
const isLargeViewport = useMediaQuery("(width > 1280px)")
const isMediumViewport = useMediaQuery("(width < 960px)")

// ❌ Avoid - older syntax
const isLargeViewport = useMediaQuery("(min-width: 1280px)")
```

#### File Upload Buttons

- **Use render prop for file uploads in labels**:

```tsx
<label className="cursor-pointer">
	<Button render={<span />} icon={<Icon icon="mingcute:upload-2-fill" />}>
		Upload File
	</Button>
	<input type="file" className="hidden" onChange={handleChange} />
</label>
```

#### Form Actions

- **Use useActionState for form handling** with proper error states
- **Return meaningful error messages** from action functions
- **Show pending states** using the `pending` prop on buttons
- **Prefer useActionState over useState for error handling** - Return errors from action callbacks instead of separate error state
- **Group simple state declarations together** - Keep 1-3 line useState declarations at the top, before complex useActionState calls

```tsx
// ✅ Group simple state together
const [name, setName] = useState("")
const [email, setEmail] = useState("")
const [imageToCrop, setImageToCrop] = useState<string | null>(null)

// ✅ Use useActionState for error handling instead of separate useState
const [error, formAction, isPending] = useActionState(async () => {
	try {
		// Form logic
	} catch (err) {
		return err instanceof Error ? err.message : "An error occurred"
	}
}, null)

// ❌ Avoid separate error state when useActionState can handle it
const [error, setError] = useState<string | null>(null)
const [isPending, startTransition] = useTransition()
```

### Backend Patterns

#### Mutations

- **Return updated data from mutations** to enable proper state management on frontend
- **Use proper TypeScript types** for mutation parameters and return values

```tsx
// In convex/users.ts
export const updateProfile = mutation({
	args: { name: v.optional(v.string()), email: v.optional(v.string()) },
	handler: async (ctx, args) => {
		// Update logic
		return await ctx.db.get(userId) // Return updated user
	},
})
```

#### Authentication

- **Use Convex Auth providers** for OAuth integration
- **Configure providers in convex/auth.ts** following established patterns
- **Handle auth states consistently** across components

## UI/UX Guidelines

### Design System

- **Use existing UI components** from `src/components/ui/`
- **Follow Ariakit patterns** for accessibility
- **Use consistent styling** with Tailwind CSS classes
- **Maintain dark theme** throughout the application

### Icons

- **Use mingcute icon set** exclusively: `mingcute:icon-name`
- **Common icons**:
  - Loading: `mingcute:loading-3-fill` with `animate-spin`
  - Upload: `mingcute:upload-2-fill`
  - Delete: `mingcute:delete-2-fill`
  - Check: `mingcute:check-fill`
  - Arrow: `mingcute:arrow-left-fill`
  - User: `mingcute:user-4-line`

### Button Components

- **Use `pending` prop** for loading states
- **Use `appearance` prop** for variants (solid, ghost, etc.)
- **Use `icon` prop** for button icons
- **Use `render` prop** when button needs custom rendering (e.g., in labels)

```tsx
<Button
	type="submit"
	icon={<Icon icon="mingcute:check-fill" />}
	pending={isSaving}
	disabled={!hasChanges}
>
	{isSaving ? "Saving..." : "Save Changes"}
</Button>
```

### Native Form Controls

- **Use `accent-primary-500` class** for native controls to match design system
- **Apply to all interactive controls**: `<input type="range">`, `<input type="checkbox">`, `<input type="radio">`
- **Maintains consistency** with the primary color theme across all form elements

## File Organization

### Structure

- **Components**: `src/components/` - Reusable UI components
- **UI Components**: `src/components/ui/` - Design system components
- **Hooks**: `src/hooks/` - Custom React hooks
- **Data**: `src/data/` - Static data files
- **Convex**: `convex/` - Backend functions and schema
- **Types**: Use TypeScript throughout, define types in relevant files

### Naming Conventions

- **Components**: PascalCase (e.g., `AccountSettings.tsx`)
- **Hooks**: camelCase starting with "use" (e.g., `useFileUpload.ts`)
- **Files**: PascalCase for components, camelCase for utilities
- **Functions**: camelCase for regular functions, PascalCase for components

## Testing and Validation

### Error Handling

- **Provide meaningful error messages** to users
- **Handle edge cases** in forms and file uploads
- **Validate inputs** both client and server-side
- **Show errors in UI** with consistent styling (`text-red-400`)

### Accessibility

- **Use Ariakit components** for built-in accessibility
- **Provide proper labels** for form inputs
- **Use semantic HTML** elements
- **Maintain keyboard navigation** support

## Development Workflow

### Code Style

- **Use TypeScript strict mode**
- **Follow ESLint configuration**
- **Use Prettier for formatting**
- **Write self-documenting code** with clear variable names
- **Use descriptive event parameter names**: Always use `event` instead of `e` for event handlers
- **Avoid redundant comments**: Don't add comments that simply restate what the code does
- **Prefer AbortController for DOM event listeners**: Use `signal` option to inline event handlers and simplify cleanup

```tsx
// ✅ Good - descriptive parameter name
const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
	setValue(event.target.value)
}

// ❌ Avoid - single letter parameter
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
	setValue(e.target.value)
}

// ✅ Good - AbortController with inline event handler
useEffect(() => {
	const abortController = new AbortController()

	mediaQuery.addEventListener(
		"change",
		(event) => {
			setMatches(event.matches)
		},
		{ signal: abortController.signal },
	)

	return () => abortController.abort()
}, [])

// ❌ Avoid - separate function and manual removeEventListener
useEffect(() => {
	const handleChange = (event: MediaQueryListEvent) => {
		setMatches(event.matches)
	}

	mediaQuery.addEventListener("change", handleChange)
	return () => mediaQuery.removeEventListener("change", handleChange)
}, [])

// ✅ Good - clear code without redundant comments
mediaQuery.addEventListener("change", handleChange)

// ❌ Avoid - redundant comments
// Add listener
mediaQuery.addEventListener("change", handleChange)
```

## Common Patterns

### OAuth Integration

- **Configure OAuth providers** in convex/auth.ts with custom profile mapping
- **Preserve existing user data** when linking OAuth accounts - only fill in missing fields
- **Use createOrUpdateUser callback** to handle account linking logic
- **Check existing users by email** before creating new accounts

### File Upload with Storage

```tsx
const uploadFile = useFileUpload()
const storageId = await uploadFile(file)
await updateAvatar({ storageId })
```

### Route Definition

```tsx
// In src/Root.tsx
<Route path="/account/settings">
	<AccountSettings />
</Route>
```

### Menu Integration

```tsx
<Ariakit.MenuItem render={<Link to="/account/settings" />}>
	<Icon icon="mingcute:settings-2-line" />
	Account Settings
</Ariakit.MenuItem>
```

## Performance Considerations

- **Use React 19 features** like useActionState appropriately
- **Minimize re-renders** with proper component structure
- **Lazy load components** when appropriate
- **Optimize images** and file uploads

## Security Best Practices

- **Validate all inputs** on both client and server
- **Use proper authentication** checks in Convex functions
- **Handle file uploads** securely with type validation
- **Don't expose sensitive data** in client-side code
- **Use HTTPS** for all external requests
