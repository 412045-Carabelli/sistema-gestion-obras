import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-terms',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="legal-page">
      <div class="legal-container">
        <a routerLink="/" class="back-link">← Volver</a>
        <h1>Términos de Servicio</h1>
        <p class="last-updated">Última actualización: 21 de junio de 2026</p>

        <section>
          <h2>1. Aceptación de Términos</h2>
          <p>Al acceder y usar buildrr ("Servicio"), aceptas estar legalmente obligado por estos Términos de Servicio. Si no aceptas estos términos, no uses el Servicio.</p>
        </section>

        <section>
          <h2>2. Descripción del Servicio</h2>
          <p>buildrr es una plataforma SaaS de gestión para empresas constructoras, que incluye:</p>
          <ul>
            <li>Gestión de obras y presupuestos</li>
            <li>Administración de clientes y proveedores</li>
            <li>Control de transacciones y facturas</li>
            <li>Reportes y análisis financieros</li>
            <li>Agenda y tareas colaborativas</li>
          </ul>
        </section>

        <section>
          <h2>3. Declaración sobre Inteligencia Artificial</h2>
          <p><strong>Transparencia IA:</strong></p>
          <p>buildrr fue desarrollado con asistencia de inteligencia artificial (Claude, Anthropic). Declaramos esto explícitamente para cumplir con normativas de transparencia:</p>
          <ul>
            <li>Herramientas de IA se utilizaron en diseño, desarrollo e implementación</li>
            <li>Las decisiones finales y arquitectura de negocio son responsabilidad del equipo humano</li>
            <li>La IA no reemplaza validaciones de seguridad ni compliance legal</li>
            <li>Todos los cálculos financieros se verifican mediante tests automáticos y auditoría humana</li>
          </ul>
        </section>

        <section>
          <h2>4. Elegibilidad</h2>
          <ul>
            <li>Debes ser mayor de 18 años</li>
            <li>Debes tener autoridad legal para celebrar un contrato vinculante</li>
            <li>No puedes usar el Servicio si estás prohibido por ley en tu jurisdicción</li>
            <li>Las empresas son responsables de sus usuarios autorizados</li>
          </ul>
        </section>

        <section>
          <h2>5. Limitación de Responsabilidad</h2>
          <p><strong>EXENCIÓN DE GARANTÍAS:</strong> El Servicio se proporciona "TAL CUAL" sin garantías de disponibilidad continua, precisión de datos, o aptitud para propósito específico.</p>
          <p><strong>LIMITACIÓN DE DAÑOS:</strong> NO somos responsables por pérdida de datos, ganancias, daños indirectos o consecuentes. Responsabilidad máxima = 12 meses de suscripción pagada.</p>
        </section>

        <section>
          <h2>5. Uso Prohibido</h2>
          <ul>
            <li>Transferir acceso a terceros no autorizados</li>
            <li>Intentar acceder a datos de otras empresas</li>
            <li>Reverse engineering o extracción de datos masiva</li>
            <li>Uso con fines ilícitos o fraude</li>
            <li>Violar derechos de terceros</li>
          </ul>
        </section>

        <section>
          <h2>6. Suspensión de Servicio</h2>
          <p>Podemos suspender tu acceso si incumples estos términos, haces uso malicioso del Servicio, no pagas suscripción, o violas leyes aplicables.</p>
        </section>

        <section>
          <h2>7. Resolución de Disputas y Arbitraje</h2>
          <p><strong>Cláusula de Arbitraje Vinculante:</strong></p>
          <p>Cualquier controversia, reclamo o disputa que surja de o se relacione con este Acuerdo será resuelta mediante arbitraje vinculante, no en corte.</p>

          <h3>Proceso:</h3>
          <ol>
            <li><strong>Resolución Amistosa (30 días):</strong> Contacta a ginocarabellimd&#64;gmail.com para resolver</li>
            <li><strong>Arbitraje:</strong> Si no se resuelve en 30 días, se somete a arbitraje ante un árbitro único</li>
            <li><strong>Ley Aplicable:</strong> Código Civil Comercial de la República Argentina</li>
            <li><strong>Sede:</strong> Buenos Aires, Argentina</li>
            <li><strong>Costos:</strong> Buildrr paga costos del árbitro si reclamación &lt; ARS 50,000</li>
          </ol>

          <h3>Excepciones Arbitraje:</h3>
          <ul>
            <li>Reclamaciones ante organismos administrativos (AEPD, AFIP)</li>
            <li>Medidas cautelares o injunctive relief en corte</li>
            <li>Derechos de propiedad intelectual</li>
          </ul>

          <p><strong>Renuncia a Juicio:</strong> Al aceptar estos términos, ambas partes renuncian al derecho a litigación en corte y a juicio por jurado.</p>
        </section>

        <section>
          <h2>8. Contacto</h2>
          <p>📧 ginocarabellimd&#64;gmail.com</p>
          <p>📱 +54 351 812 7383</p>
        </section>

        <p class="version">Versión 1.0 | Vigente desde 21/06/2026</p>
      </div>
    </div>
  `,
  styles: [`
    .legal-page {
      min-height: 100vh;
      background: #0e0e0e;
      padding: 40px 20px;
      font-family: 'Space Grotesk', sans-serif;
      color: #F0F0F0;
    }
    .legal-container {
      max-width: 900px;
      margin: 0 auto;
    }
    .back-link {
      color: #E8FF47;
      text-decoration: none;
      cursor: pointer;
      font-size: 0.95rem;
      transition: opacity 0.2s;
    }
    .back-link:hover {
      opacity: 0.8;
    }
    h1 {
      font-size: 2.5rem;
      margin: 40px 0 10px;
      font-weight: 700;
    }
    .last-updated {
      color: #666;
      font-size: 0.9rem;
      margin-bottom: 40px;
    }
    section {
      margin: 30px 0;
      line-height: 1.6;
    }
    h2 {
      font-size: 1.3rem;
      margin: 20px 0 10px;
      color: #E8FF47;
    }
    ul {
      margin-left: 20px;
      color: #ccc;
    }
    li {
      margin: 8px 0;
    }
    strong {
      color: #E8FF47;
    }
    .version {
      margin-top: 60px;
      padding-top: 20px;
      border-top: 1px solid rgba(255,255,255,0.1);
      color: #666;
      font-size: 0.85rem;
    }
  `]
})
export class TermsComponent {}
