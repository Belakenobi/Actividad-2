class Tarea {
    constructor(nombre, estado = false, id = null) {
        this.id = id || Date.now().toString();
        this.nombre = nombre.trim();
        this.estado = estado;
        this.fechaCreacion = new Date().toISOString();
    }

    actualizarEstado(nuevoEstado) {
        this.estado = nuevoEstado;
    }

    editarNombre(nuevoNombre) {
        if (nuevoNombre && nuevoNombre.trim().length > 0) {
            this.nombre = nuevoNombre.trim();
            return true;
        }
        return false;
    }

    toggleCompletado() {
        this.estado = !this.estado;
    }

    toJSON() {
        return {
            id: this.id,
            nombre: this.nombre,
            estado: this.estado,
            fechaCreacion: this.fechaCreacion
        };
    }

    static fromJSON(data) {
        const tarea = new Tarea(data.nombre, data.estado, data.id);
        tarea.fechaCreacion = data.fechaCreacion;
        return tarea;
    }
}

class GestorDeTareas {
    constructor() {
        this.tareas = this.cargarDesdeLocalStorage();
        this.init();
    }

    init() {
        this.bindDOMEvents();
        this.renderizarTareas();
    }

    bindDOMEvents() {
        const taskInput = document.getElementById('taskInput');
        const addTaskBtn = document.getElementById('addTaskBtn');
        const errorMessage = document.getElementById('errorMessage');

        addTaskBtn.addEventListener('click', () => this.agregarTarea());
        
        taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.agregarTarea();
            }
        });

        taskInput.addEventListener('input', () => {
            this.ocultarError();
        });
    }

    validarEntrada(texto) {
        if (!texto || texto.trim().length === 0) {
            this.mostrarError('Por favor, ingresa una tarea válida');
            return false;
        }
        
        if (texto.trim().length > 100) {
            this.mostrarError('La tarea no puede exceder los 100 caracteres');
            return false;
        }

        return true;
    }

    mostrarError(mensaje) {
        const errorMessage = document.getElementById('errorMessage');
        errorMessage.textContent = mensaje;
        errorMessage.classList.add('show');
        
        setTimeout(() => {
            this.ocultarError();
        }, 5000);
    }

    ocultarError() {
        const errorMessage = document.getElementById('errorMessage');
        errorMessage.classList.remove('show');
    }

    agregarTarea() {
        const taskInput = document.getElementById('taskInput');
        const textoTarea = taskInput.value;

        if (!this.validarEntrada(textoTarea)) {
            return;
        }

        const nuevaTarea = new Tarea(textoTarea);
        this.tareas.push(nuevaTarea);
        
        this.guardarEnLocalStorage();
        this.renderizarTareas();
        
        taskInput.value = '';
        taskInput.focus();
    }

    eliminarTarea(id) {
        this.tareas = this.tareas.filter(tarea => tarea.id !== id);
        this.guardarEnLocalStorage();
        this.renderizarTareas();
    }

    toggleCompletado(id) {
        const tarea = this.tareas.find(t => t.id === id);
        if (tarea) {
            tarea.toggleCompletado();
            this.guardarEnLocalStorage();
            this.renderizarTareas();
        }
    }

    iniciarEdicion(id) {
        const taskItem = document.querySelector(`[data-task-id="${id}"]`);
        if (!taskItem) return;

        const tarea = this.tareas.find(t => t.id === id);
        if (!tarea) return;

        const taskText = taskItem.querySelector('.task-text');
        const taskActions = taskItem.querySelector('.task-actions');

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'task-text editing';
        input.value = tarea.nombre;
        input.maxLength = 100;

        const btnSave = document.createElement('button');
        btnSave.className = 'btn btn-save';
        btnSave.textContent = 'Guardar';

        const btnCancel = document.createElement('button');
        btnCancel.className = 'btn btn-cancel';
        btnCancel.textContent = 'Cancelar';

        taskText.replaceWith(input);
        taskActions.innerHTML = '';
        taskActions.appendChild(btnSave);
        taskActions.appendChild(btnCancel);

        input.focus();
        input.select();

        const guardarEdicion = () => {
            const nuevoNombre = input.value.trim();
            if (nuevoNombre && nuevoNombre.length > 0) {
                tarea.editarNombre(nuevoNombre);
                this.guardarEnLocalStorage();
                this.renderizarTareas();
            } else {
                this.mostrarError('La tarea no puede estar vacía');
                input.focus();
            }
        };

        const cancelarEdicion = () => {
            this.renderizarTareas();
        };

        btnSave.addEventListener('click', guardarEdicion);
        btnCancel.addEventListener('click', cancelarEdicion);

        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                guardarEdicion();
            } else if (e.key === 'Escape') {
                cancelarEdicion();
            }
        });

        input.addEventListener('blur', () => {
            setTimeout(guardarEdicion, 100);
        });
    }

    renderizarTareas() {
        const taskList = document.getElementById('taskList');
        const emptyState = document.getElementById('emptyState');

        if (this.tareas.length === 0) {
            taskList.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }

        taskList.style.display = 'block';
        emptyState.style.display = 'none';

        taskList.innerHTML = '';

        this.tareas.forEach(tarea => {
            const taskItem = document.createElement('li');
            taskItem.className = `task-item ${tarea.estado ? 'completed' : ''}`;
            taskItem.setAttribute('data-task-id', tarea.id);

            const taskContent = document.createElement('div');
            taskContent.className = 'task-content';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'task-checkbox';
            checkbox.checked = tarea.estado;
            checkbox.addEventListener('change', () => this.toggleCompletado(tarea.id));

            const taskText = document.createElement('span');
            taskText.className = 'task-text';
            taskText.textContent = tarea.nombre;

            const taskActions = document.createElement('div');
            taskActions.className = 'task-actions';

            const btnEdit = document.createElement('button');
            btnEdit.className = 'btn btn-edit';
            btnEdit.textContent = 'Editar';
            btnEdit.addEventListener('click', () => this.iniciarEdicion(tarea.id));

            const btnDelete = document.createElement('button');
            btnDelete.className = 'btn btn-delete';
            btnDelete.textContent = 'Eliminar';
            btnDelete.addEventListener('click', () => this.eliminarTarea(tarea.id));

            taskContent.appendChild(checkbox);
            taskContent.appendChild(taskText);

            taskActions.appendChild(btnEdit);
            taskActions.appendChild(btnDelete);

            taskItem.appendChild(taskContent);
            taskItem.appendChild(taskActions);

            taskList.appendChild(taskItem);
        });
    }

    guardarEnLocalStorage() {
        try {
            const tareasJSON = JSON.stringify(this.tareas.map(tarea => tarea.toJSON()));
            localStorage.setItem('tareas', tareasJSON);
        } catch (error) {
            console.error('Error al guardar en localStorage:', error);
        }
    }

    cargarDesdeLocalStorage() {
        try {
            const tareasJSON = localStorage.getItem('tareas');
            if (tareasJSON) {
                const tareasData = JSON.parse(tareasJSON);
                return tareasData.map(data => Tarea.fromJSON(data));
            }
            return [];
        } catch (error) {
            console.error('Error al cargar desde localStorage:', error);
            return [];
        }
    }

    limpiarTodasLasTareas() {
        if (confirm('¿Estás seguro de que quieres eliminar todas las tareas?')) {
            this.tareas = [];
            this.guardarEnLocalStorage();
            this.renderizarTareas();
        }
    }

    obtenerEstadisticas() {
        const total = this.tareas.length;
        const completadas = this.tareas.filter(t => t.estado).length;
        const pendientes = total - completadas;
        
        return {
            total,
            completadas,
            pendientes,
            porcentajeCompletado: total > 0 ? Math.round((completadas / total) * 100) : 0
        };
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new GestorDeTareas();
});