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

const API_URL = "https://biyovo1194.pythonanywhere.com/api/v1/todos";

let todos = [];
let currentFilter = "all";
let editId = null;

function loadLocalTodos() {
  const localData = localStorage.getItem("local_todos");
  if (localData) {
    todos = JSON.parse(localData);
  } else {
    todos = [
      {
        id: 1,
        title: "Express bilan TODO API yozish",
        description: "CRUD endpointlar...",
        completed: false,
        created: "2026-05-14",
      },
      {
        id: 2,
        title: "Swagger response formatni tushunish",
        description: "API response...",
        completed: true,
        created: "2026-05-13",
      },
    ];
  }
  updateInterface();
}

function saveLocalTodos() {
  localStorage.setItem("local_todos", JSON.stringify(todos));
}

async function fetchTodos() {
  try {
    const response = await fetch(API_URL).catch(() => null);
    if (!response || !response.ok) {
      loadLocalTodos();
      return;
    }

    const data = await response.json();
    if (Array.isArray(data)) {
      todos = data;
    } else if (data && Array.isArray(data.results)) {
      todos = data.results;
    }

    saveLocalTodos();
    updateInterface();
  } catch (error) {
    loadLocalTodos();
  }
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

    const displayDate = (
      todo.created ||
      todo.created_at ||
      new Date().toISOString()
    ).substring(0, 10);

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
        <p class="todo-desc">${todo.description || ""}</p>

        <div class="meta">
          <span class="meta-item">
            <span class="meta-label">ID:</span>
            <span class="meta-value">${todo.id}</span>
          </span>
          <span class="meta-item">
            <span class="meta-label">Created:</span>
            <span class="meta-value">${displayDate}</span>
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

createForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const title = titleInput.value.trim();
  const description = descInput.value.trim();

  if (!title) return alert("Iltimos, title kiriting!");

  if (editId !== null) {
    const currentTodo = todos.find((t) => t.id === editId);
    const payload = {
      title,
      description,
      completed: currentTodo ? currentTodo.completed : false,
    };

    todos = todos.map((todo) =>
      todo.id === editId ? { ...todo, ...payload } : todo,
    );

    await fetch(`${API_URL}/${editId}/`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => null);

    editId = null;
    submitBtn.textContent = "Add";
  } else {
    const nextId =
      todos.length > 0 ? Math.max(...todos.map((t) => t.id)) + 1 : 1;
    const payload = {
      id: nextId,
      title,
      description,
      completed: false,
      created: new Date().toISOString().substring(0, 10),
    };

    todos.push(payload);

    await fetch(`${API_URL}/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, completed: false }),
    })
      .then((res) => res.json())
      .then((newServerTodo) => {
        if (newServerTodo && newServerTodo.id) {
          payload.id = newServerTodo.id;
        }
      })
      .catch(() => null);
  }

  saveLocalTodos();
  createForm.reset();
  updateInterface();
});

createForm.addEventListener("reset", () => {
  editId = null;
  submitBtn.textContent = "Add";
});

todoListContainer.addEventListener("click", async (e) => {
  const target = e.target;
  const actionButton = target.closest("[data-action]");
  if (!actionButton) return;

  const todoItem = target.closest(".todo-item");
  const id = parseInt(todoItem.getAttribute("data-id"));
  const action = actionButton.getAttribute("data-action");

  if (action === "delete") {
    if (!confirm("Haqiqatdan ham o'chirmoqchimisiz?")) return;
    todos = todos.filter((todo) => todo.id !== id);
    if (editId === id) createForm.reset();

    await fetch(`${API_URL}/${id}/`, { method: "DELETE" }).catch(() => null);

    saveLocalTodos();
    updateInterface();
  } else if (action === "toggle") {
    const todoToToggle = todos.find((todo) => todo.id === id);
    if (!todoToToggle) return;

    todoToToggle.completed = !todoToToggle.completed;

    await fetch(`${API_URL}/${id}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: todoToToggle.completed }),
    }).catch(() => null);

    saveLocalTodos();
    updateInterface();
  } else if (action === "edit") {
    const todoToEdit = todos.find((todo) => todo.id === id);
    if (todoToEdit) {
      titleInput.value = todoToEdit.title;
      descInput.value = todoToEdit.description || "";
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

fetchTodos();
