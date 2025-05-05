import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { SettingsService } from '../../services/settings.service';

@Component({
  selector: 'app-whatsapp-chat-bubble',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './whatsapp-chat-bubble.component.html',
  styleUrl: './whatsapp-chat-bubble.component.scss'
})
export class WhatsappChatBubbleComponent implements OnInit {
  isChatOpen = false;
  phoneNumber: string = ''; 
  isAdmin: boolean = false;
  isEditingNumber: boolean = false;
  newPhoneNumber: string = '';
  isLoadingNumber: boolean = false;

  constructor(
    private authService: AuthService,
    private settingsService: SettingsService
  ) {}

  ngOnInit(): void {
    this.checkAdminStatus();
    this.loadWhatsAppNumber();
  }

  checkAdminStatus(): void {
    const currentUser = this.authService.currentUserValue;
    this.isAdmin = currentUser?.role === 'admin';
  }

  loadWhatsAppNumber(): void {
    this.isLoadingNumber = true;
    // Usar el servicio para obtener el número
    this.settingsService.getWhatsappNumber().subscribe({
      next: (data) => {
        this.phoneNumber = data.whatsappNumber || 'NUMERO_POR_DEFECTO_SI_FALLA'; // Usar un valor por defecto si la BD no devuelve nada
        this.newPhoneNumber = this.phoneNumber;
        console.log('Número de WhatsApp cargado desde API:', this.phoneNumber);
        this.isLoadingNumber = false;
      },
      error: (error) => {
        console.error('Error al cargar el número de WhatsApp desde la API:', error);
        this.phoneNumber = 'NUMERO_POR_DEFECTO_SI_FALLA'; // Fallback a un número por defecto en caso de error
        this.newPhoneNumber = this.phoneNumber;
        this.isLoadingNumber = false;
        // Considera mostrar un mensaje al usuario
      }
    });
  }

  toggleChat(): void {
    this.isChatOpen = !this.isChatOpen;
    if (!this.isChatOpen) {
      this.isEditingNumber = false;
    }
  }

  toggleEditNumber(): void {
    if (this.isAdmin) {
      this.isEditingNumber = !this.isEditingNumber;
      if (this.isEditingNumber) {
        this.newPhoneNumber = this.phoneNumber; // Resetear al número actual al abrir
      }
    }
  }

  savePhoneNumber(): void {
    if (this.isAdmin && this.newPhoneNumber && /^\d+$/.test(this.newPhoneNumber)) {
      this.isLoadingNumber = true;
      // Usar el servicio para actualizar el número
      this.settingsService.updateWhatsappNumber(this.newPhoneNumber).subscribe({
        next: (response) => {
          this.phoneNumber = this.newPhoneNumber;
          console.log('Número de WhatsApp actualizado en BD:', this.phoneNumber, response);
          this.isEditingNumber = false;
          this.isLoadingNumber = false;
          // Podrías mostrar una notificación de éxito
        },
        error: (error) => {
          console.error('Error al guardar el número de WhatsApp en la BD:', error);
          alert('Error al guardar el número. Inténtalo de nuevo.');
          this.isLoadingNumber = false;
        }
      });
    } else {
      alert('Número de teléfono inválido. Por favor, ingrese solo dígitos.');
    }
  }

  openWhatsApp(message: string): void {
    if (!this.phoneNumber || this.isLoadingNumber) { // Añadir chequeo de isLoadingNumber
      console.error('Número de WhatsApp no configurado o cargando.');
      // Podrías mostrar un mensaje al usuario indicando que el número no está disponible o se está cargando
      return;
    }
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${this.phoneNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  }
}
