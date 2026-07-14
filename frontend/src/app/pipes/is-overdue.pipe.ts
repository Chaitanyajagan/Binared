import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'isOverduePipe',
  standalone: true
})
export class IsOverduePipe implements PipeTransform {
  transform(dueDate: string | undefined): boolean {
    if (!dueDate) return false;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    return due < now;
  }
}
