# Zustand Stores

This directory contains all Zustand stores for state management in the admin application.

## Architecture

We use Zustand for state management following these principles:

### Store Organization

- **useThemeStore**: Theme management (light/dark mode)
- **useAuthStore**: Authentication state (user, token)
- **useSidebarStore**: Sidebar UI state
- **useNotificationStore**: Toast/notification system
- **useModalStore**: Modal state management
- **useLoadingStore**: Global loading indicators

### Best Practices

1. **Atomic Stores**: Each store handles a specific domain
2. **Persistence**: Critical data (auth, theme) uses `persist` middleware
3. **Devtools**: UI stores use `devtools` middleware for debugging
4. **Selectors**: Export selectors for optimized re-renders
5. **Type Safety**: Full TypeScript support with interfaces

## Usage Examples

### Theme Store

```tsx
import { useThemeStore } from "@/stores";

function MyComponent() {
  // Get only what you need for optimal re-renders
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);

  return <button onClick={toggleTheme}>Current theme: {theme}</button>;
}
```

### Auth Store

```tsx
import { useAuthStore, selectIsAuthenticated } from "@/stores";

function ProtectedComponent() {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  if (!isAuthenticated) return <Navigate to="/login" />;

  return <div>Welcome, {user?.username}!</div>;
}
```

### Notification Store

```tsx
import { useNotificationStore } from "@/stores";

function MyForm() {
  const addNotification = useNotificationStore(
    (state) => state.addNotification
  );

  const handleSubmit = async () => {
    try {
      await submitForm();
      addNotification({
        type: "success",
        title: "Success",
        message: "Form submitted successfully",
        duration: 3000,
      });
    } catch (error) {
      addNotification({
        type: "error",
        title: "Error",
        message: "Failed to submit form",
      });
    }
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

### Modal Store

```tsx
import { useModalStore } from "@/stores";

function MyComponent() {
  const openModal = useModalStore((state) => state.openModal);

  return (
    <button onClick={() => openModal("confirmDelete", { id: 123 })}>
      Delete
    </button>
  );
}

// In your modal component
function ModalManager() {
  const { isOpen, modalType, modalData } = useModalStore(selectModalState);
  const closeModal = useModalStore((state) => state.closeModal);

  if (!isOpen) return null;

  if (modalType === "confirmDelete") {
    return <ConfirmDeleteModal data={modalData} onClose={closeModal} />;
  }

  return null;
}
```

### Loading Store

```tsx
import { useLoadingStore, selectIsLoading } from "@/stores";

function MyComponent() {
  const isLoading = useLoadingStore(selectIsLoading);
  const startLoading = useLoadingStore((state) => state.startLoading);
  const stopLoading = useLoadingStore((state) => state.stopLoading);

  const fetchData = async () => {
    const taskId = "fetchUsers";
    startLoading(taskId, "Loading users...");

    try {
      await api.getUsers();
    } finally {
      stopLoading(taskId);
    }
  };

  return isLoading ? <Spinner /> : <UserList />;
}
```

## Migration from Context

The previous Context API implementations have been replaced with Zustand stores for:

- Better performance (no unnecessary re-renders)
- Simpler API (no Provider wrapping needed)
- Built-in DevTools support
- Persistence out of the box
- Better TypeScript inference

## Advanced Patterns

### Combining Multiple Stores

```tsx
function MyComponent() {
  const theme = useThemeStore((state) => state.theme);
  const user = useAuthStore((state) => state.user);

  return <div className={theme}>Welcome, {user?.username}</div>;
}
```

### Using Selectors for Performance

```tsx
// Good - only re-renders when user.email changes
const email = useAuthStore((state) => state.user?.email);

// Better - using exported selector
import { selectUser } from "@/stores";
const user = useAuthStore(selectUser);
```

### Actions Outside Components

```tsx
import { useAuthStore } from "@/stores";

// You can call store actions outside of React components
export const handleApiError = (error: Error) => {
  if (error.message.includes("unauthorized")) {
    useAuthStore.getState().clearAuth();
    window.location.href = "/login";
  }
};
```

## Testing

```tsx
import { useAuthStore } from "@/stores";

// Reset store before each test
beforeEach(() => {
  useAuthStore.setState({
    token: null,
    user: null,
    isAuthenticated: false,
  });
});

// Test store actions
it("should authenticate user", () => {
  const { setAuth } = useAuthStore.getState();

  setAuth("token123", { id: "1", email: "test@example.com" });

  expect(useAuthStore.getState().isAuthenticated).toBe(true);
});
```
