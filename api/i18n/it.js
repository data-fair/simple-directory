// WARN: do not use underscore in keys, it is used as delimiter when reading
// messages from environment variables

export default {
  root: {
    title: 'Simple Directory',
    description: "Gestione semplificata dei suoi utenti e delle sue organizzazioni in un'architettura moderna orientata al web."
  },
  common: {
    home: 'Pagina iniziale',
    logLink: 'Accesso / Registrazione',
    logout: 'Disconnettiti',
    login: 'Login',
    signin: 'Registrazione',
    activateAdminMode: 'Attivare la modalità di amministrazione',
    deactivateAdminMode: 'Disattivare la modalità di amministrazione',
    documentation: 'Documentazione',
    administration: 'Amministrazione',
    myAccount: 'Il mio conto',
    myOrganizations: 'Le mie organizzazioni',
    organization: 'Organizzazione',
    organizations: 'Organizzazioni',
    organizationName: 'Nome dell\'organizzazione',
    user: 'Utente',
    users: 'Utenti',
    createOrganization: "Creare un'organizzazione",
    dashboard: 'Cruscotto',
    description: 'Descrizione',
    id: 'Login',
    name: 'Nome',
    save: 'Registrati a',
    members: 'Membri',
    orgStorageMembers: 'Membri nello storage secondario',
    role: 'Ruolo',
    search: 'Ricerca',
    confirmOk: 'Ok',
    confirmCancel: 'Annulla',
    confirmTitle: 'Vuoi confermare questa operazione?',
    firstName: 'Nome',
    lastName: 'Cognome',
    email: 'Indirizzo e-mail',
    modificationOk: 'La sua modifica è stata applicata.',
    invitations: 'Inviti',
    accept: 'Accetta',
    reject: 'Rifiuta',
    confirmDeleteTitle: 'Cancellare {name}',
    confirmDeleteMsg: 'È sicuro di voler eliminare questa risorsa? Faccia attenzione, i dati non saranno recuperabili.',
    editTitle: 'Modificare {name}',
    loggedAt: 'Ultimo login',
    createdAt: 'Creato su',
    createdPhrase: 'Creato da {name} il {date}',
    host: 'Sito',
    sites: 'Sitos',
    updatedAt: 'Aggiornato il',
    maxCreatedOrgs: 'Numero massimo di organizzazioni da creare',
    maxCreatedOrgsShort: 'Max orgs',
    nbCreatedOrgs: 'Numero di organizzazioni create:',
    back: 'Ritorno',
    next: 'Avanti',
    password: 'Password',
    checkInbox: 'Controlla la tua casella di posta elettronica',
    spamWarning: 'Se non ha ricevuto alcuna e-mail, verifichi che non sia stata classificata automaticamente come spam.',
    validate: 'Convalidare',
    delete: 'Delete',
    department: 'Dipartimento',
    departments: 'Dipartimenti',
    autoAdmin: 'Aggiungimi automaticamente come amministratore',
    asAdmin: 'Effettua il login come utente',
    delAsAdmin: 'Ritorno alla mia sessione di amministrazione',
    avatar: 'Avatar',
    birthday: 'Compleanno',
    missingInfo: 'Informazioni mancanti',
    '2FA': 'Autenticazione a due fattori',
    userAccount: 'Account personale',
    continue: 'Continua',
    tooLong: 'testo troppo lungo',
    settings: 'impostazioni',
    emailConfirmed: 'creazione finalizzata',
    emailNotConfirmed: 'creazione non finalizzata',
    noRole: 'nessun ruolo',
    downloadCsv: 'scarica l\'elenco in formato CSV',
    authMode: 'Modalità di autenticazione',
    authProviders: 'Provider di autenticazione',
    partners: 'Organizzazioni partner',
    contactEmail: 'Email di contatto',
    orgName: 'Nome dell\'organizzazione',
    loginSignin: 'Accesso / crea un account',
    sort: 'Ordina',
    all: 'tutti',
    creationStep: 'Passo di creazione',
    oauthTokens: 'Token OAuth',
    plannedDeletion: 'Cancellazione programmata',
    plannedDeletionShort: 'Cancellazione',
    owner: 'Proprietario',
    passwordLists: 'Elenchi di password',
    adminGlobal: 'Amministrazione globale',
    adminSite: 'Amministrazione del sito',
    no: 'no',
    redirectSite: 'Sito di reindirizzamento'
  },
  doc: {
    about: {
      link: 'Chi siamo'
    },
    install: {
      link: 'Installazione'
    },
    config: {
      link: 'Configurazione',
      i18nKey: 'Digitare il file I18N',
      i18nVar: 'Variabile ambientale',
      i18nVal: 'Valore',
      varKey: 'Digitare il file di configurazione',
      varName: 'Variabile ambientale',
      varDesc: 'Descrizione',
      varDefault: 'Valore di default',
      varDescriptions: {
        publicUrl: '<b>IMPORTANTE.</b> L\'URL a cui il servizio sarà esposto. Per esempio https://koumoul.com/simple-directory',
        admins: '<b>IMPORTANTE.</b> L\'elenco degli indirizzi e-mail degli amministratori del servizio.',
        contact: '<b>IMPORTANTE.</b> L\'indirizzo e-mail di contatto per gli utenti del servizio.',
        theme: {
          logo: 'L\'URL del logo da utilizzare per sostituire il logo predefinito di <i>Simple Directory</i>.',
          dark: 'Rendere l\'intero aspetto delle pagine scure.<br>Si noti che i colori di default sono più adatti ad un tema leggero. Se si passa al buio, è necessario cambiare anche questi colori.',
          cssUrl: 'Collegamento ad un foglio di stile per completare le variabili di personalizzazione.<br>Avvertenza: la struttura HTML può variare significativamente tra 2 versioni. Mantenendo questo foglio di stile si creerà del lavoro extra per voi ad ogni aggiornamento.',
          cssText: 'Contenuti CSS testuali.<br>Avvertenza: la struttura HTML può variare significativamente tra 2 versioni. Mantenendo questo foglio di stile si creerà del lavoro extra per voi ad ogni aggiornamento.'
        },
        secret: {
          public: '<b>IMPORTANTE.</b> Il percorso della chiave di cifratura RSA pubblica. Consultare la documentazione per l\'installazione del servizio di assistenza.',
          private: '<b>IMPORTANTE.</b> Il percorso della chiave di cifratura privata RSA. Consultare la documentazione per l\'installazione del servizio di assistenza.'
        },
        analytics: 'JSON per la configurazione analitica, corrisponde alla parte di configurazione "moduli" della libreria <a href="https://github.com/koumoul-dev/vue-multianalytics#modules">vue-multianalytics</a>',
        storage: {
          type: `<b>IMPORTANTE.</b> Il tipo di archiviazione per la persistenza degli utenti e delle organizzazioni.<br>
Il tipo "file" di default è di sola lettura ed è adatto per lo sviluppo/test o per utilizzare una collezione utente esportata da un altro sistema.<br>
Il tipo "mongo" dipende dall'accesso ad un database MongoDB, è la modalità appropriata per la maggior parte delle installazioni in produzione.`,
          file: {
            users: 'Solo per storage.type=file. Il percorso del file JSON contenente le definizioni utente',
            organizations: 'Solo per storage.type=file. Il percorso del file JSON contenente le definizioni dell\'organizzazione'
          },
          mongo: {
            url: 'Solo per lo storage.type=mongo. La stringa di connessione completa al database di mongodb.'
          }
        },
        mails: {
          transport: '<b>IMPORTANTE.</b> Un oggetto di configurazione per il trasporto della posta JSON compatibile con la libreria <a href="https://nodemailer.com/smtp/">nodemailer</a>.',
          from: '<b>IMPORTANTE.</b> L\'indirizzo da compilare come mittente delle e-mail emesse dal servizio.'
        },
        listEntitiesMode: `Consente di limitare globalmente l'accesso alle liste di utenti e organizzazioni.<br>
Può essere 'anonimo', 'autenticato' o 'admin'.`,
        defaultLoginRedirect: 'Reindirizzamento predefinito dopo il login. Se non specificato, l\'utente verrà reindirizzato al suo profilo.',
        onlyCreateInvited: 'Se gli utenti veri non saranno creati alla prima email inviata. Devono essere invitati in un\'organizzazione.',
        tosUrl: '<b>IMPORTANTE.</b> Un URL ai vostri termini e condizioni d\'uso. Se questo parametro non è definito e non indica una pagina web corretta, si rischia di non rispettare i propri obblighi nei confronti dei propri utenti.'
      }
    },
    use: {
      link: 'Utilizzare'
    }
  },
  pages: {
    admin: {
      users: {
        noCreatedOrgsLimit: 'Gli utenti possono creare un numero qualsiasi di organizzazioni.',
        createdOrgsLimit: 'Gli utenti possono creare organizzazioni predefinite {defaultMaxCreatedOrgs}.',
        explainLimit: 'Impostare un valore per limitare il numero di organizzazioni che questo utente può creare. -1 per qualsiasi numero. Cancellare il campo per tornare al valore di default ({defaultMaxCreatedOrgs}).',
        editUserEmailTitle: 'Cambia l\'indirizzo email dell\'utente {name}',
        editUserEmailText: 'Attenzione! La posta elettronica è una chiave utente importante, modificando queste informazioni si corre il rischio di inserire un indirizzo errato, non funzionante o incoerente con altre voci. Questa funzione viene presentata solo agli amministratori per sbloccare un utente la cui casella di posta diventa inaccessibile.',
        drop2FATitle: 'Disattivare l\'autenticazione a due fattori',
        drop2FAText: 'Attenzione! Questa operazione disattiverà l\'autenticazione a due fattori per questo utente.'
      },
      organizations: {
        limitOrganizationTitle: "Cambiare i confini dell'organizzazione.",
        members: 'membro(i)',
        nbMembers: 'Numero massimo di soci (0 per nessun limite)'
      },
      sites: {
        createSite: 'Definire un nuovo sito',
        colorWarnings: 'Avvertenze di contrasto'
      },
      site: {
        title: 'Configurazione del sito'
      }
    },
    login: {
      title: 'Accedi al tuo conto',
      emailLabel: 'Il suo indirizzo e-mail',
      emailCaption: 'Per saperne di più sull\'autenticazione <a href="https://koumoul.com/blog/passwordless">senza password</a>',
      success: "Riceverà un'e-mail all'indirizzo fornito che conterrà un link. La preghiamo di aprire questo link per completare la sua identificazione.",
      maildevLink: 'Vai alla mailbox di sviluppo',
      newPassword: 'Nuova password',
      newPassword2: 'Confermare la nuova password',
      changePassword: 'Rinnovare la password',
      changePasswordTooltip: 'Se dimentica la sua password o deve cambiarla, rinnovi la password.',
      newPasswordMsg: 'Inserisca la nuova password due volte.',
      changePasswordSent: "Le è stata inviata un'e-mail all'indirizzo {email}. Questa e-mail contiene un link per modificare la password associata al suo conto.",
      passwordlessMsg1: "Tutto ciò di cui ha bisogno è un'e-mail per effettuare il login.",
      passwordlessMsg2: "Invii un'e-mail di login.",
      passwordlessConfirmed: "Le è stata inviata un'e-mail all'indirizzo {email}. Questa e-mail contiene un link per accedere alla nostra piattaforma.",
      createUserMsg1: 'Se non ha ancora effettuato il login alla nostra piattaforma, crei un conto.',
      createUserMsg2: 'Crea un account',
      createUserInvit: 'Crea un account per accettare l\'invito nell\'organizzazione {name}',
      createUserOrganization: 'Vuoi creare un\'organizzazione?',
      createuserOrganizationHelp: 'Se crei un\'organizzazione potrai invitare altri utenti a unirsi e condividere risorse.',
      tosMsg: 'Prima di creare il tuo account leggi <a href="{tosUrl}" target="_blank">le nostre condizioni generali di utilizzo</a>.',
      tosConfirm: "Confermo di aver letto i termini e le condizioni d'uso di questo sito.",
      createUserConfirm: 'Crea un account',
      createUserConfirmed: "Le è stata inviata un'e-mail all'indirizzo {email}. Questa e-mail contiene un link per convalidare la creazione del conto.",
      adminMode: 'Confermi la sua identità per entrare nella modalità di amministrazione.',
      oauth: 'Effettuare il login con :',
      error: 'Errore',
      rememberMe: 'ricordami',
      '2FACode': 'codice a 6 cifre o codice di recupero',
      '2FAInfo': 'Inserisci un codice di verifica per continuare. Puoi ottenere questo codice dall\'applicazione di verifica sul tuo telefono. Se perdi il dispositivo, puoi usare il codice di recupero scaricato durante l\'impostazione dell\'autenticazione a due fattori.',
      configure2FA: 'Configura l\'autenticazione a due fattori',
      configure2FAQRCode: 'Codice QR per l\'impostazione dell\'autenticazione a due fattori',
      configure2FAQRCodeMsg: 'Scansiona questo codice QR con un\'applicazione di autenticazione di tua scelta (come Authy o Google Authenticator) quindi inserisci il codice a 6 cifre offerto da questa applicazione.',
      configure2FACode: 'codice a 6 cifre',
      recovery2FA: 'Codice di recupero',
      revovery2FAInfo: 'Attenzione! Conserva il codice di recupero sottostante in un luogo sicuro. Senza di esso, non sarai in grado di recuperare il tuo account se perdi il dispositivo su cui hai appena impostato l\'autenticazione a due fattori.',
      recovery2FACode: 'codice di recupero: ',
      recovery2FADownload: 'scarica un file contenente il codice di recupero',
      recovery2FAContent: 'Codice di recupero per l\'autenticazione a due fattori {name}',
      plannedDeletion: 'Cancellazione programmata',
      cancelDeletion: 'Annulla la cancellazione dell\'utente',
      siteLogo: 'Logo del sito',
      partnerInvitation: 'Invito partner',
      changeHost: 'Account associato al back-office'
    },
    organization: {
      addMember: "Invitare un utente ad aderire all'organizzazione...",
      disableInvite: 'Questa organizzazione ha raggiunto la sua massima adesione.',
      deleteMember: "Cancelli questo utente dall'elenco dei soci dell'organizzazione.",
      editMember: "Cambiare il ruolo di questo utente nell'organizzazione.",
      memberReadOnly: 'This user\'s membership to the organization comes from an identity provider and cannot be modified here.',
      confirmEditMemberTitle: 'Modifica {name}',
      confirmDeleteMemberTitle: 'Escludere {name}',
      confirmDeleteMemberMsg: "Vuole davvero eliminare questo utente dall'elenco dei soci dell'organizzazione {org}?",
      deleteMemberSuccess: "L'utente {name} è stato espulso dall'organizzazione`.",
      inviteEmail: "Indirizzo e-mail dell'utente",
      inviteSuccess: "L'invito è stato inviato a {email}.",
      invitePartnerSuccess: "L'invito è stato inviato a {email}.",
      memberConflict: 'Questo utente è già membro',
      departmentLabelTitle: 'Etichetta per il concetto "dipartimento"',
      departmentLabelHelp: 'Lasciare vuoto per visualizzare "{defaultDepartmentLabel}". Compilare per utilizzare un altro vocabolario come "servizio", "agenzia", ecc.',
      addDepartment: 'Creare {departmentLabel}',
      editDepartment: 'Modifica {departmentLabel}',
      deleteDepartment: 'Cancellare {departmentLabel}',
      confirmEditDepartmentTitle: 'Modifica {name}',
      confirmDeleteDepartmentTitle: 'Cancellare {name}',
      confirmDeleteDepartmentMsg: 'Vuole davvero eliminare {name} dalla sua organizzazione?',
      deleteDepartmentHasMembers: 'Questo dipartimento è assegnato a {count} membro(i) dell\'organizzazione. Non è possibile eliminarlo in questo stato.',
      departmentIdInvalid: "L'identificatore deve contenere solo lettere, numeri e spazi.",
      inviteLink: 'In caso di problemi nella comunicazione via e-mail è possibile inviare il link di conferma sottostante con un altro mezzo. Avvertimento ! Rischi di inserire un indirizzo email errato o non funzionante nel database utenti. Questo indirizzo e-mail può causare più problemi in seguito: cambio di password, invio di avvisi, ecc.',
      '2FARoles': 'Autenticazione a due fattori.',
      '2FARolesMsg': 'Rendere obbligatoria l\'autenticazione a due fattori per gli utenti con questi ruoli:',
      sendInvitationLink: 'Invia un altro link di invito',
      addPartner: 'Invita un\'organizzazione partner',
      deletePartner: 'Elimina questo partner',
      depSortCreation: 'Ultimo creato',
      depSortAlpha: 'Ordine alfabetico',
      deletePartnerWarning: 'Attenzione le autorizzazioni concesse all\'organizzazione partner non saranno modificate da questa operazione. Dovresti probabilmente modificarle tu stesso.',
      fromCache: 'Ultima sincronizzazione di questo elenco con il provider di identità: {fromNow}.',
      roleLabel: 'Etichetta del ruolo "{role}"'
    },
    invitation: {
      title: 'Invito accettato',
      msgSameUser: 'Il vostro invito a far parte di un\'organizzazione è stato accettato. Potete consultare <a href="{profileUrl}">il tuo profilo</a>.',
      msgDifferentUser: 'L\'invito a far parte di un\'organizzazione è stato ben accolto. È possibile <a href="{loginUrl}">Accedi</a> con l\'account dell\'ospite.'
    },
    avatar: {
      load: 'carica un nuovo avatar',
      prepare: 'Preparare l\'immagine.'
    },
    me: {
      noOrganization: 'Lei non è membro di alcuna organizzazione.',
      operations: 'Operazioni sensibili',
      deleteMyself: 'Cancella questo account',
      deleteMyselfAlert: 'Se si cancella il proprio account, anche i dati associati saranno cancellati e non potranno essere recuperati.',
      deleteMyselfCheck: 'marque esta casilla y haga clic en OK para confirmar la eliminación.',
      accountChanges: 'Gestione dello switch di account',
      defaultOrg: 'Attiva questo account di default dopo ogni login',
      ignorePersonalAccount: 'Seleziona questa casella se non desideri utilizzare questa piattaforma al di fuori di un account organizzazione',
      sessions: 'Le tue sessioni',
      deleteSession: 'Eliminare la sessione su {deviceName} ?',
      deleteSessionWarning: 'La cancellazione della sessione può richiedere un tempo massimo di {duration} per essere completamente applicata.',
      settings: 'Le tue impostazioni'
    },
    colorsPreview: {
      title: 'Anteprima del rendering dei colori',
      cardTitle: 'Un esempio di carta',
      cardText: 'Utilizza il colore delle "superfici".'
    },
    partnerInvitation: {
      msg1: 'L\'organizzazione {name} desidera aggiungere {partnerName} come partner con {email} come indirizzo di contatto.',
      msg2: 'Il nome "{partnerName}" è indicativo e non corrisponde necessariamente alla denominazione esatta della tua organizzazione.',
      diffEmail: 'Sei connesso con l\'account utente {userName} ({userEmail}). Puoi connetterti con un altro account o creare un nuovo account cliccando sul pulsante qui sotto.',
      noUser1: 'Hai già un account? Puoi accedere e sarai reindirizzato a questa pagina in seguito.',
      noUser2: 'Non hai ancora un account? Puoi crearne uno e sarai reindirizzato a questa pagina in seguito.',
      noOrg: 'Non appartieni a nessuna organizzazione. Puoi creare una nuova organizzazione e accettare l\'invito a suo nome.',
      org: 'Puoi accettare questo invito a nome di un\'organizzazione di cui sei amministratore, oppure creare una nuova organizzazione e accettare l\'invito a suo nome.',
      createOrg: 'creare una nuova organizzazione',
      newOrgName: 'nome della nuova organizzazione',
      create: 'creare',
      acceptAs: 'accetta a nome di {name}'
    },
    changeHost: {
      msg1: 'L\'account {email} non esiste su {host} ma esiste su {mainHost}.',
      sso1: 'Soluzione: utilizzare {mainHost} per accedere',
      sso2: 'La pagina di login propone un pulsante per accedere da {mainHost} che puoi utilizzare. Puoi anche utilizzare <a class="text-primary" href="{mainHostLogin}">questo link.</a>.',
      solution1: 'Soluzione: spostare l\'account su {host}',
      solution2: 'Se scegli questa soluzione perderai la possibilità di accedere a {mainHost}.',
      confirmMigration: 'sposta l\'account su {host} e perdi l\'accesso a {mainHost}'
    },
    orgStorage: {
      activate: 'Attivare lo storage secondario degli utenti',
      link: 'Link di connessione per utilizzare questo storage secondario',
      ldap: 'Configurazione LDAP'
    }
  },
  errors: {
    badEmail: 'L\'indirizzo e-mail è vuoto o non valido.',
    badProviderInvitEmail: 'L\'indirizzo e-mail che hai utilizzato per accedere non corrisponde a quello dell\'invito che hai ricevuto',
    maxCreatedOrgs: 'L\'utente non può creare più organizzazioni. Limite raggiunto.',
    permissionDenied: 'Permessi insufficienti.',
    nonEmptyOrganization: 'È necessario rimuovere altri membri da questa organizzazione.',
    userUnknown: 'Utente sconosciuto.',
    orgaUnknown: 'Organizzazione sconosciuta.',
    invitationConflict: 'Questo utente è già membro dell\'organizzazione.',
    unknownRole: 'Il ruolo {role} è sconosciuto.',
    serviceUnavailable: 'Servizio non disponibile a causa di manutenzione.',
    badCredentials: 'Indirizzo e-mail o password non validi.',
    updatePassword: 'È necessario aggiornare la tua password, perché non è stata aggiornata da molto tempo.',
    missingToken: 'Il parametro id_token è mancante.',
    invalidToken: 'Il token non è valido. Forse è scaduto.',
    differentPasswords: 'Le password sono diverse',
    noPasswordless: 'L\'autenticazione senza password non è accettata da questo servizio.',
    rateLimitAuth: 'Troppi tentativi in un breve intervallo. Attendi prima di riprovare.',
    invalidInvitationToken: 'Il link di invito che hai ricevuto non è valido.',
    expiredInvitationToken: 'Il link di invito che hai ricevuto è scaduto, non puoi più accettare questo invito.',
    maxNbMembers: 'L\'organizzazione contiene già il numero massimo di membri consentito dalle sue quote.',
    unknownOAuthProvider: 'Identificazione OAuth non supportata.',
    unknownSAMLProvider: 'Identificazione SAML non supportata.',
    adminModeOnly: 'Funzionalità riservata ai super amministratori.',
    '2FANotConfigured': 'L\'autenticazione a due fattori è richiesta per questo account e non è ancora configurata.',
    passwordless2FA: 'L\'autenticazione senza password è incompatibile con l\'autenticazione a due fattori richiesta per questo account.',
    bad2FAToken: 'Codice di verifica non valido o scaduto per l\'autenticazione a due fattori',
    plannedDeletion: 'La cancellazione dell\'utente {name} e di tutti i suoi dati è programmata per il {plannedDeletion}.',
    onlyCreateInvited: 'Non puoi creare un account direttamente. Devi essere invitato da un\'organizzazione.',
    badIDPQuery: 'Richiesta considerata non valida dal provider di identità.',
    duplicateDep: 'Il nuovo dipartimento è un duplicato',
    passwordEntropy: 'La password non è abbastanza sicura.',
    passwordMinLength: 'La password deve contenere almeno {minLength} caratteri.',
    passwordMinCharClasses: 'La password deve contenere almeno {minCharClasses} diversi tipi di caratteri (minuscole, maiuscole, cifra, carattere speciale).',
    forbiddenPassword: 'Questa password è stata trovata in un elenco di password note e non può essere utilizzata.',
    samePassword: 'La nuova password deve essere diversa da quella vecchia.',
  },
  mails: {
    creation: {
      subject: 'Benvenuti a {host}',
      text: `
Una richiesta di creazione di un account è stata fatta da {host} per questo indirizzo email. Per attivare il conto è necessario copiare l'URL sottostante in un browser. Questo URL è valido per 15 minuti.

{link}

Se hai un problema con il tuo account o non hai richiesto la creazione di un account su {host}, contattaci all'indirizzo {contact}.
      `,
      htmlMsg: 'Da allora è stata fatta una richiesta per la creazione di un conto <a href="{origin}">{host}</a> per questo indirizzo e-mail. Per confermarlo cliccare sul pulsante qui sotto. Il link è valido per 15 minuti.',
      htmlButton: 'Confermare la creazione del conto',
      htmlAlternativeLink: 'Se il pulsante di cui sopra non funziona, è possibile copiare questo link nella barra degli indirizzi del browser:',
      htmlCaption: 'Se hai un problema con il tuo account o se non hai richiesto di effettuare il login a <a href="{origin}">{host}</a>, non esitate a contattarci a <a href="mailto:{contact}">{contact}</a>.'
    },
    login: {
      subject: 'Identificazione su {host}',
      text: `
Da allora è stata fatta una richiesta di identificazione {host}. Per confermarlo, copiare l'URL sottostante in un browser. Questo URL è valido per 15 minuti.

{link}

Se hai un problema con il tuo account o se non hai richiesto il login a {host}, contattaci a {contact}.
      `,
      htmlMsg: 'Una richiesta di identificazione è stata fatta da <a href="{origin}">{host}</a>. Per confermarlo cliccare sul pulsante qui sotto. Il link è valido per 15 minuti.',
      htmlButton: 'Connessione a {host}',
      htmlAlternativeLink: 'Se il pulsante di cui sopra non funziona, è possibile copiare questo link nella barra degli indirizzi del browser:',
      htmlCaption: 'Se hai un problema con il tuo account o se non hai richiesto di effettuare il login a <a href="{origin}">{host}</a>, non esitate a contattarci a <a href="mailto:{contact}">{contact}</a>.'
    },
    noCreation: {
      subject: 'Errore di autenticazione su {host}.',
      text: `
Una richiesta di identificazione è stata fatta da {host}, ma è stata rifiutata perché questo indirizzo e-mail è sconosciuto o non è stato convalidato.

Non esitate a contattarci all'indirizzo {contact}.
      `,
      htmlMsg: 'Una richiesta di identificazione è stata fatta da quando <a href="{origin}">{host}</a>, ma è stato rifiutato perché questo indirizzo e-mail è sconosciuto o non è stato convalidato.',
      htmlCaption: 'Non esitate a contattarci a <a href="mailto:{contact}">{contact}</a>.'
    },
    conflict: {
      subject: 'Non è stato possibile creare un account su {host}.',
      text: `
Una richiesta di creazione di un account è stata fatta da {host}, ma è stata respinta perché questo indirizzo e-mail è già associato a un account.

Non esitate a contattarci all'indirizzo {contact}.
      `,
      htmlMsg: 'Da allora è stata fatta una richiesta per la creazione di un conto <a href="{origin}">{host}</a>, ma è stato rifiutato perché questo indirizzo e-mail è già associato a un account.',
      htmlCaption: 'Non esitate a contattarci a <a href="mailto:{contact}">{contact}</a>.'
    },
    invitation: {
      subject: 'Unisciti alla {organization} su {host}.',
      text: `
Siete stati invitati da un amministratore di {organization} a partecipare. Per accettare questo invito, copiare l'URL sottostante in un browser. Questo URL è valido per 10 giorni.
Se non si dispone ancora di un account, questo verrà creato automaticamente.

{link}

Se incontrate problemi con il vostro account o trovate questo invito sospettoso, non esitate a contattarci a {contact}.
      `,
      htmlMsg: `
Siete stati invitati da un amministratore di {organization} a partecipare. Per accettare questo invito clicca il pulsante qui sotto. Il link è valido per 10 giorni.
Se non si dispone ancora di un account, questo verrà creato automaticamente.
      `,
      htmlButton: 'Accetta l\'invito',
      htmlAlternativeLink: 'Se il pulsante di cui sopra non funziona, è possibile copiare questo link nella barra degli indirizzi del browser:',
      htmlCaption: 'Se incontrate un problema con il vostro conto o trovate questo invito sospettoso, contattateci a <a href="mailto:{contact}">{contact}</a>.'
    },
    partnerInvitation: {
      subject: 'L\'organizzazione {organization} su {host} vuole aggiungere {partner} come partner',
      text: `
Un amministratore dell'organizzazione {organization} ti invita come contatto per l'organizzazione {partner} per unirsi su {host}. Per accettare questo invito, copia l'URL sottostante nel tuo browser. Questo URL è valido per 10 giorni.

{link}

Se incontri un problema con il tuo account o trovi questo invito sospetto, contattaci a {contact}.
      `,
      htmlMsg: `
Un amministratore dell'organizzazione {organization} ti invita come contatto per l'organizzazione {partner} per unirsi su {host}. Per accettare questo invito, clicca il pulsante qui sotto. Il link è valido per 10 giorni.
      `,
      htmlButton: 'Accetta l\'invito',
      htmlAlternativeLink: 'Se il pulsante di cui sopra non funziona, è possibile copiare questo link nella barra degli indirizzi del browser:',
      htmlCaption: 'Se incontri un problema con il tuo account o trovi questo invito sospetto, contattaci a <a href="mailto:{contact}">{contact}</a>.'
    },
    action: {
      subject: 'Esegui un\'azione sul tuo account su {host}.',
      text: `
Su questo indirizzo è stata attivata un'azione che richiede una conferma via e-mail. Per convalidare questa azione copiare l'URL sottostante in un browser. Questo URL è valido per 15 minuti.

{link}

Se incontrate un problema con il vostro account o se trovate questo messaggio sospetto, non esitate a contattarci a {contact}.
      `,
      htmlMsg: `
Su questo indirizzo è stata attivata un'azione che richiede una conferma via e-mail. Per convalidare questa azione cliccare sul pulsante qui sotto. Il link è valido per 15 minuti.
      `,
      htmlButton: 'Convalida',
      htmlAlternativeLink: 'Se il pulsante di cui sopra non funziona, è possibile copiare questo link nella barra degli indirizzi del browser:',
      htmlCaption: 'Se incontrate un problema con il vostro account o trovate questo messaggio sospetto, contattateci a <a href="mailto:{contact}">{contact}</a>.'
    },
    plannedDeletion: {
      subject: 'Cancellazione dell\'account programmata su {host}',
      text: `
L'utente {user} e tutti i dati ad esso relativi saranno cancellati il {plannedDeletion}. {cause}

Per annullare la cancellazione è possibile accedere qui {link}.

Non esitate a contattarci a {contact}.
      `,
      htmlMsg: 'L\'utente {user} e tutti i dati ad esso relativi saranno cancellati il {plannedDeletion}. {cause}',
      htmlButton: 'Accedi per annullare la cancellazione',
      htmlAlternativeLink: 'Se il pulsante non funziona, è possibile copiare/incollare questo link nella barra degli indirizzi del browser:',
      htmlCaption: 'Se si riscontrano problemi con il proprio account o se si ritiene che questo messaggio sia sospetto, non esitate a contattarci a <a href="mailto:{contact}">{contact}</a>.',
      causeInactivity: 'Questa operazione è stata attivata automaticamente perché questo account è inattivo dal {date}.'
    }
  },
  notifications: {
    sentInvitationTopic: 'un invito è stato inviato',
    sentInvitation: 'Un\'email è stata inviata a {email} con un invito per unirsi all\'organizzazione {orgName}.',
    acceptedInvitationTopic: 'un invito è stato accettato',
    acceptedInvitation: 'L\'utente {name} ({email}) si è unito all\'organizzazione {orgName}.',
    userCreated: 'L\'utente {name} ({email}) si è registrato sul sito {host}.',
    userCreatedOrg: 'L\'utente {name} ({email}) si è registrato sul sito {host} nell\'organizzazione {orgName}.',
    sentPartnerInvitationTopic: 'un invito partner è stato inviato',
    sentPartnerInvitation: 'Un\'email è stata inviata a {email} con un invito per l\'organizzazione {partnerName} per unirsi all\'organizzazione {orgName} come partner.',
    acceptedPartnerInvitationTopic: 'un invito partner è stato accettato',
    acceptedPartnerInvitation: 'L\'organizzazione {partnerName} ({email}) si è unita all\'organizzazione {orgName} come partner.',
    addMemberTopic: 'un membro è stato aggiunto',
    addMember: 'L\'utente {name} ({email}) si è unito all\'organizzazione {orgName}.'
  }
}
