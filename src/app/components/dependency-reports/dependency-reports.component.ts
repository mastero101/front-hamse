import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser'; // Importar DomSanitizer

@Component({
  selector: 'app-dependency-reports',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dependency-reports.component.html',
  styleUrl: './dependency-reports.component.scss'
})
export class DependencyReportsComponent implements OnInit {
  selectedTab: string = 'PCIVIL';
  currentRequirements: any[] = [];

  isVideModalVisible: boolean = false;
  currentVideoUrl: string = '';

  // Propiedades para el modal de calendario
  isCalendarModalVisible: boolean = false;
  currentRequirementForReminder: any = null;
  calendarViewDate: Date = new Date();
  selectedReminderDate: Date | null = null;
  calendarDays: { day: number, month: number, year: number, isCurrentMonth: boolean, isSelected: boolean, isToday: boolean }[] = [];
  dayLabels = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];

  constructor(private sanitizer: DomSanitizer) {}

  ngOnInit() {
    this.loadRequirements(this.selectedTab);
    // Inicializar el calendario al mes actual por si se abre directamente
    this.generateCalendarDays(this.calendarViewDate);
  }

  get safeVideoUrl(): SafeResourceUrl | null { // Getter para la URL segura del video
    if (!this.currentVideoUrl) {
      return null;
    }
    return this.sanitizer.bypassSecurityTrustResourceUrl(this.currentVideoUrl);
  }

  selectTab(tab: string) {
    this.selectedTab = tab;
    this.loadRequirements(tab);
  }

  loadRequirements(dependency: string) {
    this.currentRequirements = this.getMockRequirements(dependency);
  }

  openVideoModal(videoUrl?: string) {
    if (videoUrl) {
      this.currentVideoUrl = videoUrl;
      this.isVideModalVisible = true;
    } else {
      console.warn('No video URL provided for annotations.');
    }
  }

  closeVideoModal() {
    this.isVideModalVisible = false;
    this.currentVideoUrl = '';
  }

  // Métodos para el modal de Calendario
  openCalendarModal(requirement: any) {
    this.currentRequirementForReminder = requirement;
    this.calendarViewDate = new Date(); // Siempre abrir en el mes actual
    this.selectedReminderDate = null; // Limpiar selección previa
    this.generateCalendarDays(this.calendarViewDate);
    this.isCalendarModalVisible = true;
  }

  closeCalendarModal() {
    this.isCalendarModalVisible = false;
    this.currentRequirementForReminder = null;
    this.selectedReminderDate = null;
  }

  generateCalendarDays(date: Date) {
    this.calendarDays = [];
    const year = date.getFullYear();
    const month = date.getMonth(); // 0-indexed

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalizar para comparación

    // Días del mes anterior para completar la primera semana
    let startingDayOfWeek = firstDayOfMonth.getDay(); // 0 (Dom) - 6 (Sab)
    startingDayOfWeek = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1; // Ajustar para que Lunes sea 0

    const prevMonthLastDay = new Date(year, month, 0);
    for (let i = startingDayOfWeek -1 ; i >= 0; i--) {
      const day = prevMonthLastDay.getDate() - i;
      this.calendarDays.push({
        day: day,
        month: month -1 < 0 ? 11 : month -1,
        year: month -1 < 0 ? year -1 : year,
        isCurrentMonth: false,
        isSelected: false,
        isToday: false
      });
    }

    // Días del mes actual
    for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
      const currentDate = new Date(year, month, day);
      const isSelected = this.selectedReminderDate ?
        (this.selectedReminderDate.getFullYear() === year &&
         this.selectedReminderDate.getMonth() === month &&
         this.selectedReminderDate.getDate() === day) : false;
      const isTodayFlag = currentDate.getTime() === today.getTime();

      this.calendarDays.push({ day, month, year, isCurrentMonth: true, isSelected, isToday: isTodayFlag });
    }

    // Días del mes siguiente para completar la última semana
    const lastDayOfWeek = lastDayOfMonth.getDay(); // 0 (Dom) - 6 (Sab)
    const daysToAdd = (7 - (this.calendarDays.length % 7)) % 7;

    for (let i = 1; i <= daysToAdd; i++) {
      this.calendarDays.push({
        day: i,
        month: month + 1 > 11 ? 0 : month + 1,
        year: month + 1 > 11 ? year + 1 : year,
        isCurrentMonth: false,
        isSelected: false,
        isToday: false
      });
    }
  }

  previousMonth() {
    this.calendarViewDate.setMonth(this.calendarViewDate.getMonth() - 1);
    this.generateCalendarDays(this.calendarViewDate);
  }

  nextMonth() {
    this.calendarViewDate.setMonth(this.calendarViewDate.getMonth() + 1);
    this.generateCalendarDays(this.calendarViewDate);
  }

  selectDate(dayObj: { day: number, month: number, year: number, isCurrentMonth: boolean }) {
    if (!dayObj.isCurrentMonth) return; // No permitir seleccionar días de otros meses por ahora

    this.selectedReminderDate = new Date(dayObj.year, dayObj.month, dayObj.day);
    // Regenerar días para reflejar la selección
    this.generateCalendarDays(this.calendarViewDate);
  }

  saveReminder() {
    if (this.selectedReminderDate && this.currentRequirementForReminder) {
      console.log('Recordatorio guardado para:', this.currentRequirementForReminder.title);
      console.log('Fecha seleccionada:', this.selectedReminderDate.toLocaleDateString());
      // Aquí iría la lógica para guardar el recordatorio (e.g., enviar a un backend)
    } else {
      console.warn('No se ha seleccionado una fecha o requerimiento.');
    }
    this.closeCalendarModal();
  }

  getMonthYearDisplay(date: Date): string {
    return date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  }

  getDependencyFullName(tabKey: string): string {
    const names: { [key: string]: string } = {
      PCIVIL: 'PROTECCIÓN CIVIL',
      ASEA: 'ASEA',
      STPS: 'SECRETARIA DEL TRABAJO Y PREVISIÓN SOCIAL',
      PROFECO: 'PROFECO',
      CNE: 'COMISION NACIONAL DE ENERGIA',
      SENER: 'Secretaría de Energía',
      PEMEX: 'PEMEX-COMERCIALIZADORA',
      'SIN-MUN': 'SINATEC - SEMARNAT / MUNICIPALES',
      SAT: 'SAT'
    };
    return names[tabKey] || tabKey;
  }

  private getMockRequirements(dependency: string): any[] {
    const defaultVideoUrl = 'https://www.youtube.com/embed/LV6M1GK4Fsw'; // URL de video por defecto para embed
    switch(dependency) {
      case 'PCIVIL':
        return [
          {
            title: 'Programa Interno de Protección Civil',
            description: 'Implementación del Programa Interno de Protección Civil y los requisitos que deben cumplir en materia de protección civil, llenado y seguimiento a los formatos requeridos. En caso de haber requerimientos de visitas, anexar la evidencia de la solventación sellada por la secretaría.',
            periodicity: 'Anual',
            period: 'Enero a Diciembre',
            completed: false,
            videoUrl: defaultVideoUrl
          },
          {
            title: 'Anuencia',
            description: 'Solicitar la anuencia municipal presentando el PIPC y demás documentos que solicite el ayuntamiento.',
            periodicity: 'Anual',
            period: 'Enero a Diciembre',
            completed: false,
            videoUrl: defaultVideoUrl
          },
          {
            title: 'Cursos de Protección Civil',
            description: 'Capacitación de: Primeros Auxilios, Evacuación de Inmuebles, Búsqueda y Rescate y Combate de Incendios. Obtener las constancias.',
            periodicity: 'Anual',
            period: 'Enero a Diciembre',
            completed: false,
            videoUrl: defaultVideoUrl
          }
        ];
      case 'ASEA':
        return [
          {
            title: 'Auditoria externa SASISOPA',
            description: 'Se realiza auditoría al SASISOPA por un tercero acreditado.',
            periodicity: 'Cada 2 años',
            period: 'De acuerdo a la estación',
            completed: false,
            hasProvidersButton: true,
            videoUrl: defaultVideoUrl
          },
          {
            title: 'Análisis de Riesgos del Sector Hidrocarburos',
            description: 'La estación de servicio deberá de contar con su Análisis de Riesgos del Sector Hidrocarburos para identificar los peligros, jerarquizar los riesgos y establecer las salvaguardas o recomendaciones para mitigar los peligros y disminuir el riesgo.',
            periodicity: 'Única',
            period: '-----',
            completed: false,
            hasProvidersButton: true,
            videoUrl: defaultVideoUrl
          },
          {
            title: 'Protocolo de Respuesta a Emergencias',
            description: 'La estación de servicio deberá de contar con su Protocolo de Respuesta a Emergencias actualizado conforme los establecido en DISPOSICIONES Administrativas de carácter general que establecen los Lineamientos para la elaboración de los protocolos de respuesta a emergencias.',
            periodicity: 'Única',
            period: '-----',
            completed: false,
            hasProvidersButton: true,
            videoUrl: defaultVideoUrl
          },
          {
            title: 'Dictamen de Operación y Mantenimiento - NOM 005 ASEA 2016',
            description: 'La estación de servicio deber contar con el dictamen de verificación para la etapa de operación y mantenimiento conforme a lo establecido en la NOM 005 ASEA 2016, el cual debe ser emitido por una Unidad de Verificación acreditada por la EMA y aprobada por la ASEA.',
            periodicity: 'Anual',
            period: 'Antes del vencimiento del ultimo dictamen',
            completed: false,
            hasProvidersButton: true,
            videoUrl: defaultVideoUrl
          }
        ];
      case 'STPS':
        return [
          {
            title: 'NOM-020-STPS-2011 Recipientes Sujetos a Presión',
            description: 'Se definen las actividades de mantenimiento e inspección de los recipientes.',
            periodicity: 'Anual',
            period: 'Enero a Diciembre',
            completed: false,
            hasProvidersButton: true,
            videoUrl: defaultVideoUrl
          },
          {
            title: 'NOM-022-STPS-2008 Electricidad Estática',
            description: 'Se define la resistencia de las tierras físicas.',
            periodicity: 'Anual',
            period: 'Enero a Diciembre',
            completed: false,
            hasProvidersButton: true,
            videoUrl: defaultVideoUrl
          },
          {
            title: 'NOM-025-STPS-2008 Estudios de iluminación',
            description: 'Se realiza estudio para comprobar si cumple con la iluminación.',
            periodicity: 'Anual',
            period: 'Enero a Diciembre',
            completed: false,
            hasProvidersButton: true,
            videoUrl: defaultVideoUrl
          }
        ];
      case 'PROFECO':
        return [
          {
            title: 'NOM-005-SCFI-2017 Instrumentos de Medición',
            description: 'Verificación del Sistema de Medición para el despacho de Gasolinas y Diesel.',
            periodicity: 'Semestral',
            period: '1.-Enero a marzo\n2.- Julio a Septiembre',
            completed: false,
            hasProvidersButton: false,
            videoUrl: defaultVideoUrl
          },
          {
            title: 'NOM-022-STPS-2008 Electricidad Estática',
            description: 'Verificar el proveedor de Software cumple con lo requerido por DGN.',
            periodicity: 'Anual',
            period: 'Enero a Diciembre',
            completed: false,
            hasProvidersButton: false,
            videoUrl: defaultVideoUrl
          },
          {
            title: 'NOM-025-STPS-2008 Estudios de iluminación',
            description: 'Bitácoras de movimientos de los dispensarios, de acuerdo a la Nom 005_ hojas de control.\n\nCuando se acceda a la programación, se abra el dispensario, cambio de precios.',
            periodicity: 'Permanente',
            period: 'Por evento',
            completed: false,
            hasProvidersButton: true,
            videoUrl: defaultVideoUrl
          }
        ];
      case 'CNE': // Asumiendo que CNE es Comisión Nacional de Energía
        return [
          {
            title: 'Muestreo y Análisis conforme a la NOM-016-CRE-2016',
            description: 'Se realiza la toma de muestras y análisis por un Laboratorio. Se realiza la toma de muestras y análisis por un Laboratorio de acuerdo con la Ley Federal sobre Metrología y Normalización. Resguardo de los resultados de las pruebas de laboratorio efectuados en el primer y segundo semestre del año. (Pemex o externo acreditado)',
            periodicity: 'Semestral',
            period: '1.-Enero a Junio\n2.- Julio a Diciembre',
            completed: false,
            hasProvidersButton: false,
            videoUrl: defaultVideoUrl
          },
          {
            title: 'Dictamen de cumplimiento vigente de la Norma Oficial Mexicana NOM-016-CRE-2016',
            description: 'Dictamen vigente de la Norma Oficial Mexicana NOM-016-CRE-2016, Especificaciones de calidad de los petrolíferos, emitido por una Unidad de Verificación o Tercero Acreditado.',
            periodicity: 'Anual',
            period: 'Enero a Marzo',
            completed: false,
            hasProvidersButton: true,
            videoUrl: defaultVideoUrl
          },
          {
            title: 'Certificación del Manual del Sistema de Gestión de Medición (SGM)',
            description: 'Manual del Sistema de Gestión de las Mediciones, el cual debe contener los procedimientos y registros de las actividades en relación a los sistemas de medición. En caso de haberse dictaminado, Dictamen del SMG.El manual debe describir la organización del SGM y las generalidades de su operación.',
            periodicity: 'Anual',
            period: 'Enero a febrero o Diciembre',
            completed: false,
            hasProvidersButton: true,
            videoUrl: defaultVideoUrl
          }
        ];
      case 'SENER': // Asumiendo que SENER es Secretaría de Energía
        return [
          {
            title: 'Estudio de Evaluación de Impacto Social (EVIS)',
            description: 'En caso de cambios en las capacidades de la estación, se tendrá que volver a solicitar. Se requiere para el inicio de operaciones.',
            periodicity: 'Único',
            period: 'Eventual',
            completed: false,
            hasProvidersButton: false,
            videoUrl: defaultVideoUrl
          },
          {
            title: 'Dictamen de cumplimiento vigente de la Norma Oficial Mexicana NOM-016-CRE-2016',
            description: 'Se evalúan las instalaciones eléctricas de la estación y se emite un dictamen de cumplimiento.',
            periodicity: 'Lustro',
            period: 'Cada 5 años',
            completed: false,
            hasProvidersButton: true,
            videoUrl: defaultVideoUrl
          }
        ];
        case 'PEMEX':
        return [
          {
            title: 'Fianzas',
            description: 'Fianzas para compra de Combustible',
            periodicity: 'Único',
            period: 'Eventual',
            completed: false,
            hasProvidersButton: false,
            videoUrl: defaultVideoUrl
          }
        ];
        case 'SIN-MUN': // Combina SINATEC - SEMARNAT y MUNICIPALES
        return [
          // SINATEC - SEMARNAT
          {
            title: 'Cédula de Operación Anual',
            subTitle: 'SINATEC - SEMARNAT',
            description: 'Una vez que la estación de servicio cuenta con la resolución de la LAU o la LF, además de que las gasolineras están catalogadas como fuentes fijas de jurisdicción federal, deberán de presentar el trámite de la Cédula de Operación Anual y, posteriormente, su actualización anualmente.',
            periodicity: 'Anual',
            period: '1 de Marzo al 30 de Junio',
            completed: false,
            hasProvidersButton: true,
            videoUrl: defaultVideoUrl
          },
          // MUNICIPALES
          {
            title: 'Prediales',
            subTitle: 'MUNICIPALES',
            description: '',
            periodicity: 'Anual',
            period: 'Enero',
            completed: false,
            hasProvidersButton: false,
            videoUrl: defaultVideoUrl
          },
          {
            title: 'Convenio Bomberos',
            subTitle: 'MUNICIPALES',
            description: '',
            periodicity: 'Anual',
            period: 'Previo al vencimiento',
            completed: false,
            hasProvidersButton: false,
            videoUrl: defaultVideoUrl
          },
          {
            title: 'Anuencias de Preciador',
            subTitle: 'MUNICIPALES',
            description: '',
            periodicity: 'Anual',
            period: 'Enero',
            completed: false,
            hasProvidersButton: false,
            videoUrl: defaultVideoUrl
          }
        ];
      case 'SAT':
        return [
          {
            title: 'Anexo 30',
            description: 'Establece los requisitos para la implementación de controles volumétricos en la industria de hidrocarburos y petrolíferos. Estos controles tienen como objetivo garantizar la precisión y transparencia en la medición de volúmenes, así como cumplir con las obligaciones fiscales y regulatorias.',
            periodicity: 'Anual',
            period: 'Diciembre',
            completed: false,
            hasProvidersButton: true,
            videoUrl: defaultVideoUrl
          },
          {
            title: 'Anexo 31',
            description: 'Describe el proceso de verificación y certificación de estos equipos y programas, garantizando que cumplan con las especificaciones del Anexo 30.',
            periodicity: 'Anual',
            period: 'Diciembre',
            completed: false,
            hasProvidersButton: true,
            videoUrl: defaultVideoUrl
          }
        ];
      default:
        return [
          {
            title: `Requerimiento Ejemplo 1 para ${this.getDependencyFullName(dependency)}`,
            description: 'Descripción detallada del requerimiento de ejemplo número uno.',
            periodicity: 'Anual',
            period: 'Enero a Diciembre',
            completed: false,
            videoUrl: defaultVideoUrl
          },
          {
            title: `Requerimiento Ejemplo 2 para ${this.getDependencyFullName(dependency)}`,
            description: 'Descripción detallada del requerimiento de ejemplo número dos.',
            periodicity: 'Semestral',
            period: 'Junio y Diciembre',
            completed: true,
            videoUrl: defaultVideoUrl
          }
        ];
    }
  }
}
