module.exports = {
  errors: {
    badEmail: 'L\'indirizzo e-mail è vuoto o non valido.',
    maxCreatedOrgs: `L'utente non può creare più organizzazioni. Limite raggiunto.`,
    permissionDenied: 'Permessi insufficienti.',
    nonEmptyOrganization: `È necessario rimuovere altri membri da questa organizzazione.`,
    userUnknown: 'Utente sconosciuto.',
    orgaUnknown: 'Organizzazione sconosciuta.',
    invitationConflict: 'Questo utente è già membro dell\'organizzazione.',
    unknownRole: 'Il ruolo {role} è sconosciuto.',
    serviceUnavailable: 'Servizio non disponibile a causa di manutenzione.',
    badCredentials: `Indirizzo e-mail o password non validi.`,
    invalidToken: `Il token non è valido. Forse è scaduto.`,
    malformedPassword: 'La password deve contenere almeno 8 caratteri e contenere almeno un numero e un carattere maiuscolo.',
    noPasswordless: `L'autenticazione passordless non è accettata da questo servizio.`,
    rateLimitAuth: `Troppi tentativi in un breve intervallo. Attendi prima di riprovare.`
  }
}
