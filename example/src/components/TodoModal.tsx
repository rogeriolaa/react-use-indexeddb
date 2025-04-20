import { Dialog } from "@headlessui/react";
import { useEffect, useState } from "react";

interface Todo {
  id: string;
  text: string;
  description: string;
  completed: boolean;
}

interface TodoModalProps {
  todo: Todo | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (todo: Todo) => void;
}

export function TodoModal({ todo, isOpen, onClose, onSave }: TodoModalProps) {
  const [text, setText] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    setText(todo?.text || "");
    setDescription(todo?.description || "");
  }, [todo, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    onSave({
      id: todo?.id || Date.now().toString(),
      text: text.trim(),
      description: description.trim(),
      completed: todo?.completed || false,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="modal-overlay">
      <div className="modal-backdrop" aria-hidden="true" />
      <Dialog.Panel className="modal-content">
        <Dialog.Title>{todo ? "Edit Todo" : "New Todo"}</Dialog.Title>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="text">Title</label>
            <input
              type="text"
              id="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Todo title"
              className="modal-input"
            />
          </div>
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Todo description"
              className="modal-textarea"
            />
          </div>
          <div className="modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="modal-button cancel"
            >
              Cancel
            </button>
            <button type="submit" className="modal-button save">
              Save
            </button>
          </div>
        </form>
      </Dialog.Panel>
    </Dialog>
  );
}
