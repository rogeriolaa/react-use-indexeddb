import { useState } from "react";
import { useIndexedDB } from "../../src/useIndexedDB";
import "./App.css";
import { TodoModal } from "./components/TodoModal";

interface Todo {
  id: string;
  text: string;
  description: string;
  completed: boolean;
}

function App() {
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const {
    add,
    put,
    remove,
    get,
    error,
    isReady,
    data: todos,
  } = useIndexedDB<Todo>({
    dbName: "TodoApp",
    version: 1,
    storeName: "todos",
  });

  const handleAddOrEditTodo = async (todo: Todo) => {
    try {
      if (selectedTodo) {
        await put(todo);
      } else {
        await add(todo);
      }
      setSelectedTodo(null);
    } catch (err) {
      console.error("Failed to save todo:", err);
    }
  };

  const handleToggleTodo = async (todo: Todo) => {
    try {
      await put({ ...todo, completed: !todo.completed });
    } catch (err) {
      console.error("Failed to update todo:", err);
    }
  };

  const handleDeleteTodo = async (id: string) => {
    try {
      await remove(id);
    } catch (err) {
      console.error("Failed to delete todo:", err);
    }
  };

  const handleViewDetails = async (id: string) => {
    try {
      const todo = await get(id);
      if (todo) {
        setSelectedTodo(todo);
        setIsModalOpen(true);
      }
    } catch (err) {
      console.error("Failed to get todo details:", err);
    }
  };

  const openNewTodoModal = () => {
    setSelectedTodo(null);
    setIsModalOpen(true);
  };

  if (!isReady) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div className="container">
      <h1>Todo List with IndexedDB</h1>

      <button onClick={openNewTodoModal} className="add-button primary">
        Add New Todo
      </button>

      <ul className="todo-list">
        {todos.map((todo) => (
          <li key={todo.id} className="todo-item">
            <div className="todo-content">
              <label className="todo-label">
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => handleToggleTodo(todo)}
                />
                <span className={todo.completed ? "completed" : ""}>
                  {todo.text}
                </span>
              </label>
              {todo.description && (
                <p className="todo-description">{todo.description}</p>
              )}
            </div>
            <div className="todo-actions">
              <button
                onClick={() => handleViewDetails(todo.id)}
                className="edit-button"
              >
                Edit
              </button>
              <button
                onClick={() => handleDeleteTodo(todo.id)}
                className="delete-button"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>

      <TodoModal
        todo={selectedTodo}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleAddOrEditTodo}
      />
    </div>
  );
}

export default App;
