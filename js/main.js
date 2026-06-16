const createForm = document.querySelector('[data-form="create"]');
const titleInput = document.getElementById("todoTitle");
const descInput = document.getElementById("todoDesc");
const submitBtn = document.getElementById("addTodo");
const todoListContainer = document.querySelector('[data-list="todos"]');
const emptyState = document.querySelector('[data-state="empty"]');

const statCount = document.querySelector('[data-stat="count"]');
const statDone = document.querySelector('[data-stat="done"]');
const statActive = document.querySelector('[data-stat="active"]');
const filterButtons = document.querySelectorAll("[data-filter]");

let todos = [
  {
    id: 1,
    title: "Express bilan TODO API yozish",
    description:
      "CRUD endpointlar: GET (pagination), POST, PATCH, DELETE. UI’dan ishlatib ko‘rish.",
    completed: false,
    created: "2026-05-14",
  },
  {
    id: 2,
    title: "Swagger response formatni tushunish",
    description: "API response: count, next, previous, results bilan keladi.",
    completed: true,
    created: "2026-05-13",
  },
];

let currentFilter = "all";
let editId = null;

function getTodayDate() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function updateInterface() {
  const total = todos.length;
  const done = todos.filter((t) => t.completed).length;
  const active = total - done;

  statCount.textContent = total;
  statDone.textContent = done;
  statActive.textContent = active;

  const filteredTodos = todos.filter((todo) => {
    if (currentFilter === "active") return !todo.completed;
    if (currentFilter === "completed") return todo.completed;
    return true;
  });

  if (filteredTodos.length === 0) {
    todoListContainer.innerHTML = "";
    emptyState.removeAttribute("hidden");
  } else {
    emptyState.setAttribute("hidden", "");
    renderTodos(filteredTodos);
  }
}

function renderTodos(todoItems) {
  todoListContainer.innerHTML = "";

  todoItems.forEach((todo) => {
    const li = document.createElement("li");
    li.className = `todo-item ${todo.completed ? "is-done" : ""}`;
    li.setAttribute("data-id", todo.id);
    li.setAttribute("data-completed", todo.completed);

    li.innerHTML = `
      <button class="check ${todo.completed ? "is-checked" : ""}" type="button" aria-label="Toggle status" data-action="toggle">
        <span class="check-icon" aria-hidden="true">${todo.completed ? "✓" : ""}</span>
      </button>

      <div class="todo-content">
        <div class="todo-top">
          <h3 class="todo-title">${todo.title}</h3>
          <span class="badge ${todo.completed ? "badge-done" : "badge-active"}">
            ${todo.completed ? "Completed" : "Active"}
          </span>
        </div>
        <p class="todo-desc">${todo.description}</p>

        <div class="meta">
          <span class="meta-item">
            <span class="meta-label">ID:</span>
            <span class="meta-value">${todo.id}</span>
          </span>
          <span class="meta-item">
            <span class="meta-label">Created:</span>
            <span class="meta-value">${todo.created}</span>
          </span>
        </div>
      </div>

      <div class="todo-actions">
        <button class="icon-btn" type="button" title="Edit" data-action="edit">✎</button>
        <button class="icon-btn danger" type="button" title="Delete" data-action="delete">🗑</button>
      </div>
    `;

    todoListContainer.appendChild(li);
  });
}

createForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const title = titleInput.value.trim();
  const description = descInput.value.trim();

  if (!title) return alert("Iltimos, title kiriting!");

  if (editId !== null) {
    todos = todos.map((todo) => {
      if (todo.id === editId) {
        return { ...todo, title, description };
      }
      return todo;
    });
    editId = null;
    submitBtn.textContent = "Add";
  } else {
    const nextId =
      todos.length > 0 ? Math.max(...todos.map((t) => t.id)) + 1 : 1;

    const newTodo = {
      id: nextId,
      title,
      description,
      completed: false,
      created: getTodayDate(),
    };

    todos.push(newTodo);
  }

  createForm.reset();
  updateInterface();
});

createForm.addEventListener("reset", () => {
  editId = null;
  submitBtn.textContent = "Add";
});

todoListContainer.addEventListener("click", (e) => {
  const target = e.target;
  const actionButton = target.closest("[data-action]");
  if (!actionButton) return;

  const todoItem = target.closest(".todo-item");
  const id = parseInt(todoItem.getAttribute("data-id"));
  const action = actionButton.getAttribute("data-action");

  if (action === "delete") {
    todos = todos.filter((todo) => todo.id !== id);
    if (editId === id) {
      createForm.reset();
    }
    updateInterface();
  } else if (action === "toggle") {
    todos = todos.map((todo) => {
      if (todo.id === id) {
        return { ...todo, completed: !todo.completed };
      }
      return todo;
    });
    updateInterface();
  } else if (action === "edit") {
    const todoToEdit = todos.find((todo) => todo.id === id);
    if (todoToEdit) {
      titleInput.value = todoToEdit.title;
      descInput.value = todoToEdit.description;
      editId = id;
      submitBtn.textContent = "Save";
      titleInput.focus();
    }
  }
});

filterButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    filterButtons.forEach((b) => b.classList.remove("is-active"));
    btn.classList.add("is-active");

    currentFilter = btn.getAttribute("data-filter");
    updateInterface();
  });
});

updateInterface();
