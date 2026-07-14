import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filterStatusPipe',
  standalone: true
})
export class FilterStatusPipe implements PipeTransform {
  transform(tasks: any[], status: string): any[] {
    if (!tasks) return [];
    return tasks.filter(task => task.status === status);
  }
}
