# @n0n3br/react-use-indexeddb

A React hook for easy IndexedDB integration. This hook simplifies working with IndexedDB in React applications by providing a clean and intuitive API.

## Installation

```bash
npm install @n0n3br/react-use-indexeddb
```

## Usage

```typescript
import { useIndexedDB } from '@n0n3br/react-use-indexeddb';

interface Todo {
  id: string;
  title: string;
  completed: boolean;
}

function TodoList() {
  const {
    add,
    get,
    getAll,
    put,
    remove,
    clear,
    error,
    isReady,
    data
  } = useIndexedDB<Todo>({
    dbName: 'TodoDB',
    version: 1,
    storeName: 'todos'
  });

  // Add a todo
  const handleAdd = async (todo: Todo) => {
    await add(todo);
  };

  // Get a specific todo
  const handleGet = async (id: string) => {
    const todo = await get(id);
  };

  // Get all todos
  const handleGetAll = async () => {
    const todos = await getAll();
  };

  // Update a todo
  const handleUpdate = async (todo: Todo) => {
    await put(todo);
  };

  // Remove a todo
  const handleRemove = async (id: string) => {
    await remove(id);
  };

  // Clear all todos
  const handleClear = async () => {
    await clear();
  };

  if (!isReady) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div>
      {data.map(todo => (
        <div key={todo.id}>{todo.title}</div>
      ))}
    </div>
  );
}
```

## API

### Configuration

The hook accepts a configuration object with the following properties:

- `dbName` (string): The name of the IndexedDB database
- `version` (number): The version of the database
- `storeName` (string): The name of the object store

### Return Value

The hook returns an object with the following properties:

- `add(item: T)`: Adds a new item to the store
- `get(id: string | number)`: Retrieves an item by ID
- `getAll()`: Retrieves all items from the store
- `put(item: T)`: Updates an existing item or adds it if it doesn't exist
- `remove(id: string | number)`: Removes an item by ID
- `clear()`: Removes all items from the store
- `error`: Any error that occurred during database operations
- `isReady`: Whether the database is ready for operations
- `data`: Array of all items in the store

### Types

Items must have an `id` property of type `string` or `number`:

```typescript
interface Item {
  id: string | number;
  // ... other properties
}
```

## License

MIT © Rogério Amorim
