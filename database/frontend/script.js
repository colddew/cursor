const API_URL = 'http://127.0.0.1:8000';

let todoToDelete = null;

// 获取所有待办事项
async function fetchTodos() {
    try {
        const response = await fetch(`${API_URL}/todos`);
        const todos = await response.json();
        displayTodos(todos);
    } catch (error) {
        console.error('获取待办事项失败:', error);
    }
}

// 显示待办事项
function displayTodos(todos) {
    const todoList = document.getElementById('todoList');
    todoList.innerHTML = '';
    
    todos.forEach(todo => {
        const li = document.createElement('li');
        li.innerHTML = `
            <input type="checkbox" ${todo.completed ? 'checked' : ''} 
                onclick="toggleTodo(${todo.id}, ${!todo.completed})">
            <span class="${todo.completed ? 'completed' : ''}">${todo.title}</span>
            <button onclick="confirmDelete(${todo.id}, '${todo.title}')">删除</button>
        `;
        todoList.appendChild(li);
    });
}

// 确认删除
function confirmDelete(id, title) {
    todoToDelete = id;
    const confirmMessage = document.getElementById('confirmMessage');
    confirmMessage.textContent = `确定要删除"${title}"吗？`;
    const modal = document.getElementById('confirmDialog');
    modal.style.display = 'block';
    // 使用 setTimeout 确保 display:block 生效后再添加 show 类
    setTimeout(() => modal.classList.add('show'), 10);
    document.body.style.overflow = 'hidden';
}

// 关闭确认对话框
function closeConfirmDialog() {
    const modal = document.getElementById('confirmDialog');
    modal.classList.remove('show');
    // 等待动画完成后再隐藏
    setTimeout(() => {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }, 200);
    todoToDelete = null;
}

// 执行删除操作
async function executeDelete() {
    if (todoToDelete !== null) {
        await deleteTodo(todoToDelete);
        closeConfirmDialog();
    }
}

// 添加新的待办事项
async function addTodo() {
    const input = document.getElementById('todoInput');
    const title = input.value.trim();
    
    if (!title) return;
    
    try {
        await fetch(`${API_URL}/todos`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ title, completed: false }),
        });
        
        input.value = '';
        fetchTodos();
    } catch (error) {
        console.error('添加待办事项失败:', error);
    }
}

// 切换待办事项状态
async function toggleTodo(id, completed) {
    try {
        await fetch(`${API_URL}/todos/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ completed }),
        });
        
        fetchTodos();
    } catch (error) {
        console.error('更新待办事项失败:', error);
    }
}

// 删除待办事项
async function deleteTodo(id) {
    try {
        await fetch(`${API_URL}/todos/${id}`, {
            method: 'DELETE',
        });
        
        fetchTodos();
    } catch (error) {
        console.error('删除待办事项失败:', error);
    }
}

// 监听回车键
document.getElementById('todoInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        addTodo();
    }
});

// 页面加载时获取所有待办事项
document.addEventListener('DOMContentLoaded', fetchTodos);

// 添加点击遮罩层关闭对话框
document.getElementById('confirmDialog').addEventListener('click', function(e) {
    if (e.target === this) {
        closeConfirmDialog();
    }
});

// 添加 ESC 键关闭对话框
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && document.getElementById('confirmDialog').style.display === 'block') {
        closeConfirmDialog();
    }
}); 