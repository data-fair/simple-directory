module.exports = {
  errors: {
    badEmail: 'Die E-Mail-Adresse ist leer oder fehlerhaft.',
    maxCreatedOrgs: `Der Benutzer kann keine weiteren Organisationen erstellen. Limit erreicht.`,
    permissionDenied: 'Nicht ausreichende Berechtigungen.',
    nonEmptyOrganization: `Sie müssen andere Mitglieder aus dieser Organisation entfernen`,
    userUnknown: 'Unbekannter Benutzer.',
    orgaUnknown: 'Unbekannte Organisation.',
    invitationConflict: 'Dieser Benutzer ist bereits Mitglied der Organisation.',
    unknownRole: 'Rolle {role} ist unbekannt.',
    serviceUnavailable: 'Service wegen Wartung nicht verfügbar.',
    badCredentials: `E-Mail-Adresse oder Passwort ungültig.`,
    invalidToken: `Das Token ist ungültig. Vielleicht ist es abgelaufen.`,
    malformedPassword: 'Das Passwort sollte mindestens 8 Zeichen lang sein und mindestens eine Zahl und ein Großbuchstaben enthalten.',
    noPasswordless: `Die passwortlose Authentifizierung wird von diesem Dienst nicht akzeptiert.`,
    rateLimitAuth: `Zu viele Versuche in kurzer Zeit. Bitte warten Sie, bevor Sie es erneut versuchen.`
  }
}
