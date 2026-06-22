import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-privacy',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="legal-page">
      <div class="legal-container">
        <a routerLink="/" class="back-link">← Volver</a>
        <h1>Política de Privacidad</h1>
        <p class="last-updated">Última actualización: 21 de junio de 2026</p>
        <p class="compliance">Cumplimos con la <strong>Ley 25.326 de Protección de Datos Personales</strong> (Argentina)</p>

        <section>
          <h2>1. Responsable del Tratamiento</h2>
          <p><strong>Buildrr</strong></p>
          <ul>
            <li>Email: ginocarabellimd&#64;gmail.com</li>
            <li>Teléfono: +54 351 812 7383</li>
          </ul>
        </section>

        <section>
          <h2>2. Datos que Recopilamos</h2>
          <h3>A. Durante Registro/Login:</h3>
          <ul>
            <li>Nombre, email, teléfono</li>
            <li>Contraseña (encriptada)</li>
            <li>Empresa/organización</li>
            <li>Datos de facturación</li>
          </ul>

          <h3>B. Operacionales:</h3>
          <ul>
            <li>Obras, costos, presupuestos</li>
            <li>Información de clientes y proveedores</li>
            <li>Transacciones, facturas, movimientos</li>
          </ul>

          <h3>C. Técnicos:</h3>
          <ul>
            <li>Dirección IP</li>
            <li>Datos de navegación</li>
            <li>Cookies de sesión</li>
          </ul>
        </section>

        <section>
          <h2>3. Finalidades del Tratamiento</h2>
          <p>Usamos datos para:</p>
          <ul>
            <li>✅ Operar y mantener el Servicio</li>
            <li>✅ Cumplir obligaciones legales</li>
            <li>✅ Mejorar funcionalidades</li>
            <li>✅ Facturación y cobros</li>
            <li>✅ Prevenir fraude y abuso</li>
          </ul>
          <p><strong>NO hacemos:</strong></p>
          <ul>
            <li>❌ Venta de datos personales a terceros</li>
            <li>❌ Marketing no solicitado</li>
            <li>❌ Transferencia a países sin protección equivalente</li>
          </ul>
        </section>

        <section>
          <h2>4. Derechos del Titular (LPDP Art. 7)</h2>
          <p>Tienes derecho a:</p>
          <ul>
            <li><strong>Acceso (Art. 14):</strong> Solicitar qué datos tenemos de ti. Respuesta en 10 días hábiles.</li>
            <li><strong>Rectificación (Art. 16):</strong> Corregir datos inexactos o incompletos.</li>
            <li><strong>Cancelación (Art. 16):</strong> Eliminar tus datos (salvo obligaciones legales/tributarias).</li>
            <li><strong>Oposición (Art. 17):</strong> Oponerte al tratamiento de datos.</li>
          </ul>
          <p><strong>Cómo ejercer:</strong> Envía solicitud a ginocarabellimd&#64;gmail.com con descripción clara del derecho. Respuesta en 10-30 días hábiles.</p>
        </section>

        <section>
          <h2>5. Seguridad</h2>
          <p>Implementamos:</p>
          <ul>
            <li>✅ Encriptación SSL/TLS</li>
            <li>✅ Bases de datos encriptadas</li>
            <li>✅ Control de acceso por roles</li>
            <li>✅ Auditoría de logs</li>
            <li>✅ Respaldos automáticos</li>
          </ul>
          <p><strong>Nota:</strong> No garantizamos seguridad 100%. Usas bajo tu riesgo.</p>
        </section>

        <section>
          <h2>6. Compartición de Datos</h2>
          <ul>
            <li><strong>Dentro de tu Organización:</strong> Otros usuarios ven datos que compartes</li>
            <li><strong>Con Prestadores:</strong> Bajo acuerdos de confidencialidad</li>
            <li><strong>Transferencias Internacionales:</strong> Datos en servidores locales (Argentina)</li>
            <li><strong>Autoridades:</strong> Solo por orden legal</li>
          </ul>
        </section>

        <section>
          <h2>7. Notificación de Brechas</h2>
          <p>Si ocurre una brecha de seguridad, te notificamos dentro de 72 horas describiendo qué datos fueron afectados y medidas de protección.</p>
        </section>

        <section>
          <h2>8. Contacto</h2>
          <p>📧 ginocarabellimd&#64;gmail.com</p>
          <p>📱 +54 351 812 7383</p>
          <p><strong>Reclamación ante AEPD:</strong> Si consideras que tu privacidad fue violada, puedes presentar reclamo ante la Autoridad de Protección de Datos.</p>
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
      margin-bottom: 10px;
    }
    .compliance {
      color: #E8FF47;
      margin-bottom: 40px;
      font-size: 0.95rem;
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
    h3 {
      font-size: 1rem;
      margin: 15px 0 8px;
      color: #ccc;
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
export class PrivacyComponent {}
