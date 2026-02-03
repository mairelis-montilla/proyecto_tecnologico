import nodemailer from 'nodemailer'

// Configuración del transporter
const createTransporter = () => {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com'
  const port = parseInt(process.env.SMTP_PORT || '587', 10)
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!user || !pass) {
    console.warn('⚠️ SMTP credentials not configured. Email sending will be simulated.')
    return null
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  })
}

const transporter = createTransporter()

const APP_NAME = 'MentorMatch'
const FROM_EMAIL = process.env.SMTP_FROM || 'noreply@mentormatch.com'

// Templates de email
const emailTemplates = {
  verification: (code: string, firstName: string) => ({
    subject: `${APP_NAME} - Verifica tu correo electrónico`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .code { font-size: 36px; font-weight: bold; color: #667eea; letter-spacing: 8px; text-align: center; padding: 20px; background: white; border-radius: 8px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${APP_NAME}</h1>
          </div>
          <div class="content">
            <h2>¡Hola ${firstName}!</h2>
            <p>Gracias por registrarte en ${APP_NAME}. Para completar tu registro, ingresa el siguiente código de verificación:</p>
            <div class="code">${code}</div>
            <p>Este código expira en <strong>15 minutos</strong>.</p>
            <p>Si no solicitaste este código, puedes ignorar este correo.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} ${APP_NAME}. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Hola ${firstName},\n\nTu código de verificación es: ${code}\n\nEste código expira en 15 minutos.\n\nSi no solicitaste este código, puedes ignorar este correo.\n\n${APP_NAME}`,
  }),

  passwordReset: (code: string, firstName: string) => ({
    subject: `${APP_NAME} - Recupera tu contraseña`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .code { font-size: 36px; font-weight: bold; color: #667eea; letter-spacing: 8px; text-align: center; padding: 20px; background: white; border-radius: 8px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          .warning { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 8px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${APP_NAME}</h1>
          </div>
          <div class="content">
            <h2>¡Hola ${firstName}!</h2>
            <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta. Usa el siguiente código:</p>
            <div class="code">${code}</div>
            <p>Este código expira en <strong>15 minutos</strong>.</p>
            <div class="warning">
              <strong>⚠️ Seguridad:</strong> Si no solicitaste restablecer tu contraseña, ignora este correo y tu cuenta permanecerá segura.
            </div>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} ${APP_NAME}. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Hola ${firstName},\n\nTu código para restablecer la contraseña es: ${code}\n\nEste código expira en 15 minutos.\n\nSi no solicitaste restablecer tu contraseña, ignora este correo.\n\n${APP_NAME}`,
  }),

  mentorApproved: (firstName: string) => ({
    subject: `${APP_NAME} - ¡Tu perfil de mentor ha sido aprobado!`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .success { background: #d4edda; border: 1px solid #28a745; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${APP_NAME}</h1>
          </div>
          <div class="content">
            <h2>¡Felicidades ${firstName}!</h2>
            <div class="success">
              <h3>🎉 ¡Tu perfil de mentor ha sido aprobado!</h3>
            </div>
            <p>Ya puedes empezar a recibir solicitudes de sesiones de estudiantes.</p>
            <p>Te recomendamos:</p>
            <ul>
              <li>Completar tu perfil con toda tu información</li>
              <li>Configurar tu disponibilidad horaria</li>
              <li>Definir tu tarifa por sesión</li>
            </ul>
            <p>¡Bienvenido a la comunidad de mentores de ${APP_NAME}!</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} ${APP_NAME}. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `¡Felicidades ${firstName}!\n\nTu perfil de mentor ha sido aprobado. Ya puedes empezar a recibir solicitudes de sesiones de estudiantes.\n\n¡Bienvenido a la comunidad de mentores de ${APP_NAME}!`,
  }),

  mentorRejected: (firstName: string, reason?: string) => ({
    subject: `${APP_NAME} - Tu solicitud de mentor necesita ajustes`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .info { background: #e2e3e5; border: 1px solid #6c757d; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${APP_NAME}</h1>
          </div>
          <div class="content">
            <h2>Hola ${firstName}</h2>
            <p>Hemos revisado tu solicitud para ser mentor y necesitamos que realices algunos ajustes.</p>
            ${reason ? `<div class="info"><strong>Motivo:</strong> ${reason}</div>` : ''}
            <p>Te invitamos a revisar tu perfil y volver a enviarlo para su aprobación.</p>
            <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} ${APP_NAME}. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Hola ${firstName},\n\nHemos revisado tu solicitud para ser mentor y necesitamos que realices algunos ajustes.${reason ? `\n\nMotivo: ${reason}` : ''}\n\nTe invitamos a revisar tu perfil y volver a enviarlo.\n\n${APP_NAME}`,
  }),
}

// Función para enviar email
export const sendEmail = async (
  to: string,
  template: keyof typeof emailTemplates,
  data: { code?: string; firstName: string; reason?: string }
): Promise<boolean> => {
  try {
    let emailContent

    switch (template) {
      case 'verification':
        emailContent = emailTemplates.verification(data.code!, data.firstName)
        break
      case 'passwordReset':
        emailContent = emailTemplates.passwordReset(data.code!, data.firstName)
        break
      case 'mentorApproved':
        emailContent = emailTemplates.mentorApproved(data.firstName)
        break
      case 'mentorRejected':
        emailContent = emailTemplates.mentorRejected(data.firstName, data.reason)
        break
      default:
        throw new Error(`Template ${template} not found`)
    }

    if (!transporter) {
      // Modo desarrollo: simular envío
      console.log('📧 [EMAIL SIMULATED]')
      console.log(`To: ${to}`)
      console.log(`Subject: ${emailContent.subject}`)
      console.log(`Code: ${data.code || 'N/A'}`)
      return true
    }

    await transporter.sendMail({
      from: `"${APP_NAME}" <${FROM_EMAIL}>`,
      to,
      subject: emailContent.subject,
      text: emailContent.text,
      html: emailContent.html,
    })

    console.log(`📧 Email sent to ${to}`)
    return true
  } catch (error) {
    console.error('Error sending email:', error)
    return false
  }
}

// Función específica para enviar código de verificación
export const sendVerificationCode = async (
  email: string,
  firstName: string,
  code: string
): Promise<boolean> => {
  return sendEmail(email, 'verification', { code, firstName })
}

// Función específica para enviar código de recuperación de contraseña
export const sendPasswordResetCode = async (
  email: string,
  firstName: string,
  code: string
): Promise<boolean> => {
  return sendEmail(email, 'passwordReset', { code, firstName })
}

// Función para notificar aprobación de mentor
export const sendMentorApprovedEmail = async (
  email: string,
  firstName: string
): Promise<boolean> => {
  return sendEmail(email, 'mentorApproved', { firstName })
}

// Función para notificar rechazo de mentor
export const sendMentorRejectedEmail = async (
  email: string,
  firstName: string,
  reason?: string
): Promise<boolean> => {
  return sendEmail(email, 'mentorRejected', { firstName, reason })
}
