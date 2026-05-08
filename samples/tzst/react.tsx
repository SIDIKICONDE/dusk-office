/**
 * Advanced React: Suspense, Context, custom hooks, compound components.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ComponentProps,
  type FC,
  type ReactNode,
  type RefObject,
} from "react";

// Compound component pattern
type TabsContextValue = {
  activeId: string;
  setActiveId: (id: string) => void;
};

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabs() {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error("useTabs must be used within <Tabs>");
  return ctx;
}

type TabsProps = { children: ReactNode; defaultTab?: string };

export const Tabs = ({ children, defaultTab }: TabsProps) => {
  const [activeId, setActiveId] = useState(defaultTab ?? "");
  const value = useMemo(() => ({ activeId, setActiveId }), [activeId]);
  return <TabsContext.Provider value={value}>{children}</TabsContext.Provider>;
};

type TabProps = { id: string; children: ReactNode };

export const Tab = ({ id, children }: TabProps) => {
  const { activeId, setActiveId } = useTabs();
  const isActive = activeId === id;
  return (
    <button
      role="tab"
      aria-selected={isActive}
      onClick={() => setActiveId(id)}
      className={isActive ? "active" : ""}
    >
      {children}
    </button>
  );
};

type TabPanelProps = { id: string; children: ReactNode };

export const TabPanel = ({ id, children }: TabPanelProps) => {
  const { activeId } = useTabs();
  if (activeId !== id) return null;
  return (
    <div role="tabpanel" aria-labelledby={id}>
      {children}
    </div>
  );
};

// Custom hook with cleanup
function useAsync<T>(fn: () => Promise<T>, deps: unknown[]) {
  const [state, setState] = useState<{
    loading: boolean;
    data?: T;
    error?: Error;
  }>({ loading: true });

  useEffect(() => {
    let cancelled = false;
    fn()
      .then((data) => !cancelled && setState({ loading: false, data }))
      .catch((error) => !cancelled && setState({ loading: false, error }));
    return () => {
      cancelled = true;
    };
  }, deps);

  return state;
}

// Reducer pattern
type Action =
  | { type: "increment" }
  | { type: "decrement" }
  | { type: "reset"; payload: number };

function counterReducer(state: number, action: Action): number {
  switch (action.type) {
    case "increment":
      return state + 1;
    case "decrement":
      return state - 1;
    case "reset":
      return action.payload;
  }
}

// Imperative handle
type InputHandle = { focus: () => void; clear: () => void };

type FancyInputProps = ComponentProps<"input"> & {
  ref: RefObject<InputHandle | null>;
};

const FancyInput = ({ ref, ...props }: FancyInputProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle<InputHandle | null, InputHandle>(ref, () => ({
    focus: () => {
      inputRef.current?.focus();
    },
    clear: () => {
      if (inputRef.current) inputRef.current.value = "";
    },
  }));

  return <input ref={inputRef} {...props} />;
};

// Memoized component with stable identity
type UserCardProps = {
  user: { id: number; name: string; avatar?: string };
  onSelect?: (id: number) => void;
};

export const UserCard: FC<UserCardProps> = ({ user, onSelect }) => {
  const id = useId();
  const handleClick = useCallback(() => onSelect?.(user.id), [user.id, onSelect]);

  return (
    <article id={id} className="user-card" onClick={handleClick}>
      <img src={user.avatar} alt={user.name} loading="lazy" />
      <h3>{user.name}</h3>
    </article>
  );
};

export { useAsync };
