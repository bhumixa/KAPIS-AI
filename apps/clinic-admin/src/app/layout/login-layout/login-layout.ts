import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/** Unauthenticated shell: centered card on a branded background, no toolbar/sidenav. */
@Component({
  selector: 'app-login-layout',
  imports: [RouterOutlet],
  templateUrl: './login-layout.html',
  styleUrl: './login-layout.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginLayout {}
