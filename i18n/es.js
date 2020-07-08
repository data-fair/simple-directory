module.exports = {
  errors: {
    badEmail: 'La dirección de correo electrónico está vacía o mal formada.',
    maxCreatedOrgs: `El usuario no puede crear más organizaciones. Límite alcanzado.`,
    permissionDenied: 'Permisos insuficientes.',
    nonEmptyOrganization: `Debe eliminar a otros miembros de esta organización.`,
    userUnknown: 'Usuario desconocido.',
    orgaUnknown: 'Organización desconocida.',
    invitationConflict: 'Este usuario ya es miembro de la organización.',
    unknownRole: 'El rol {role} es desconocido.',
    serviceUnavailable: 'Servicio no disponible por mantenimiento.',
    badCredentials: `Dirección de correo electrónico o contraseña inválida.`,
    invalidToken: `El token no es válido. Quizás haya expirado.`,
    malformedPassword: 'La contraseña debe tener al menos 8 caracteres y contener al menos un número y un carácter en mayúscula.',
    noPasswordless: `La autenticación sin contraseña no es aceptada por este servicio.`,
    rateLimitAuth: `Demasiados intentos en un corto intervalo. Por favor espere antes de intentarlo de nuevo.`
  }
}
