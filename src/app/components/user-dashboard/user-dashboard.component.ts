import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UserService } from '../../services/user.service';
import { User, RoleDistribution } from '../../../models/user-model';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
selector: 'app-user-dashboard',
templateUrl: './user-dashboard.component.html',
styleUrls: ['./user-dashboard.component.css']
})
export class UserDashboardComponent implements OnInit, AfterViewInit, OnDestroy {
readonly itemsPerPage = 4;
currentPage$ = new BehaviorSubject<number>(1);
totalPages$ = new BehaviorSubject<number>(0);

users$: Observable<User[]>;
roleDistribution$: Observable<RoleDistribution[]>;

users: User[] = [];
roleDistribution: RoleDistribution[] = [];
chart: any = null; // Changed from Chart | null
private destroy$ = new Subject<void>();
private chartLoaded = false; // Track if Chart.js is loaded

constructor(
  private userService: UserService,
  public dialog: MatDialog
) {
  this.users$ = this.userService.users$;
  this.roleDistribution$ = this.userService.getRoleDistribution();
}

ngOnInit(): void {
  this.users$
    .pipe(takeUntil(this.destroy$))
    .subscribe(users => {
      this.users = users;
      this.updatePagination();
      this.updateChart();
    });

  this.roleDistribution$
    .pipe(takeUntil(this.destroy$))
    .subscribe(distribution => {
      this.roleDistribution = distribution;
      this.updateChart();
    });
}

ngAfterViewInit(): void {
  if (this.roleDistribution.length > 0) {
    this.updateChart();
  }
}

ngOnDestroy(): void {
  this.destroy$.next();
  this.destroy$.complete();
  if (this.chart) {
    this.chart.destroy();
  }
}

private updatePagination(): void {
  const totalPages = Math.ceil(this.users.length / this.itemsPerPage);
  this.totalPages$.next(totalPages);
  if (this.currentPage$.value > totalPages && totalPages > 0) {
    this.currentPage$.next(1);
  }
}

getDisplayedUsers(): User[] {
  const currentPage = this.currentPage$.value;
  const startIndex = (currentPage - 1) * this.itemsPerPage;
  const endIndex = startIndex + this.itemsPerPage;
  return this.users.slice(startIndex, endIndex);
}

previousPage(): void {
  const currentPage = this.currentPage$.value;
  if (currentPage > 1) {
    this.currentPage$.next(currentPage - 1);
  }
}

nextPage(): void {
  const currentPage = this.currentPage$.value;
  const totalPages = this.totalPages$.value;
  if (currentPage < totalPages) {
    this.currentPage$.next(currentPage + 1);
  }
}

isPreviousDisabled(): boolean {
  return this.currentPage$.value <= 1;
}

isNextDisabled(): boolean {
  return this.currentPage$.value >= this.totalPages$.value;
}

//LAZY LOAD Chart.js
private async updateChart(): Promise<void> {
  if (this.roleDistribution.length === 0) return;

  setTimeout(async () => {
    const canvas = document.getElementById('roleChart') as HTMLCanvasElement;
    if (!canvas) {
      console.warn('Canvas element not found');
      return;
    }

    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.warn('2D context not available');
      return;
    }

    try {
      if (!this.chartLoaded) {
        const ChartModule = await import('chart.js');
        const { Chart, DoughnutController, ArcElement, Tooltip, Legend } = ChartModule;
        
        Chart.register(DoughnutController, ArcElement, Tooltip, Legend);
        this.chartLoaded = true;
        console.log('✅ Chart.js loaded successfully');
      }
      const { Chart } = await import('chart.js');

      const config = {
        type: 'doughnut' as const,
        data: {
          labels: this.roleDistribution.map(r => r.role),
          datasets: [
            {
              data: this.roleDistribution.map(r => r.count),
              backgroundColor: ['#1c4980', '#383838', '#5a9fd4'],
              borderColor: ['#fff', '#fff', '#fff'],
              borderWidth: 2
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: {
              position: 'bottom' as const,
              labels: {
                padding: 15,
                font: { size: 12 }
              }
            }
          }
        }
      };

      this.chart = new Chart(ctx, config);
    } catch (error) {
      console.error('Error loading or creating chart:', error);
    }
  }, 200);
}

//LAZY LOAD UserFormComponent
async openUserForm(): Promise<void> {
  try {
    // Dynamically import the module
    const { UserFormComponent } = await import('../user-form/user-form.component');
    const dialogRef = this.dialog.open(UserFormComponent, {
      width: '500px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      disableClose: false
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        if (result) {
          this.updatePagination();
        }
      });
  } catch (error) {
    console.error('Error lazy loading UserFormComponent:', error);
  }
}

deleteUser(id: number): void {
  if (confirm('Are you sure you want to delete this user?')) {
    this.userService.deleteUser(id);
  }
}
}