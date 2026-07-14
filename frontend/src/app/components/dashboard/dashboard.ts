import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { FilterStatusPipe } from '../../pipes/filter-status.pipe';
import { IsOverduePipe } from '../../pipes/is-overdue.pipe';

interface Task {
  _id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  createdAt: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FilterStatusPipe, IsOverduePipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {
  private apiService = inject(ApiService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  tasks = signal<Task[]>([]);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  userEmail = signal<string | null>(null);

  // Filters
  filterStatus = signal<string>('all');
  filterPriority = signal<string>('all');
  searchQuery = signal<string>('');

  // Stats computed from tasks
  totalCount = computed(() => this.tasks().length);
  todoCount = computed(() => this.tasks().filter(t => t.status === 'todo').length);
  inProgressCount = computed(() => this.tasks().filter(t => t.status === 'in-progress').length);
  doneCount = computed(() => this.tasks().filter(t => t.status === 'done').length);
  completionPercentage = computed(() => {
    const total = this.totalCount();
    return total > 0 ? Math.round((this.doneCount() / total) * 100) : 0;
  });

  // Modal State
  isModalOpen = signal(false);
  editingTask = signal<Task | null>(null);

  taskForm = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(100)]],
    description: [''],
    status: ['todo' as 'todo' | 'in-progress' | 'done'],
    priority: ['medium' as 'low' | 'medium' | 'high'],
    dueDate: ['']
  });

  ngOnInit(): void {
    this.userEmail.set(this.apiService.getUserEmail());
    this.loadTasks();
  }

  loadTasks(): void {
    this.isLoading.set(true);
    const filters = {
      status: this.filterStatus() === 'all' ? undefined : this.filterStatus(),
      priority: this.filterPriority() === 'all' ? undefined : this.filterPriority(),
      search: this.searchQuery() || undefined
    };

    this.apiService.getTasks(filters).subscribe({
      next: (data) => {
        this.tasks.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set('Failed to load tasks.');
        this.isLoading.set(false);
      }
    });
  }

  onFilterStatusChange(status: string): void {
    this.filterStatus.set(status);
    this.loadTasks();
  }

  onFilterPriorityChange(priority: string): void {
    this.filterPriority.set(priority);
    this.loadTasks();
  }

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery.set(value);
    this.loadTasks();
  }

  openCreateModal(): void {
    this.editingTask.set(null);
    this.taskForm.reset({
      title: '',
      description: '',
      status: 'todo',
      priority: 'medium',
      dueDate: ''
    });
    this.isModalOpen.set(true);
  }

  openEditModal(task: Task): void {
    this.editingTask.set(task);
    let formattedDate = '';
    if (task.dueDate) {
      formattedDate = new Date(task.dueDate).toISOString().substring(0, 10);
    }
    this.taskForm.patchValue({
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: formattedDate
    });
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
    this.editingTask.set(null);
  }

  saveTask(): void {
    if (this.taskForm.invalid) {
      this.taskForm.markAllAsTouched();
      return;
    }

    const taskData = this.taskForm.getRawValue();
    const taskToSave = {
      ...taskData,
      dueDate: taskData.dueDate ? new Date(taskData.dueDate).toISOString() : undefined
    };

    const action$ = this.editingTask()
      ? this.apiService.updateTask(this.editingTask()!._id, taskToSave)
      : this.apiService.createTask(taskToSave);

    action$.subscribe({
      next: () => {
        this.closeModal();
        this.loadTasks();
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Failed to save task.');
      }
    });
  }

  updateTaskStatus(task: Task, newStatus: 'todo' | 'in-progress' | 'done'): void {
    this.apiService.updateTask(task._id, { status: newStatus }).subscribe({
      next: () => this.loadTasks(),
      error: () => this.errorMessage.set('Failed to update status.')
    });
  }

  deleteTask(id: string): void {
    if (confirm('Are you sure you want to delete this task?')) {
      this.apiService.deleteTask(id).subscribe({
        next: () => this.loadTasks(),
        error: () => this.errorMessage.set('Failed to delete task.')
      });
    }
  }

  logout(): void {
    this.apiService.logout();
    this.router.navigate(['/login']);
  }
}
