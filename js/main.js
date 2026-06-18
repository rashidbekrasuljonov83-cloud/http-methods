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

const API_URL = "https://biyovo1194.pythonanywhere.com/api/v1/tasks/";

let todos = [];
let currentFilter = "all";
let editId = null;

function getTodoFields(todo) {
  if (!todo)
    return {
      id: "",
      title: "Nomsiz vazifa",
      description: "",
      completed: false,
      date: "—",
    };

  const innerData = todo.data ? todo.data : todo;

  const id =
    innerData.id !== undefined && innerData.id !== null
      ? Number(innerData.id)
      : innerData.pk !== undefined
        ? Number(innerData.pk)
        : "";
  const title =
    innerData.title || innerData.name || innerData.task_name || "Nomsiz vazifa";
  const description = innerData.description || innerData.desc || "";
  const completed =
    innerData.completed === true || innerData.completed === "true";

  const dateValue =
    innerData.created || innerData.created_at || new Date().toISOString();
  const displayDate = dateValue.substring(0, 10);

  return { id, title, description, completed, date: displayDate };
}

async function fetchTodos() {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error("Yuklashda xatolik");
    let resData = await response.json();

    let rawList = [];
    if (resData && resData.data && Array.isArray(resData.data.results)) {
      rawList = resData.data.results;
    } else if (resData && Array.isArray(resData.results)) {
      rawList = resData.results;
    } else if (resData && resData.data && Array.isArray(resData.data)) {
      rawList = resData.data;
    } else if (Array.isArray(resData)) {
      rawList = resData;
    }

    todos = rawList;
    updateInterface();
  } catch (error) {
    console.error("Yuklashda xato:", error);
  }
}

function updateInterface() {
  const total = todos.length;
  const done = todos.filter((t) => getTodoFields(t).completed).length;
  const active = total - done;

  if (statCount) statCount.textContent = total;
  if (statDone) statDone.textContent = done;
  if (statActive) statActive.textContent = active;

  const filteredTodos = todos.filter((todo) => {
    const fields = getTodoFields(todo);
    if (currentFilter === "active") return !fields.completed;
    if (currentFilter === "completed") return fields.completed;
    return true;
  });

  if (filteredTodos.length === 0) {
    todoListContainer.innerHTML = "";
    if (emptyState) emptyState.removeAttribute("hidden");
  } else {
    if (emptyState) emptyState.setAttribute("hidden", "");
    renderTodos(filteredTodos);
  }
}

function renderTodos(todoItems) {
  todoListContainer.innerHTML = "";

  todoItems.forEach((todo) => {
    const fields = getTodoFields(todo);

    if (fields.id === "") return;

    const li = document.createElement("li");
    li.className = `todo-item ${fields.completed ? "is-done" : ""}`;
    li.setAttribute("data-id", fields.id);

    li.innerHTML = `
      <button class="check ${fields.completed ? "is-checked" : ""}" type="button" aria-label="Toggle status" data-action="toggle">
        <span class="check-icon" aria-hidden="true">${fields.completed ? "✓" : ""}</span>
      </button>

      <div class="todo-content">
        <div class="todo-top">
          <h3 class="todo-title">${fields.title}</h3>
          <span class="badge ${fields.completed ? "badge-done" : "badge-active"}">
            ${fields.completed ? "Completed" : "Active"}
          </span>
        </div>
        <p class="todo-desc">${fields.description}</p>

        <div class="meta">
          <span class="meta-item">
            <span class="meta-label">ID:</span>
            <span class="meta-value">${fields.id}</span>
          </span>
          <span class="meta-item">
            <span class="meta-label">Created:</span>
            <span class="meta-value">${fields.date}</span>
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
  if (!title) return alert("Iltimos, nom kiriting!");

  if (editId !== null) {
    try {
      const currentTodo = todos.find(
        (t) => Number(getTodoFields(t).id) === Number(editId),
      );
      const isDone = currentTodo ? getTodoFields(currentTodo).completed : false;
      const payload = {
        title: title,
        description: description,
        completed: isDone,
      };

      const response = await fetch(`${API_URL}${editId}/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        editId = null;
        submitBtn.textContent = "Add";
        createForm.reset();
        await fetchTodos();
      } else {
        alert("Server tahrirlashni rad etdi.");
      }
    } catch (error) {
      console.error("Tahrirlashda xato:", error);
    }
  } else {
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: { title, description, completed: false },
        }),
      });

      if (response.ok) {
        createForm.reset();
        await fetchTodos();
      } else {
        alert("Serverga qo'shib bo'lmadi.");
      }
    } catch (error) {
      console.error("Qo'shishda xato:", error);
    }
  }
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
  const rawId = todoItem.getAttribute("data-id");
  const action = actionButton.getAttribute("data-action");

  if (!rawId) return alert("Ushbu element ID raqamiga ega emas!");

  const targetId = Number(rawId);

  if (action === "delete") {
    if (!confirm("Haqiqatdan ham o'chirmoqchimisiz?")) return;
    try {
      const response = await fetch(`${API_URL}${targetId}/`, {
        method: "DELETE",
      });

      if (response.ok || response.status === 204) {
        todos = todos.filter(
          (todo) => Number(getTodoFields(todo).id) !== targetId,
        );
        if (Number(editId) === targetId) createForm.reset();
        updateInterface();
      } else {
        alert(`O'chirib bo'lmadi.`);
      }
    } catch (error) {
      console.error("O'chirishda xato:", error);
    }
  } else if (action === "toggle") {
    const todoToToggle = todos.find(
      (todo) => Number(getTodoFields(todo).id) === targetId,
    );
    if (!todoToToggle) return;
    const fields = getTodoFields(todoToToggle);

    try {
      const payload = {
        title: fields.title,
        description: fields.description,
        completed: !fields.completed,
      };

      const response = await fetch(`${API_URL}${targetId}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        await fetchTodos();
      } else {
        alert("Statusni o'zgartirib bo'lmadi.");
      }
    } catch (error) {
      console.error("Statusda xato:", error);
    }
  } else if (action === "edit") {
    const todoToEdit = todos.find(
      (todo) => Number(getTodoFields(todo).id) === targetId,
    );
    if (todoToEdit) {
      const fields = getTodoFields(todoToEdit);
      titleInput.value = fields.title;
      descInput.value = fields.description;
      editId = targetId;
      submitBtn.textContent = "Save";
      titleInput.focus();
    }
  }
});

if (filterButtons) {
  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterButtons.forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      currentFilter = btn.getAttribute("data-filter");
      updateInterface();
    });
  });
}

fetchTodos();
