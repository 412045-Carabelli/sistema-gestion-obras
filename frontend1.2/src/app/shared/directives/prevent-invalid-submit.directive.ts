import {Directive, HostListener} from '@angular/core';
import {FormGroupDirective} from '@angular/forms';

@Directive({
  selector: 'form[appPreventInvalidSubmit]',
  standalone: true,
})
export class PreventInvalidSubmitDirective {
  constructor(private formGroupDirective: FormGroupDirective) {}

  @HostListener('submit', ['$event'])
  onFormSubmit(event: Event) {
    const form = this.formGroupDirective.form;
    if (form.invalid) {
      event.preventDefault();
      event.stopPropagation();
      form.markAllAsTouched();
    }
  }

  @HostListener('keydown.enter', ['$event'])
  onEnter(event: KeyboardEvent) {
    const form = this.formGroupDirective.form;
    if (form.invalid) {
      event.preventDefault();
      event.stopPropagation();
    }
  }
}

