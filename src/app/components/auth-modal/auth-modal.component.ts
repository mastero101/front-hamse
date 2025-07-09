import { Component, EventEmitter, Output, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-auth-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './auth-modal.component.html',
  styleUrl: './auth-modal.component.scss'
})
export class AuthModalComponent {
  @Input() isRegistrationMode = false;
  @Output() close = new EventEmitter<void>();
  
  isLogin = true;
  username = '';
  email = '';
  password = '';
  isAdmin = false;
  errorMessage = '';
  isLoading = false;

  constructor(private authService: AuthService) {}

  closeModal() {
    // Solo permitir cerrar si el usuario está autenticado
    if (this.authService.currentUserValue) {
      this.close.emit();
    }
  }

  get canRegister(): boolean {
    return this.authService.currentUserValue?.role === 'admin';
  }

  toggleMode() {
    // Verificar si puede cambiar a modo registro
    if (!this.isLogin && !this.canRegister) {
      this.errorMessage = 'Solo los administradores pueden registrar nuevos usuarios';
      return;
    }

    this.isLogin = !this.isLogin;
    this.username = '';
    this.email = '';
    this.password = '';
    this.errorMessage = '';
  }

  onSubmit() {
    this.isLoading = true;
    this.errorMessage = '';

    if (this.isLogin) {
      this.authService.signin(this.username, this.password)
        .subscribe({
          next: (response) => {
            if (response && response.data) {
              // Mostrar mensaje de éxito brevemente antes de cerrar
              this.errorMessage = 'Inicio de sesión exitoso';
              setTimeout(() => {
                this.closeModal();
              }, 1000);
              window.location.reload()
            } else {
              this.errorMessage = 'Credenciales inválidas';
            }
            this.isLoading = false;
          },
          error: (error) => {
            this.errorMessage = 'Error al iniciar sesión. Por favor, verifica tus credenciales.';
            this.isLoading = false;
          }
        });
    } else {
      const currentUser = this.authService.currentUserValue;
      
      if (!currentUser?.accessToken || currentUser?.role !== 'admin') {
        this.errorMessage = 'No tienes permisos para registrar usuarios o tu sesión ha expirado';
        this.isLoading = false;
        return;
      }

      this.authService.signup(this.username, this.email, this.password, this.isAdmin)
        .subscribe({
          next: (response) => {
            if (response.data?.status === 'success') {
              this.errorMessage = `Usuario ${response.data.data.username} registrado exitosamente`;
              setTimeout(() => {
                this.closeModal();
              }, 1500);
            } else {
              this.errorMessage = 'Error en el registro: ' + (response.data?.message || 'Error desconocido');
            }
            this.isLoading = false;
          },
          error: (error) => {
            this.errorMessage = error.response?.data?.message || 'Error en el registro. Verifica los permisos.';
            this.isLoading = false;
          }
        });
    }
  }

  ngOnInit() {
    if (this.isRegistrationMode) {
      this.isLogin = false;
    }
  }
}
