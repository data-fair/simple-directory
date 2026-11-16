// WARN: do not use underscore in keys, it is used as delimiter when reading
// messages from environment variables

export default {
  root: {
    title: 'Simple Directory',
    description: 'Gestione semplificata di utenti e organizzazioni per architetture web moderne.'
  },
  common: {
    manageNotifications: 'Gestire le notifiche',
    home: 'Home',
    logLink: 'Accesso / registrazione',
    logout: 'Disconnettersi',
    login: 'Accedere',
    signin: 'Registrarsi',
    activateAdminMode: 'Attivare la modalità amministratore',
    deactivateAdminMode: 'Disattivare la modalità amministratore',
    documentation: 'Documentazione',
    administration: 'Amministrazione',
    myAccount: 'Informazioni personali',
    myOrganizations: 'Le mie organizzazioni',
    organization: 'Organizzazione',
    organizations: 'Organizzazioni',
    organizationName: 'Nome dell\'organizzazione',
    user: 'Utente',
    users: 'Utenti',
    createOrganization: "Creare un'organizzazione",
    dashboard: 'Dashboard',
    description: 'Descrizione',
    id: 'Identificativo',
    name: 'Nome',
    save: 'Salvare',
    send: 'Inviare',
    load: 'Caricare',
    active: 'Attivo',
    inactive: 'Inattivo',
    members: 'Membri',
    orgStorageMembers: 'Membri nell\'archivio secondario',
    role: 'Ruolo',
    search: 'Cercare',
    noResult: 'Nessun risultato',
    confirmOk: 'OK',
    confirmCancel: 'Annullare',
    confirmTitle: 'Conferma questa operazione?',
    firstName: 'Nome',
    lastName: 'Cognome',
    email: 'E-mail',
    modificationOk: 'La modifica è stata salvata.',
    invitations: 'Inviti',
    accept: 'Accettare',
    reject: 'Rifiutare',
    confirmDeleteTitle: 'Eliminare {name}',
    confirmDeleteMsg: 'Vuole davvero eliminare questa risorsa? I dati non potranno essere recuperati.',
    editTitle: 'Modificare {name}',
    seeTitle: 'Visualizzare {name}',
    loggedAt: 'Ultimo accesso',
    createdAt: 'Creato il',
    createdPhrase: 'Creato da {name} il {date}',
    host: 'Sito',
    sites: 'Siti',
    updatedAt: 'Aggiornato il',
    maxCreatedOrgs: 'Numero massimo di organizzazioni che è possibile creare',
    maxCreatedOrgsShort: 'Max org.',
    unlimited: 'illimitato',
    nbCreatedOrgs: 'Numero di organizzazioni create: {count}',
    maxCreatedOrgsValue: 'Numero massimo di organizzazioni che è possibile creare: {value}',
    back: 'Indietro',
    next: 'Avanti',
    password: 'Password',
    showPassword: 'Mostrare la password',
    hidePassword: 'Nascondere la password',
    passwordShown: 'La password è visibile',
    passwordHidden: 'La password è nascosta',
    checkInbox: 'Controlli la sua casella di posta',
    spamWarning: 'Se non ha ricevuto alcuna e-mail, verifichi che non sia stata classificata come spam nella sua casella di posta.',
    validate: 'Convalidare',
    delete: 'Eliminare',
    department: 'Dipartimento',
    departments: 'Dipartimenti',
    autoAdmin: 'Aggiungermi automaticamente come amministratore',
    asAdmin: 'Accedere come questo utente',
    transfer: 'Trasferire su un altro sito',
    delAsAdmin: 'Tornare alla sessione di amministratore',
    avatar: 'Avatar',
    birthday: 'Data di nascita',
    missingInfo: 'Informazioni mancanti',
    '2FA': 'Autenticazione a due fattori',
    userAccount: 'Account personale',
    continue: 'Continuare',
    tooLong: 'Testo troppo lungo',
    settings: 'impostazioni',
    emailConfirmed: 'Creazione completata',
    emailNotConfirmed: 'Creazione non completata',
    noRole: 'nessun ruolo',
    downloadCsv: 'Scaricare l\'elenco in formato CSV',
    authMode: 'Modalità di autenticazione',
    authProviders: 'Provider di autenticazione',
    partners: 'Organizzazioni partner',
    contactEmail: 'E-mail di contatto',
    orgName: 'Nome dell\'organizzazione',
    loginSignin: 'Accedere / creare un account',
    sort: 'Ordinare',
    all: 'tutti',
    creationStep: 'Fase di creazione',
    oauthTokens: 'Token OAuth',
    plannedDeletion: 'Eliminazione pianificata',
    plannedDeletionShort: 'Eliminazione',
    owner: 'Proprietario',
    passwordLists: 'Password',
    adminGlobal: 'Amministrazione globale',
    adminSite: 'Amministrazione del sito',
    no: 'No',
    yes: 'Sì',
    redirectSite: 'Sito di reindirizzamento',
    manageOrg: 'Gestione dell\'organizzazione',
    manageDep: 'Gestione del dipartimento'
  },
  doc: {
    about: {
      link: 'Informazioni'
    },
    install: {
      link: 'Installazione'
    },
    config: {
      link: 'Configurazione',
      i18nKey: 'Chiave nel file I18N',
      i18nVar: 'Variabile d\'ambiente',
      i18nVal: 'Valore',
      varKey: 'Chiave nel file di configurazione',
      varName: 'Variabile d\'ambiente',
      varDesc: 'Descrizione',
      varDefault: 'Valore predefinito',
      varDescriptions: {
        publicUrl: '<b>IMPORTANTE.</b> L\'URL a cui sarà esposto il servizio. Ad esempio https://koumoul.com/simple-directory',
        admins: '<b>IMPORTANTE.</b> L\'elenco degli indirizzi e-mail degli amministratori del servizio.',
        contact: '<b>IMPORTANTE.</b> L\'indirizzo e-mail di contatto per gli utenti del servizio.',
        theme: {
          logo: 'L\'URL del logo che sostituisce il logo predefinito di Simple Directory.',
          dark: 'Applica uno stile scuro all\'intero aspetto delle pagine.<br>I colori predefiniti sono più adatti a uno stile chiaro: se si passa allo stile scuro, sarà necessario modificare anche questi.',
          cssUrl: 'Link a un foglio di stile che completa le variabili di personalizzazione.<br>ATTENZIONE: la struttura HTML può cambiare da una versione all\'altra. Mantenere un foglio di stile esterno comporterà lavoro aggiuntivo a ogni aggiornamento.',
          cssText: 'Contenuto CSS grezzo che completa le variabili di personalizzazione.<br>ATTENZIONE: la struttura HTML può cambiare da una versione all\'altra. Mantenere un foglio di stile esterno comporterà lavoro aggiuntivo a ogni aggiornamento.'
        },
        secret: {
          public: '<b>IMPORTANTE.</b> Il percorso della chiave di firma RSA pubblica. Consultare la documentazione di installazione del servizio.',
          private: '<b>IMPORTANTE.</b> Il percorso della chiave di firma RSA privata. Consultare la documentazione di installazione del servizio.'
        },
        storage: {
          type: `<b>IMPORTANTE.</b> Il tipo di archiviazione per la persistenza di utenti e organizzazioni.<br>
Il tipo predefinito "file" è di sola lettura ed è adatto allo sviluppo/test o all'utilizzo di dati esportati da un altro sistema.<br>
Il tipo "mongo" richiede l'accesso a un'istanza MongoDB; è la scelta appropriata per la maggior parte delle installazioni in produzione.`,
          file: {
            users: 'Solo per storage.type=file. Il percorso del file JSON contenente le definizioni degli utenti',
            organizations: 'Solo per storage.type=file. Il percorso del file JSON contenente le definizioni delle organizzazioni'
          },
          mongo: {
            url: 'Solo per storage.type=mongo. La stringa di connessione completa al database MongoDB.'
          }
        },
        mails: {
          transport: '<b>IMPORTANTE.</b> Un oggetto di configurazione JSON per il trasporto delle e-mail, compatibile con la libreria <a href="https://nodemailer.com/smtp/">nodemailer</a>.',
          from: '<b>IMPORTANTE.</b> L\'indirizzo da utilizzare come mittente delle e-mail inviate dal servizio.'
        },
        listEntitiesMode: `Consente di limitare globalmente l'accesso agli elenchi di utenti e organizzazioni.<br>
Può valere 'anonymous', 'authenticated' o 'admin'.`,
        defaultLoginRedirect: 'Reindirizzamento predefinito dopo l\'accesso. Se non specificato, l\'utente viene reindirizzato alla pagina del suo profilo.',
        onlyCreateInvited: 'Se true, gli utenti non vengono creati al primo invio di e-mail. Devono essere invitati in un\'organizzazione.',
        tosUrl: '<b>IMPORTANTE.</b> L\'URL delle sue condizioni d\'uso. Se questo parametro è vuoto o non punta a una pagina web valida, rischia di non rispettare i suoi obblighi nei confronti degli utenti.'
      }
    },
    use: {
      link: 'Utilizzo'
    }
  },
  pages: {
    admin: {
      users: {
        noCreatedOrgsLimit: 'Gli utenti possono creare un numero illimitato di organizzazioni.',
        createdOrgsLimit: 'Per impostazione predefinita, gli utenti possono creare {defaultMaxCreatedOrgs} organizzazione. | Per impostazione predefinita, gli utenti possono creare {defaultMaxCreatedOrgs} organizzazioni.',
        explainLimit: 'Definire un valore per limitare il numero di organizzazioni che l\'utente può creare. -1 per un numero illimitato. Svuotare il campo per tornare al valore predefinito ({defaultMaxCreatedOrgs}).',
        editUserEmailTitle: 'Modificare l\'indirizzo e-mail dell\'utente {name}',
        editUserEmailText: 'Attenzione: l\'e-mail è una chiave importante dell\'utente. Modificandola si rischia di inserire un indirizzo errato, non funzionante o incoerente con altri dati. Questa funzione è disponibile solo per gli amministratori, per sbloccare un utente la cui casella di posta è diventata inaccessibile.',
        drop2FATitle: 'Reimpostare l\'autenticazione a due fattori dell\'utente {name}',
        transferTitle: 'Trasferire l\'utente {name} su un altro sito',
        transferText: 'L\'utente sarà associato al sito selezionato. Le sue identità SSO vengono reimpostate e mantiene le sue appartenenze alle organizzazioni. Gli account di superamministratore non possono essere trasferiti.',
        transferTargetSite: 'Sito di destinazione',
        transferMainSite: 'Sito principale',
        drop2FAExplain: 'Attenzione: questa operazione è riservata allo sblocco di un utente che ha perso sia il dispositivo sia il codice di recupero per l\'autenticazione a due fattori. Prima di continuare, si raccomanda vivamente di verificare in qualche modo l\'identità della persona che effettua la richiesta (ad esempio contattando un collega della stessa organizzazione).'
      },
      organizations: {
        limitOrganizationTitle: 'Modificare i limiti dell\'organizzazione',
        members: 'membro | membri',
        nbMembers: 'Numero massimo di membri (0 per nessun limite)'
      },
      sites: {
        createSite: 'Definire un nuovo sito',
        loginOnSite: 'Accedere al sito',
        colorWarnings: 'Avvisi di contrasto',
        mainSite: 'Sito principale'
      },
      passwordLists: {
        help1: 'È possibile caricare elenchi di password da file CSV. Queste password troppo note verranno poi rifiutate se gli utenti tentano di utilizzarle.',
        help2: 'È possibile trovare file di elenchi di password su internet, ad esempio nel progetto {secLists} o nel progetto {richelieu} per un elenco in francese.',
        newFile: 'Nuovo file di password (una password per riga)',
        subtitle: '{state} - {date} - {count} password | {state} - {date} - {count} password',
        confirmDelete: 'Eliminare questo elenco di password?'
      },
      site: {
        title: 'Configurazione del sito',
        oidcHelp: 'Fornire questo URL di callback di accesso ({url}) al provider di identità e definire gli scope "openid", "profile", "email".',
        samlHelp: 'Compilare il campo qui sotto con i metadati XML forniti dal provider di identità e fornirgli in cambio questo {link}.',
        samlHelpLink: 'link',
        mainSiteExplanation: 'Questo sito corrisponde al dominio principale del servizio. Il suo documento nel database gestisce solo la presentazione, e solo per le categorie elencate in MAIN_SITE_FROM_DB. L\'autenticazione, i provider di identità e l\'ambito degli account provengono sempre dalle variabili d\'ambiente.'
      }
    },
    contact: {
      title: 'Contattaci',
      from: 'Il suo indirizzo e-mail',
      subject: 'Oggetto',
      text: 'La sua richiesta',
      sent: 'La sua richiesta è stata inviata'
    },
    login: {
      title: 'Accedere',
      emailLabel: 'Il suo indirizzo e-mail',
      success: 'Riceverà un\'e-mail all\'indirizzo indicato. Apra il link contenuto in questa e-mail per completare l\'accesso.',
      maildevLink: 'Aprire la casella di posta di sviluppo',
      newPassword: 'Nuova password',
      newPassword2: 'Confermare la nuova password',
      changePassword: 'Rinnovare la password',
      changePasswordTooltip: 'Se ha dimenticato la password o deve cambiarla, la rinnovi.',
      newPasswordMsg: 'Inserisca due volte la nuova password.',
      changePasswordSent: 'È stata inviata un\'e-mail all\'indirizzo {email}. Questa e-mail contiene un link per modificare la password del suo account.',
      passwordlessMsg1: 'Per accedere basta un\'e-mail.',
      passwordlessMsg2: 'Inviare un\'e-mail di accesso.',
      passwordlessConfirmed: 'È stata inviata un\'e-mail all\'indirizzo {email}. Questa e-mail contiene un link per accedere alla piattaforma.',
      createUserMsg1: 'Se non ha mai effettuato l\'accesso alla nostra piattaforma, crei un account.',
      createUserMsg2: 'Creare un account',
      createUserInvit: 'Creare un account per accettare l\'invito nell\'organizzazione {name}',
      createUserOrganization: 'Vuole creare un\'organizzazione?',
      createUserOrganizationHelp: 'Se crea un\'organizzazione, potrà invitare altri utenti a unirsi a lei e condividere risorse.',
      tosMsg: 'Prima di creare un account, legga <a href="{tosUrl}" target="_blank">le nostre condizioni d\'uso</a>.',
      tosConfirm: 'Confermo di aver letto le condizioni d\'uso di questo sito.',
      createUserConfirm: 'Creare l\'account',
      createUserConfirmed: 'È stata inviata un\'e-mail all\'indirizzo {email}. Questa e-mail contiene un link per convalidare la creazione del suo account.',
      adminMode: 'Confermi la sua identità per passare alla modalità amministratore.',
      adminModePromptTitle: 'Modalità amministratore',
      adminModePromptMsg: 'Il suo account è un account di superamministratore. Vuole attivare la modalità amministratore per questa sessione?',
      adminModePromptAccept: 'Modalità amministratore',
      adminModePromptDecline: 'Sessione normale',
      oauth: 'Accedere con:',
      error: 'Errore',
      rememberMe: 'Ricordami',
      '2FACode': 'codice a 6 cifre o codice di recupero',
      '2FAInfo': 'Inserisca un codice di verifica per continuare. Può ottenere questo codice dall\'applicazione di verifica sul suo telefono. Se perde il dispositivo, può usare il codice di recupero scaricato durante la configurazione dell\'autenticazione a due fattori.',
      configure2FA: 'Configurare l\'autenticazione a due fattori',
      configure2FAQRCode: 'Codice QR per la configurazione dell\'autenticazione a due fattori',
      configure2FAQRCodeMsg: 'Scansioni questo codice QR con un\'applicazione di autenticazione a sua scelta (come Authy o Google Authenticator), quindi inserisca il codice a 6 cifre fornito dall\'applicazione.',
      configure2FACode: 'codice a 6 cifre',
      recovery2FA: 'Codice di recupero',
      recovery2FAInfo: 'Attenzione: conservi il codice di recupero qui sotto in un luogo sicuro. Senza di esso non potrà recuperare il suo account se perde il dispositivo su cui ha appena configurato l\'autenticazione a due fattori.',
      recovery2FACode: 'Codice di recupero: ',
      recovery2FADownload: 'Scaricare un file contenente il codice di recupero',
      recovery2FAContent: 'Codice di recupero per l\'autenticazione a due fattori {name}',
      plannedDeletion: 'Eliminazione pianificata',
      cancelDeletion: 'Annullare l\'eliminazione dell\'utente',
      siteLogo: 'Logo del sito',
      partnerInvitation: 'Invito come partner',
      changeHost: 'Account associato al back-office'
    },
    siteAdmin: {
      account: 'Account',
      '2FAActive': 'Autenticazione a due fattori attiva',
      plannedDeletion: 'Eliminazione pianificata il {date}',
      cancelDeletion: 'Annullare l\'eliminazione pianificata di {name}',
      revokeSessions: 'Disconnettere {name} da tutte le sessioni',
      confirmRevokeSessionsMsg: 'Tutte le sessioni di questo utente verranno chiuse. Le pagine già aperte restano utilizzabili per qualche minuto, finché il loro token di sessione non deve essere rinnovato.',
      confirmDeleteMsg: 'L\'account {email} verrà eliminato definitivamente e rimosso da tutte le organizzazioni di cui fa parte.'
    },
    oauthConsent: {
      title: '{client} vuole accedere al suo account',
      willBeAble: 'Questa applicazione potrà:',
      redirectHost: 'Verrà poi reindirizzato a {host}.',
      account: 'Account da utilizzare',
      personalAccount: 'Account personale',
      organizationAccount: 'Organizzazione',
      allow: 'Consentire',
      deny: 'Negare',
      broadScope: 'Accesso esteso',
      unverifiedTitle: 'Applicazione non verificata',
      unverifiedCimd: '{client} non è un\'applicazione verificata. Si è identificata con l\'indirizzo {url}; nessuno l\'ha controllata.',
      unverifiedDcr: '{client} non è un\'applicazione verificata. È stata registrata automaticamente; nessuno ha controllato la sua identità.',
      resourceMcp: 'Chiede l\'accesso al server MCP di questa piattaforma.',
      resourceApi: 'Chiede l\'accesso all\'API di questa piattaforma.',
      noOrganization: 'Non è amministratore di alcuna organizzazione che possa autorizzare questa applicazione.',
      organization: 'Organizzazione',
      nhi: 'Identità dell\'applicazione',
      nhiHint: 'Gli account di servizio dell\'organizzazione, gestiti dai suoi amministratori nella pagina dell\'organizzazione.',
      noNhi: 'Questa organizzazione non ha alcun account di servizio utilizzabile da questa applicazione (i cui ambiti coprano almeno una delle autorizzazioni richieste). Gli account di servizio sono gestiti dagli amministratori nella pagina dell\'organizzazione.',
      manageNhis: 'Gestire gli account di servizio',
      permissions: 'Autorizzazioni concesse',
      lifetime: 'Durata dell\'autorizzazione',
      lifetime1d: '1 giorno',
      lifetime7d: '7 giorni',
      lifetime30d: '30 giorni',
      lifetime90d: '90 giorni',
      lifetime1y: '1 anno',
      errorTitle: 'Autorizzazione impossibile',
      errors: {
        interactionExpired: 'La richiesta di autorizzazione è scaduta o è già stata gestita. Torni all\'applicazione e riprovi.',
        unauthorized: 'La sua sessione è scaduta o non ha effettuato l\'accesso. Acceda di nuovo, quindi ricominci dall\'applicazione.',
        forbidden: 'La sua sessione non può concedere questa autorizzazione.',
        generic: 'La richiesta di autorizzazione non è riuscita (codice: {code}).'
      }
    },
    organization: {
      addMember: 'Invitare un utente a unirsi all\'organizzazione',
      disableInvite: 'Questa organizzazione ha già raggiunto il numero massimo di membri.',
      deleteMember: 'Rimuovere questo utente dall\'elenco dei membri',
      editMember: 'Modificare il ruolo di questo utente nell\'organizzazione',
      memberReadOnly: 'L\'appartenenza di questo utente all\'organizzazione proviene da un provider di identità e non può essere modificata qui.',
      confirmEditMemberTitle: 'Modificare {name}',
      confirmDeleteMemberTitle: 'Escludere {name}',
      confirmDeleteMemberMsg: 'Vuole davvero rimuovere questo utente dall\'elenco dei membri dell\'organizzazione {org}?',
      deleteMemberSelfWarning: 'Si tratta della sua appartenenza: potrebbe perdere l\'accesso a questa organizzazione e alle sue risorse, senza poter annullare lei stesso questa modifica.',
      editMemberSelfWarning: 'Sta modificando il suo ruolo: potrebbe perdere i diritti di amministrazione su questa organizzazione, senza poter annullare lei stesso questa modifica.',
      deleteMemberLastAdmin: 'È l\'ultimo amministratore di questa organizzazione: nomini un altro amministratore prima di lasciarla.',
      deleteMemberLastMember: 'È l\'ultimo membro di questa organizzazione e non può lasciarla. Se non viene più utilizzata, deve essere eliminata.',
      editMemberLastAdmin: 'È l\'ultimo amministratore di questa organizzazione: nomini un altro amministratore prima di cambiare il suo ruolo.',
      deleteMemberSuccess: 'L\'utente {name} è stato escluso dall\'organizzazione',
      inviteEmail: 'Indirizzo e-mail dell\'utente',
      inviteSuccess: 'È stato inviato un invito all\'indirizzo {email}',
      invitePartnerSuccess: 'È stato inviato un invito all\'indirizzo {email}',
      memberConflict: 'Questo utente è già membro',
      departmentLabelTitle: 'Etichetta per il concetto di "dipartimento"',
      departmentLabelHelp: 'Lasciare vuoto per visualizzare "{defaultDepartmentLabel}". Compilare per utilizzare un altro termine, come "servizio", "agenzia" ecc.',
      addDepartment: 'Creare {departmentLabel}',
      editDepartment: 'Modificare {departmentLabel}',
      deleteDepartment: 'Eliminare {departmentLabel}',
      confirmEditDepartmentTitle: 'Modificare {name}',
      confirmDeleteDepartmentTitle: 'Eliminare {name}',
      confirmDeleteDepartmentMsg: 'Vuole davvero eliminare {name} dalla sua organizzazione?',
      deleteDepartmentHasMembers: 'Questo dipartimento è assegnato a {count} membro dell\'organizzazione. Non è possibile eliminarlo in questo stato. | Questo dipartimento è assegnato a {count} membri dell\'organizzazione. Non è possibile eliminarlo in questo stato.',
      departmentIdInvalid: 'L\'identificativo deve contenere solo lettere, cifre e spazi.',
      inviteLink: 'In caso di problemi con l\'invio delle e-mail, è possibile trasmettere il link di conferma qui sotto con un altro mezzo. Attenzione: si rischia di inserire nel database degli utenti un indirizzo e-mail errato o non funzionante, che potrebbe causare diversi problemi in seguito (cambio della password, invio di avvisi ecc.).',
      '2FARoles': 'Autenticazione a due fattori.',
      '2FARolesMsg': 'Rendere obbligatoria l\'autenticazione a due fattori per gli utenti con questi ruoli.',
      sendInvitationLink: 'Inviare un altro link di invito',
      addPartner: 'Invitare un\'organizzazione partner',
      deletePartner: 'Eliminare questo partner',
      depSortCreation: 'Creati più di recente',
      depSortAlpha: 'Ordine alfabetico',
      deletePartnerWarning: 'Le autorizzazioni concesse a questa organizzazione sulle sue risorse verranno revocate.',
      partnerInvitationExpired: 'invito scaduto',
      partnersQuotaHelp: 'Gli inviti in sospeso rientrano nella quota, tranne quelli scaduti.',
      partnersQuotaPending: '{count} invito in sospeso occupa un posto: lo elimini per liberarlo o attenda che scada. | {count} inviti in sospeso occupano un posto: ne elimini uno per liberarlo o attenda che scada.',
      fromCache: 'Ultima sincronizzazione di questo elenco con il provider di identità: {fromNow}.',
      roleLabel: 'Etichetta del ruolo "{role}"',
      infoTitle: 'Informazioni',
      siteUsersTitle: 'Account del sito',
      siteUsersHelp: 'Account creati su questo sito, il sito principale dell\'organizzazione. In qualità di amministratore dell\'organizzazione, può reimpostare la loro autenticazione a due fattori, annullare un\'eliminazione pianificata, chiudere le loro sessioni o eliminarli.',
      nhisTitle: 'Account di servizio (identità non umane)',
      nhisHelp: 'Gli account di servizio sono le identità non umane dell\'organizzazione. Si autenticano con un token rilasciato da un provider di identità affidabile (ad esempio un cluster Kubernetes), oppure fanno da identità alle applicazioni OAuth (ad esempio un agente IA) che un amministratore vi collega. Non hanno un\'e-mail e le loro sessioni sono di breve durata.',
      addNhi: 'Creare un account di servizio',
      editNhi: 'Modificare l\'account di servizio',
      deleteNhi: 'Eliminare l\'account di servizio',
      confirmDeleteNhiTitle: 'Eliminare l\'account di servizio {name}',
      confirmDeleteNhiMsg: 'Vuole davvero eliminare questo account di servizio? I token in corso smetteranno di funzionare una volta scaduti.',
      nhiIssuer: 'Emittente del token',
      nhiSubject: 'Soggetto',
      nhiKeyBindingHint: 'Lasciare vuoti l\'emittente e il soggetto per un account di servizio usato solo da applicazioni OAuth.',
      nhiOauthOnly: 'Solo connessioni OAuth',
      nhiConnections: 'Connessioni OAuth',
      nhiConnectionsCount: '{count} connessione | {count} connessioni',
      nhiConnectionLastUsed: 'ultimo utilizzo il {date}',
      nhiConnectionNeverUsed: 'mai utilizzata',
      nhiConnectionExpires: 'scade il {date}',
      revokeNhiConnections: 'Revocare le connessioni',
      revokeNhiConnectionsTitle: 'Revocare le connessioni di {name}',
      revokeNhiConnectionsWarning: 'Il client non potrà più agire con questo account di servizio. I token di accesso già emessi restano validi fino a {duration}.',
      nhiAllowedIps: 'Indirizzi autorizzati (facoltativo)',
      nhiAllowedIpsHint: 'Indirizzi o sottoreti CIDR da cui è accettato lo scambio di token, ad esempio 203.0.113.5 o 10.4.0.0/16. Lasciare vuoto per accettare qualsiasi indirizzo.',
      nhiIpBinding: "Vincolare la sessione all'indirizzo da cui è stata ottenuta",
      nhiIpBindingHint: 'Un token trafugato diventa inutilizzabile altrove. Attivare solo se questo account di servizio chiama sempre da un indirizzo stabile: un indirizzo di uscita variabile (pool NAT, dual-stack) interromperebbe le sue sessioni.',
      nhiScopes: 'Ambiti (facoltativo)',
      nhiScopesHint: 'Le autorizzazioni di questo account di servizio, ad esempio datasets:read o datasets. Lasciare vuoto per un account senza restrizioni che agisce con tutti i diritti del suo ruolo.',
      nhiUnrestricted: 'Accesso senza restrizioni (tutti i diritti del suo ruolo)',
      nhiJwks: 'JWKS (facoltativo, se il provider non è raggiungibile pubblicamente)',
      nhiClientId: 'Identificativo client (client_id)',
      nhiJwksInvalid: 'JSON non valido per il JWKS: {message}'
    },
    invitation: {
      title: 'Invito convalidato',
      msgSameUser: 'Il suo invito a diventare membro di un\'organizzazione è stato convalidato. Può consultare <a href="{profileUrl}">il suo profilo</a>.',
      msgDifferentUser: 'L\'invito a diventare membro di un\'organizzazione è stato convalidato. Può <a href="{loginUrl}">accedere</a> con l\'account invitato.'
    },
    avatar: {
      changeUser: 'Modificare l\'avatar del suo account',
      changeOrganization: 'Modificare l\'avatar dell\'organizzazione',
      changeDepartment: 'Modificare l\'avatar di "{departmentName}"',
      reset: 'Ripristinare l\'avatar predefinito'
    },
    me: {
      emailNotEditable: 'Questo indirizzo non può essere modificato.',
      noOrganization: 'Non è membro di alcuna organizzazione.',
      operations: 'Operazioni sensibili',
      deleteMyself: 'Eliminare questo account',
      deleteMyselfAlert: 'Se elimina il suo account, avrà {plannedDeletionDelay} giorni per annullare l\'operazione; trascorso questo termine, tutti i dati associati verranno eliminati e non potranno essere recuperati.',
      deleteMyselfCheck: 'Selezioni questa casella e faccia clic su OK per confermare l\'eliminazione dell\'utente {name} e di tutti i suoi dati.',
      accountChanges: 'Cambio di account',
      defaultOrg: 'Attivare questo account per impostazione predefinita dopo ogni accesso',
      ignorePersonalAccount: 'Selezioni questa casella se non desidera utilizzare questa piattaforma al di fuori di un account di organizzazione',
      sessions: 'Le sue sessioni',
      deleteSession: 'Eliminare la sessione su {deviceName}?',
      deleteSessionWarning: 'L\'eliminazione di una sessione può richiedere fino a {duration} per essere applicata completamente.',
      settings: 'Le sue impostazioni',
      connectedApplications: 'Applicazioni collegate',
      revokeApplication: 'Revocare l\'accesso',
      revokeApplicationTitle: 'Revocare l\'accesso di {name}?',
      revokeApplicationWarning: 'L\'applicazione non potrà più utilizzare il suo account. I token di accesso già emessi restano validi fino a {duration}.',
      applicationGrantedOn: 'Autorizzata il {date}',
      applicationLastUsed: 'ultimo utilizzo il {date}',
      applicationNeverUsed: 'mai utilizzata',
      applicationExpires: 'scade il {date}',
      applicationPersonalAccount: 'Account personale'
    },
    colorsPreview: {
      title: 'Anteprima della resa dei colori',
      cardTitle: 'Una scheda di esempio',
      cardText: 'Utilizza il colore "surface".'
    },
    partnerInvitation: {
      msg1: 'L\'organizzazione {name} desidera aggiungere {partnerName} come partner, con {email} come indirizzo di contatto.',
      msg2: 'Il nome "{partnerName}" è indicativo e non corrisponde necessariamente alla denominazione esatta della sua organizzazione.',
      diffEmail: 'Ha effettuato l\'accesso con l\'account utente {userName} ({userEmail}). Può accedere con un altro account o crearne uno nuovo facendo clic sul pulsante qui sotto.',
      noUser1: 'Ha già un account? Può accedere e verrà poi reindirizzato a questa pagina.',
      noUser2: 'Non ha ancora un account? Può crearne uno e verrà poi reindirizzato a questa pagina.',
      noOrg: 'Non è membro di alcuna organizzazione. Può creare una nuova organizzazione e accettare l\'invito a suo nome.',
      org: 'Può accettare questo invito a nome di un\'organizzazione di cui è amministratore, oppure creare una nuova organizzazione e accettare l\'invito a suo nome.',
      createOrg: 'Creare una nuova organizzazione',
      newOrgName: 'Nome della nuova organizzazione',
      create: 'Creare',
      acceptAs: 'Accettare a nome di {name}'
    },
    changeHost: {
      msg1: 'L\'account {email} non esiste su {host} ma esiste su {mainHost}.',
      sso1: 'Soluzione: utilizzare {mainHost} per accedere',
      sso2: 'La pagina di accesso propone un pulsante per accedere da {mainHost}, che può utilizzare. Può anche utilizzare <a class="text-primary" href="{mainHostLogin}">questo link</a>.',
      solution1: 'Soluzione: spostare l\'account su {host}',
      solution2: 'Se sceglie questa soluzione, perderà la possibilità di accedere a {mainHost}.',
      confirmMigration: 'Spostare l\'account su {host} e perdere l\'accesso a {mainHost}'
    },
    orgStorage: {
      activate: 'Attivare l\'archivio secondario degli utenti',
      link: 'Link di connessione per utilizzare questo archivio secondario',
      ldap: 'Configurazione LDAP'
    }
  },
  errors: {
    badEmail: 'L\'indirizzo e-mail è vuoto o non valido.',
    badProviderInvitEmail: 'L\'indirizzo e-mail che ha appena utilizzato per accedere non corrisponde a quello dell\'invito ricevuto',
    maxCreatedOrgs: 'L\'utente non può creare altre organizzazioni. Limite raggiunto.',
    permissionDenied: 'Autorizzazioni insufficienti.',
    nonEmptyOrganization: 'È necessario rimuovere gli altri membri da questa organizzazione',
    userUnknown: 'Utente sconosciuto.',
    orgaUnknown: 'Organizzazione sconosciuta.',
    invitationConflict: 'Questo utente è già membro dell\'organizzazione.',
    unknownRole: 'Il ruolo {role} è sconosciuto.',
    serviceUnavailable: 'Servizio non disponibile per manutenzione.',
    badCredentials: 'Indirizzo e-mail o password non validi.',
    updatePassword: 'È necessario aggiornare la password, perché non viene modificata da troppo tempo, in conformità con le nostre politiche di sicurezza.',
    missingToken: 'Il parametro id_token è mancante.',
    invalidToken: 'Il token non è valido. Potrebbe essere scaduto.',
    differentPasswords: 'Le password non corrispondono',
    noPasswordless: 'Questo servizio non accetta l\'autenticazione senza password.',
    rateLimitAuth: 'Troppi tentativi in un breve intervallo. Attenda prima di riprovare.',
    invalidInvitationToken: 'Il link di invito ricevuto non è valido.',
    expiredInvitationToken: 'Il link di invito ricevuto è scaduto; non è più possibile accettare questo invito.',
    maxNbMembers: 'L\'organizzazione contiene già il numero massimo di membri consentito dalle sue quote.',
    maxNbDepartments: 'L\'organizzazione contiene già il numero massimo di dipartimenti consentito dalle sue quote.',
    maxNbPartners: 'L\'organizzazione ha già il numero massimo di partner consentito dalle sue quote, inclusi gli inviti in sospeso non scaduti.',
    unknownOAuthProvider: 'Autenticazione OAuth non supportata.',
    unknownSAMLProvider: 'Autenticazione SAML non supportata.',
    adminModeOnly: 'Funzionalità riservata ai superamministratori.',
    adminChangeHostBlocked: 'I superamministratori non possono trasferire il loro account su un sito secondario. Acceda dal sito principale.',
    emailNotConfirmed: 'Il suo indirizzo e-mail non è ancora stato confermato. Le è appena stato inviato un nuovo link di conferma: lo apra per attivare il suo account.',
    '2FANotConfigured': 'L\'autenticazione a due fattori è obbligatoria per questo account e non è ancora configurata.',
    passwordless2FA: 'L\'autenticazione senza password è incompatibile con l\'autenticazione a due fattori richiesta per questo account.',
    bad2FAToken: 'Codice di verifica non valido o scaduto per l\'autenticazione a due fattori',
    plannedDeletion: 'L\'eliminazione dell\'utente {name} e di tutti i suoi dati è pianificata per il {plannedDeletion}.',
    onlyCreateInvited: 'Non è possibile creare un account direttamente. È necessario essere invitati da un\'organizzazione.',
    badIDPQuery: 'Richiesta considerata non valida dal provider di identità.',
    badIDPResponse: 'Risposta non valida dal provider di identità, provi ad accedere di nuovo.',
    duplicateDep: 'Il nuovo dipartimento è un duplicato',
    passwordEntropy: 'La password non è abbastanza sicura.',
    passwordMinLength: 'La password deve contenere almeno {minLength} caratteri.',
    passwordMinCharClasses: 'La password deve contenere almeno {minCharClasses} tipi di caratteri diversi (minuscole, maiuscole, cifre, caratteri speciali).',
    forbiddenPassword: 'Questa password è presente in un elenco di password note e non può essere utilizzata.',
    samePassword: 'La nuova password deve essere diversa da quella precedente.',
    conflict2FA: 'L\'autenticazione a due fattori è già configurata per questo account.',
    oauthNoEmail: 'Accesso rifiutato: il provider di identità non ha trasmesso alcun indirizzo e-mail.',
    oauthEmailNotVerified: 'Accesso rifiutato: il provider di identità non indica questo indirizzo e-mail come verificato.',
    githubNoVerifiedEmail: 'Accesso rifiutato: nell\'account GitHub non è stato trovato alcun indirizzo e-mail principale verificato.',
    facebookDisabled: 'L\'accesso con Facebook è disattivato: Facebook non indica se l\'indirizzo e-mail è stato verificato.',
    partnerInvitationMismatch: 'Questa richiesta non corrisponde all\'invito inviato.',
    partnerConflict: 'Questa organizzazione è già partner.',
    noPendingPartnerInvitation: 'Nessun invito è in attesa di convalida.',
    memberOfParentOrg: 'Questo utente è membro dell\'organizzazione principale, non può essere aggiunto a un dipartimento.',
    memberOfDepartment: 'Questo utente è membro di un dipartimento, non può essere aggiunto all\'organizzazione principale.',
    departmentUnknown: 'Dipartimento sconosciuto.',
    unknownOrgRole: 'Il ruolo {role} è sconosciuto nell\'organizzazione {org}.',
    missingDepartmentAttribute: 'Il provider di identità non ha trasmesso l\'attributo di dipartimento, che è obbligatorio.',
    otherCoreIdProvider: 'Questo utente è già collegato a un altro provider di identità principale.',
    authOnlyOtherSiteChain: 'Impossibile usare il sito {host} come riferimento per l\'autenticazione: anch\'esso è configurato per autenticarsi solo su un altro sito.',
    spamSuspected: 'Messaggio rifiutato: l\'attività somiglia a quella di un bot di spam.',
    rateLimitMessages: 'Troppi messaggi in un breve intervallo. Attenda prima di riprovare.'
  },
  mails: {
    // the message forwarded by the contact form
    contact: {
      intro: 'Messaggio inviato tramite il modulo di contatto di {site} da {from}'
    },
    creation: {
      subject: 'Benvenuto su {host}',
      text: `
È stata effettuata da {host} una richiesta di creazione di un account per questo indirizzo e-mail. Per attivare l'account, copi l'URL qui sotto nella barra degli indirizzi del suo browser. Questo URL è valido per 15 minuti.

{link}

Se riscontra un problema con il suo account o se non ha richiesto la creazione di un account su {host}, non esiti a contattarci all'indirizzo {contact}.
      `,
      htmlMsg: 'È stata effettuata da <a href="{origin}">{host}</a> una richiesta di creazione di un account per questo indirizzo e-mail. Per confermarla, faccia clic sul pulsante qui sotto. Il link è valido per 15 minuti.',
      htmlButton: 'Confermare la creazione dell\'account',
      htmlAlternativeLink: 'Se il pulsante qui sopra non funziona, può copiare questo link nella barra degli indirizzi del suo browser:',
      htmlCaption: 'Se riscontra un problema con il suo account o se non ha richiesto la creazione di un account su <a href="{origin}">{host}</a>, non esiti a contattarci all\'indirizzo <a href="mailto:{contact}">{contact}</a>.'
    },
    login: {
      subject: 'Accesso a {host}',
      text: `
È stata effettuata una richiesta di accesso da {host}. Per confermarla, copi l'URL qui sotto nella barra degli indirizzi del suo browser. Questo URL è valido per 15 minuti.

{link}

Se riscontra un problema con il suo account o se non ha richiesto di accedere a {host}, non esiti a contattarci all'indirizzo {contact}.
      `,
      htmlMsg: 'È stata effettuata una richiesta di accesso da <a href="{origin}">{host}</a>. Per confermarla, faccia clic sul pulsante qui sotto. Il link è valido per 15 minuti.',
      htmlButton: 'Accedere a {host}',
      htmlAlternativeLink: 'Se il pulsante qui sopra non funziona, può copiare questo link nella barra degli indirizzi del suo browser:',
      htmlCaption: 'Se riscontra un problema con il suo account o se non ha richiesto di accedere a <a href="{origin}">{host}</a>, non esiti a contattarci all\'indirizzo <a href="mailto:{contact}">{contact}</a>.'
    },
    noCreation: {
      subject: 'Autenticazione non riuscita su {host}',
      text: `
È stata effettuata una richiesta di accesso da {host}, ma è stata rifiutata perché questo indirizzo e-mail è sconosciuto o non è stato convalidato.

Non esiti a contattarci all'indirizzo {contact}.
      `,
      htmlMsg: 'È stata effettuata una richiesta di accesso da <a href="{origin}">{host}</a>, ma è stata rifiutata perché questo indirizzo e-mail è sconosciuto o non è stato convalidato.',
      htmlCaption: 'Non esiti a contattarci all\'indirizzo <a href="mailto:{contact}">{contact}</a>.'
    },
    conflict: {
      subject: 'Creazione dell\'account non riuscita su {host}',
      text: `
È stata effettuata da {host} una richiesta di creazione di un account, ma è stata rifiutata perché questo indirizzo e-mail è già associato a un account.

Non esiti a contattarci all'indirizzo {contact}.
      `,
      htmlMsg: 'È stata effettuata da <a href="{origin}">{host}</a> una richiesta di creazione di un account, ma è stata rifiutata perché questo indirizzo e-mail è già associato a un account.',
      htmlCaption: 'Non esiti a contattarci all\'indirizzo <a href="mailto:{contact}">{contact}</a>.'
    },
    invitation: {
      subject: 'Si unisca all\'organizzazione {organization} su {host}',
      text: `
Un amministratore dell'organizzazione {organization} la invita a unirsi a essa. Per accettare l'invito, copi l'URL qui sotto nella barra degli indirizzi del suo browser. Questo URL è valido per 10 giorni.

{link}

Se riscontra un problema con il suo account o se ritiene sospetto questo invito, non esiti a contattarci all'indirizzo {contact}.
      `,
      htmlMsg: `
Un amministratore dell'organizzazione {organization} la invita a unirsi a essa. Per accettare l'invito, faccia clic sul pulsante qui sotto. Il link è valido per 10 giorni.
      `,
      htmlButton: 'Accettare l\'invito',
      htmlAlternativeLink: 'Se il pulsante qui sopra non funziona, può copiare questo link nella barra degli indirizzi del suo browser:',
      htmlCaption: 'Se riscontra un problema con il suo account o se ritiene sospetto questo invito, non esiti a contattarci all\'indirizzo <a href="mailto:{contact}">{contact}</a>.'
    },
    invitationSecondary: {
      subject: 'Si unisca all\'organizzazione {organization} su {host}',
      text: `
Un amministratore dell'organizzazione {organization} la invita a unirsi a essa su {host} per accedere a {secondaryHost}. Per accettare l'invito, copi l'URL qui sotto nella barra degli indirizzi del suo browser. Questo URL è valido per 10 giorni.

{link}

Se riscontra un problema con il suo account o se ritiene sospetto questo invito, non esiti a contattarci all'indirizzo {contact}.
      `,
      htmlMsg: `
Un amministratore dell'organizzazione {organization} la invita a unirsi a essa su {host} per accedere a <b>{secondaryHost}</b>. Per accettare l'invito, faccia clic sul pulsante qui sotto. Il link è valido per 10 giorni.
      `,
      htmlButton: 'Accettare l\'invito',
      htmlAlternativeLink: 'Se il pulsante qui sopra non funziona, può copiare questo link nella barra degli indirizzi del suo browser:',
      htmlCaption: 'Se riscontra un problema con il suo account o se ritiene sospetto questo invito, non esiti a contattarci all\'indirizzo <a href="mailto:{contact}">{contact}</a>.'
    },
    partnerInvitation: {
      subject: 'L\'organizzazione {organization} su {host} desidera aggiungere {partner} come partner',
      text: `
Un amministratore dell'organizzazione {organization} la invita, in qualità di contatto dell'organizzazione {partner}, a unirsi a essa su {host}. Per accettare l'invito, copi l'URL qui sotto nella barra degli indirizzi del suo browser. Questo URL è valido per 10 giorni.

{link}

Se riscontra un problema con il suo account o se ritiene sospetto questo invito, non esiti a contattarci all'indirizzo {contact}.
      `,
      htmlMsg: `
Un amministratore dell'organizzazione {organization} la invita, in qualità di contatto dell'organizzazione {partner}, a unirsi a essa su {host}. Per accettare l'invito, faccia clic sul pulsante qui sotto. Il link è valido per 10 giorni.
      `,
      htmlButton: 'Accettare l\'invito',
      htmlAlternativeLink: 'Se il pulsante qui sopra non funziona, può copiare questo link nella barra degli indirizzi del suo browser:',
      htmlCaption: 'Se riscontra un problema con il suo account o se ritiene sospetto questo invito, non esiti a contattarci all\'indirizzo <a href="mailto:{contact}">{contact}</a>.'
    },
    action: {
      subject: 'Eseguire un\'azione sul suo account su {host}',
      text: `
Su questo indirizzo è stata avviata un'azione che richiede una conferma via e-mail. Per convalidare l'azione, copi l'URL qui sotto nella barra degli indirizzi del suo browser. Questo URL è valido per 15 minuti.

{link}

Se riscontra un problema con il suo account o se ritiene sospetto questo messaggio, non esiti a contattarci all'indirizzo {contact}.
      `,
      htmlMsg: `
Su questo indirizzo è stata avviata un'azione che richiede una conferma via e-mail. Per convalidare l'azione, faccia clic sul pulsante qui sotto. Il link è valido per 15 minuti.
      `,
      htmlButton: 'Convalidare',
      htmlAlternativeLink: 'Se il pulsante qui sopra non funziona, può copiare questo link nella barra degli indirizzi del suo browser:',
      htmlCaption: 'Se riscontra un problema con il suo account o se ritiene sospetto questo messaggio, non esiti a contattarci all\'indirizzo <a href="mailto:{contact}">{contact}</a>.'
    },
    plannedDeletion: {
      subject: 'Eliminazione dell\'account pianificata su {host}',
      text: `
L'utente {user} e tutti i dati a esso associati verranno eliminati definitivamente il {plannedDeletion}. {cause}

Per annullare l'eliminazione, può accedere con questo link: {link}.

Non esiti a contattarci all'indirizzo {contact}.
      `,
      htmlMsg: 'L\'utente {user} e tutti i dati a esso associati verranno eliminati definitivamente il {plannedDeletion}. {cause}',
      htmlButton: 'Accedere per annullare l\'eliminazione',
      htmlAlternativeLink: 'Se il pulsante qui sopra non funziona, può copiare questo link nella barra degli indirizzi del suo browser:',
      htmlCaption: 'Non esiti a contattarci all\'indirizzo <a href="mailto:{contact}">{contact}</a>.',
      causeInactivity: 'Questa operazione è stata avviata automaticamente perché questo account è inattivo dal {date}.'
    }
  },
  notifications: {
    sentInvitationTopic: 'un invito è stato inviato',
    sentInvitation: 'È stata inviata un\'e-mail a {email} con un invito a unirsi all\'organizzazione {orgName}.',
    acceptedInvitationTopic: 'un invito è stato accettato',
    acceptedInvitation: 'L\'utente {name} ({email}) si è unito all\'organizzazione {orgName}.',
    userCreated: 'L\'utente {name} ({email}) si è registrato sul sito {host}.',
    userCreatedOrg: 'L\'utente {name} ({email}) si è registrato sul sito {host} nell\'organizzazione {orgName}.',
    sentPartnerInvitationTopic: 'un invito come partner è stato inviato',
    sentPartnerInvitation: 'È stata inviata un\'e-mail a {email} con un invito per l\'organizzazione {partnerName} a unirsi all\'organizzazione {orgName} come partner.',
    acceptedPartnerInvitationTopic: 'un invito come partner è stato accettato',
    acceptedPartnerInvitation: 'L\'organizzazione {partnerName} ({email}) si è unita all\'organizzazione {orgName} come partner.',
    addMemberTopic: 'un membro è stato aggiunto',
    addMember: 'L\'utente {name} ({email}) si è unito all\'organizzazione {orgName}.'
  },
  // server-side only (not in publicMessages): reported through
  // mainSiteWarnings on the sites API and by the boot check
  mainSite: {
    ignoredField: 'Il campo "{field}" viene ignorato sul sito principale: questa configurazione proviene dalle variabili d\'ambiente.',
    ignoredCategory: 'Il valore salvato per "{category}" viene ignorato: MAIN_SITE_FROM_DB non contiene questa categoria.'
  },
  // server-side only: simple-directory's own scopes, merged with the platform scopes
  scopes: {
    organizations: 'Tutti gli ambiti delle organizzazioni',
    'organizations:read': 'Leggere le organizzazioni, i loro ruoli e i loro membri',
    'all:read': 'Leggere tutto ciò che il ruolo consente, su tutti i servizi',
    'all:write': 'Leggere e modificare tutto ciò che il ruolo consente, su tutti i servizi',
    'all:admin': 'Tutti i diritti che il ruolo consente, su tutti i servizi'
  }
}
