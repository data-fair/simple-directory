// WARN: do not use underscore in keys, it is used as delimiter when reading
// messages from environment variables

module.exports = {
  root: {
    title: 'Simple Directory',
    description: 'Vereinfachte Verwaltung Ihrer Benutzer und Organisationen in einer modernen weborientierten Architektur.'
  },
  common: {
    home: 'Startseite',
    logLink: `Anmelden / Registrieren`,
    logout: 'Abmelden',
    login: 'Anmeldung',
    activateAdminMode: 'Aktivierungsmodus admin',
    deactivateAdminMode: 'Admin-Modus deaktivieren',
    documentation: 'Dokumentation',
    administration: 'Verwaltung',
    myAccount: 'Mein Konto',
    myOrganizations: 'Meine Organisationen',
    organization: 'Organisation',
    organizations: 'Organisationen',
    user: 'Nutzer',
    users: 'Benutzer',
    createOrganization: 'Erstellen einer Organisation',
    dashboard: 'Instrumententafel',
    description: 'Beschreibung',
    id: 'Nutzername',
    name: 'Name',
    save: 'Aufzeichnung',
    members: 'Mitglieder',
    role: 'Rolle',
    search: 'Suche',
    confirmOk: 'Ok',
    confirmCancel: 'Abbrechen',
    firstName: 'Vorname',
    lastName: 'Nachname',
    email: 'E-Mail-Adresse',
    modificationOk: 'Ihre Änderung wurde übernommen.',
    invitations: 'Einladungen',
    accept: 'Akzeptieren Sie',
    reject: 'ablehnen',
    confirmDeleteTitle: 'Löschen {name}',
    confirmDeleteMsg: 'Sind Sie sicher, dass Sie diese Ressource löschen möchten? Seien Sie vorsichtig, die Daten sind nicht wiederherstellbar.',
    editTitle: 'Bearbeiten {name}',
    loggedAt: 'Letzte Anmeldung',
    createdAt: 'Erstellt am',
    createdPhrase: 'Erstellt von {name} am {date}',
    updatedAt: 'Aktualisiert am',
    maxCreatedOrgs: `Maximale Anzahl der zu gründenden Organisationen`,
    nbCreatedOrgs: `Anzahl der erstellten Organisationen :`,
    back: 'Zurück',
    next: 'Nächste',
    password: 'Kennwort',
    checkInbox: 'Überprüfen Sie Ihre Mailbox',
    spamWarning: `Wenn Sie eine E-Mail nicht erhalten haben, überprüfen Sie, ob sie nicht automatisch als Spam klassifiziert wurde.`,
    validate: 'Validieren Sie',
    department: 'Abteilung',
    departments: 'Abteilungen',
    autoAdmin: `Mich automatisch als Administrator hinzufügen`,
    asAdmin: 'Anmeldung als dieser Benutzer',
    delAsAdmin: 'Zurück zu meiner Administratorsitzung',
    avatar: 'Avatar',
    birthday: 'Geburtstag',
    missingInfo: 'Fehlende Informationen'
  },
  doc: {
    about: {
      link: 'Über uns'
    },
    install: {
      link: 'Installation'
    },
    config: {
      link: 'Konfiguration',
      i18nKey: 'Schlüssel in der I18N-Datei',
      i18nVar: `Umgebungsvariable`,
      i18nVal: 'Wert',
      varKey: 'Schlüssel in der Konfigurationsdatei',
      varName: `Umgebungsvariable`,
      varDesc: 'Beschreibung',
      varDefault: 'Standardwert',
      varDescriptions: {
        publicUrl: `<b>WICHTIG.</b> Die URL, der der Dienst ausgesetzt wird. Zum Beispiel https://koumoul.com/simple-directory`,
        admins: `<b>WICHTIG.</b> Die Liste der E-Mail-Adressen der Administratoren des Dienstes.`,
        contact: `<b>WICHTIG.</b> Die Kontakt-E-Mail-Adresse für Benutzer des Dienstes.`,
        theme: {
          logo: `Die Logo-URL, die verwendet werden soll, um das Standardlogo des <i>Simple Directory</i> zu ersetzen.`,
          dark: `Verdunkeln Sie das gesamte Erscheinungsbild der Seiten.<br>Beachten Sie, dass die Standardfarben für ein klares Thema besser geeignet sind. Wenn Sie zu dunkel wechseln, müssen Sie auch diese Farben ändern.`,
          cssUrl: 'Verknüpfung mit einer Stilvorlage, um die Anpassungsvariablen zu vervollständigen.<br>WARNUNG: die HTML-Struktur kann zwischen 2 Versionen erheblich variieren. Die Beibehaltung dieses Stylesheets wird bei jedem Upgrade zusätzliche Arbeit für Sie bedeuten.',
          cssText: 'Textlicher CSS-Inhalt.<br>WARNUNG: die HTML-Struktur kann zwischen 2 Versionen erheblich variieren. Die Beibehaltung dieses Stylesheets wird bei jedem Upgrade zusätzliche Arbeit für Sie bedeuten.'
        },
        secret: {
          public: `<b>WICHTIG.</b> Der Pfad zum öffentlichen RSA-Verschlüsselungsschlüssel. Siehe die Dokumentation zur Dienstinstallation.`,
          private: `<b>WICHTIG.</b> Der Pfad zum privaten RSA-Verschlüsselungsschlüssel. Siehe die Dokumentation zur Dienstinstallation.`
        },
        analytics: 'JSON für die Analysekonfiguration, entspricht dem Konfigurationsteil "Module" der Bibliothek <a href="https://github.com/koumoul-dev/vue-multianalytics#modules">vue-multianalytics</a>',
        storage: {
          type: `<b>WICHTIG.</b> Die Art der Speicherung für die Persistenz von Benutzern und Organisationen.<br>
Der voreingestellte "Datei"-Typ ist schreibgeschützt und eignet sich für Entwicklung/Test oder zur Verwendung einer aus einem anderen System exportierten Benutzersammlung.<br>
Der "Mongo"-Typ hängt vom Zugriff auf eine MongoDB-Datenbank ab, er ist der geeignete Modus für die meisten Installationen in der Produktion.`,
          file: {
            users: `Nur für storage.type=file. Der Pfad zu der JSON-Datei mit den Benutzerdefinitionen`,
            organizations: `Nur für storage.type=file. Der Pfad zur JSON-Datei mit den Organisationsdefinitionen`
          },
          mongo: {
            url: 'Nur für storage.type=mongo. Die vollständige Verbindungszeichenfolge zur mongodb-Datenbank.'
          }
        },
        mails: {
          transport: '<b>WICHTIG.</b> Ein mit der Bibliothek kompatibles JSON-Mail-Transport-Konfigurationsobjekt <a href="https://nodemailer.com/smtp/">nodemailer</a>.',
          from: `'<b>WICHTIG.</b> Die Adresse, die als Absender der von der Dienststelle ausgegebenen E-Mails anzugeben ist.`
        },
        listEntitiesMode: `Ermöglicht es Ihnen, den Zugriff auf Listen von Benutzern und Organisationen global einzuschränken.<br>
Peut valoir 'anonym', 'authentifiziert' oder 'admin'.`,
        defaultLoginRedirect: `Standardumleitung nach Anmeldung. Wenn nicht angegeben, wird der Benutzer zu seinem Profil umgeleitet.`,
        onlyCreateInvited: `Wenn echte Benutzer nicht bei der ersten gesendeten E-Mail erstellt werden. Sie müssen in eine Organisation eingeladen werden.`,
        tosUrl: `<b>WICHTIG.</b> Wenn echte Benutzer nicht bei der ersten gesendeten E-Mail erstellt werden. Sie müssen in eine Organisation eingeladen werden.`
      }
    },
    use: {
      link: 'Verwenden Sie'
    }
  },
  pages: {
    admin: {
      users: {
        noCreatedOrgsLimit: `Benutzer können eine beliebige Anzahl von Organisationen erstellen.`,
        createdOrgsLimit: `Benutzer können {defaultMaxCreatedOrgs} Standardorganisation(en) erstellen.`,
        explainLimit: `Legen Sie einen Wert fest, um die Anzahl der Organisationen zu begrenzen, die dieser Benutzer erstellen kann. -1 für eine beliebige Anzahl. Löschen Sie das Feld, um zum Standardwert zurückzukehren ({defaultMaxCreatedOrgs}).`,
        editUserEmailTitle: `Ändere die E-Mail-Adresse des Benutzers {name}`,
        editUserEmailText: `Warnung! E-Mail ist ein wichtiger Benutzerschlüssel. Durch das Ändern dieser Informationen laufen Sie Gefahr, eine falsche, nicht funktionierende oder inkonsistente Adresse mit anderen Einträgen einzufügen. Diese Funktion wird nur Administratoren angeboten, um die Blockierung eines Benutzers aufzuheben, auf dessen Postfach nicht mehr zugegriffen werden kann.`
      },
      organizations: {
        limitOrganizationTitle: `Organisatorische Grenzen ändern`,
        members: 'mitglied(er)',
        nbMembers: 'Maximale Anzahl von Mitgliedern (0 für keine Begrenzung)'
      }
    },
    login: {
      title: 'Identifizieren Sie sich',
      emailLabel: 'Deine E-Mail',
      emailCaption: `Erfahren Sie mehr über die <a href="https://koumoul.com/blog/passwordless">kennwortlose Authentifizierung</a>`,
      success: `Sie erhalten eine E-Mail an die angegebene Adresse, die einen Link enthält. Bitte öffnen Sie diesen Link, um Ihre Identifikation zu vervollständigen.`,
      maildevLink: 'Greifen Sie auf das Entwicklungspostfach zu',
      newPassword: 'Neues Kennwort',
      newPassword2: 'Bestätigen Sie das neue Passwort',
      changePassword: 'Passwort erneuern',
      changePasswordTooltip: `Wenn Sie Ihr Passwort vergessen haben oder es ändern müssen, erneuern Sie Ihr Passwort.`,
      newPasswordMsg: `Geben Sie das neue Passwort zweimal ein.`,
      changePasswordSent: `Unter {email} wurde eine E-Mail an Sie gesendet. Diese E-Mail enthält einen Link zum Ändern des mit Ihrem Konto verknüpften Passworts.`,
      passwordlessMsg1: `Es reicht aus, eine E-Mail zu verbinden.`,
      passwordlessMsg2: `Senden Sie eine Login-E-Mail.`,
      passwordlessConfirmed: `Unter {email} wurde eine E-Mail an Sie gesendet. Diese E-Mail enthält einen Link zur Verbindung mit unserer Plattform.`,
      createUserMsg1: `Wenn Sie sich noch nicht auf unserer Plattform angemeldet haben, erstellen Sie bitte ein Konto.`,
      createUserMsg2: `Ein Konto erstellen`,
      tosMsg: `Bevor Sie Ihr Konto erstellen, lesen Sie bitte <a href="{tosUrl}" target="_blank">unsere allgemeinen Nutzungsbedingungenn</a>.`,
      tosConfirm: `Ich bestätige, dass ich die allgemeinen Nutzungsbedingungen für diese Website gelesen habe.`,
      createUserConfirm: 'Konto erstellen',
      createUserConfirmed: `Ihnen wurde eine E-Mail an {email} geschickt. Diese E-Mail enthält einen Link zur Validierung der Erstellung des Kontos.`,
      adminMode: 'Bestätigen Sie Ihre Identität, um in den Verwaltungsmodus zu wechseln.',
      oauth: 'Anmeldung mit :',
      error: 'Error'
    },
    organization: {
      addMember: 'Laden Sie einen Benutzer zum Beitritt zur Organisation ein',
      disableInvite: 'Diese Organisation hat ihre maximale Mitgliederzahl erreicht.',
      deleteMember: `Löschen Sie diesen Benutzer aus der Mitgliederliste der Organisation`,
      editMember: `Ändern Sie die Rolle dieses Benutzers in der Organisation`,
      confirmEditMemberTitle: 'Bearbeiten {name}',
      confirmDeleteMemberTitle: 'Ausschließen {name}',
      confirmDeleteMemberMsg: `Wollen Sie diesen Benutzer wirklich von der Mitgliederliste der Organisation streichen?`,
      deleteMemberSuccess: `Der Benutzer {name} wurde aus der Organisation ausgeschlossen.`,
      inviteEmail: `E-Mail-Adresse des Benutzers`,
      inviteSuccess: `Eine Einladung wurde an {email} geschickt`,
      memberConflict: 'Dieser Benutzer ist bereits Mitglied',
      departmentLabelTitle: `Wortlaut des "Departements"-Konzepts`,
      departmentLabelHelp: `Lassen Sie das Feld leer, um "Abteilung" anzuzeigen. Füllen Sie das Feld aus, um andere Vokabeln wie "Abteilung", "Agentur" usw. zu verwenden.`,
      addDepartment: '{departmentLabel} erstellen',
      editDepartment: 'Bearbeiten {departmentLabel}',
      deleteDepartment: 'Löschen {departmentLabel}',
      confirmEditDepartmentTitle: 'Bearbeiten {name}',
      confirmDeleteDepartmentTitle: '{name} entfernen',
      confirmDeleteDepartmentMsg: `Möchten Sie {name} wirklich aus Ihrer Organisation entfernen?`,
      departmentIdInvalid: 'Der Bezeichner darf nur Buchstaben, Zahlen und Leerzeichen enthalten.',
      inviteLink: 'Bei Problemen bei der Kommunikation per E-Mail können Sie den untenstehenden Bestätigungslink auf andere Weise senden. Warnung ! Sie riskieren das Einfügen einer falschen oder nicht funktionierenden E-Mail-Adresse in die Benutzerdatenbank. Diese E-Mail-Adresse kann später mehrere Probleme verursachen: Passwortänderung, Senden von Benachrichtigungen usw.'
    },
    invitation: {
      title: 'Einladung validiert',
      msgSameUser: `Ihre Einladung, Mitglied einer Organisation zu werden, wurde angenommen. Sie können Ihr <a href="{profileUrl}">Profil einsehen</a>.`,
      msgDifferentUser: `Diese Einladung, Mitglied einer Organisation zu werden, wurde gut angenommen. Sie können <a href="{loginUrl}">Anmelden</a> mit dem Gastkonto.`
    },
    avatar: {
      prepare: `Das Bild vorbereiten`
    },
    me: {
      noOrganization: 'Sie sind nicht Mitglied einer Organisation.',
      operations: 'Sensible Operationen',
      deleteMyself: 'Dieses Konto löschen',
      deleteMyselfAlert: 'Wenn Sie Ihr Konto löschen, werden auch die zugehörigen Daten gelöscht und können nicht wiederhergestellt werden.',
      deleteMyselfCheck: 'Markieren Sie dieses Kästchen und klicken Sie auf OK, um das Löschen zu bestätigen.'
    }
  },
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
    rateLimitAuth: `Zu viele Versuche in kurzer Zeit. Bitte warten Sie, bevor Sie es erneut versuchen.`,
    invalidInvitationToken: `Der Einladungslink, den Sie erhalten haben, ist ungültig.`,
    expiredInvitationToken: `Der Einladungslink, den Sie erhalten haben, ist abgelaufen. Sie können diese Einladung nicht mehr annehmen.`,
    maxNbMembers: `Die Organisation enthält bereits die maximale Anzahl von Mitgliedern, die durch ihre Quoten zulässig sind.`,
    unknownOAuthProvider: 'OAuth-Identifizierung wird nicht unterstützt.',
    adminModeOnly: 'Funktionalität für Superadministratoren reserviert.'
  },
  mails: {
    creation: {
      subject: 'Willkommen bei {host}',
      text: `
Für diese E-Mail-Adresse wurde vom {host} ein Antrag auf Einrichtung eines Kontos gestellt. Um das Konto zu aktivieren, müssen Sie die untenstehende URL in einen Browser kopieren. Diese URL ist 15 Minuten lang gültig.
{link}

Wenn Sie ein Problem mit Ihrem Konto haben oder nicht beantragt haben, ein Konto auf {host} einzurichten, kontaktieren Sie uns bitte unter {contact}.
      `,
      htmlMsg: `Ein Antrag auf Einrichtung eines Kontos wurde gestellt seit <a href="{origin}">{host}</a> für diese E-Mail-Adresse. Zur Bestätigung klicken Sie auf die Schaltfläche unten. Der Link ist 15 Minuten lang gültig.`,
      htmlButton: `Kontoerstellung bestätigen`,
      htmlAlternativeLink: `Wenn die obige Schaltfläche nicht funktioniert, können Sie diesen Link in die Adressleiste Ihres Browsers kopieren:`,
      htmlCaption: `Wenn Sie ein Problem mit Ihrem Konto haben oder wenn Sie nicht beantragt haben, sich unter <a href="{origin}">{host}</a>, zögern Sie nicht, uns zu kontaktieren unter <a href="mailto:{contact}">{contact}</a>.`
    },
    login: {
      subject: 'Identifikation auf {host}',
      text: `
Eine Identifikationsanfrage wurde von {host} gestellt. Kopieren Sie zur Bestätigung die folgende URL in einen Browser. Diese URL ist 15 Minuten gültig.

{link}

Wenn Sie ein Problem mit Ihrem Konto haben oder nicht darum gebeten haben, sich bei {host} anzumelden, zögern Sie bitte nicht, uns unter {contact} zu kontaktieren.
      `,
      htmlMsg: `Seitdem wurde ein Ausweisantrag gestellt <a href="{origin}">{host}</a>. Um dies zu bestätigen, klicken Sie auf die Schaltfläche unten. Der Link ist 15 Minuten gültig.`,
      htmlButton: `Verbindung zu {host} herstellen`,
      htmlAlternativeLink: `Wenn die obige Schaltfläche nicht funktioniert, können Sie diesen Link in die Adressleiste Ihres Browsers kopieren:`,
      htmlCaption: `Wenn Sie ein Problem mit Ihrem Konto haben oder keine Verbindung zu <a href="{origin}">{host}</a>, hergestellt haben, zögern Sie bitte nicht, uns unter <a href="mailto:{contact}">{contact}</a> zu kontaktieren.`
    },
    noCreation: {
      subject: `Authentifizierungsfehler ein {host}`,
      text: `
Eine Identifikationsanfrage wurde von {host} gestellt, aber abgelehnt, da diese E-Mail-Adresse unbekannt oder nicht validiert ist.

Zögern Sie nicht, uns unter {contact} zu kontaktieren.
      `,
      htmlMsg: `Seitdem wurde ein Ausweisantrag gestellt <a href="{origin}">{host}</a>, Es wurde jedoch abgelehnt, da diese E-Mail-Adresse unbekannt ist oder nicht validiert wurde.`,
      htmlCaption: `Zögern Sie nicht, uns unter zu kontaktieren <a href="mailto:{contact}">{contact}</a>.`
    },
    conflict: {
      subject: `Fehler beim Erstellen eines Kontos am {host}`,
      text: `
Eine Kontoerstellungsanforderung wurde von {host} gestellt, aber abgelehnt, da diese E-Mail-Adresse bereits einem Konto zugeordnet ist.

führt Sie nicht, uns zu gehören unter {contact}.
      `,
      htmlMsg: `Ein Antrag auf Einrichtung eines Kontos wurde gestellt seit <a href="{origin}">{host}</a>, aber es wurde abgelehnt, weil diese E-Mail-Adresse bereits mit einem Konto verknüpft ist.`,
      htmlCaption: `führt Sie nicht, uns zu gehören unter <a href="mailto:{contact}">{contact}</a>.`
    },
    invitation: {
      subject: `Treten Sie der {organization} am {host} bei.`,
      text: `
Sie wurden von einem Administrator der {organization} eingeladen, ihr beizutreten. Um diese Einladung anzunehmen, kopieren Sie die untenstehende URL in einen Browser. Diese URL ist 10 Tage lang gültig.
Wenn Sie noch kein Konto haben, wird es automatisch erstellt.

{link}

Falls Sie Probleme mit Ihrem Konto haben oder diese Einladung verdächtig finden, zögern Sie bitte nicht, uns unter {contact} zu kontaktieren.
      `,
      htmlMsg: `
Sie wurden von einem Administrator der {organization} eingeladen, ihr beizutreten. Um diese Einladung anzunehmen, klicken Sie auf die Schaltfläche unten. Der Link ist 10 Tage lang gültig.
Wenn Sie noch kein Konto haben, wird es automatisch erstellt.
      `,
      htmlButton: `Nehmen Sie die Einladung an`,
      htmlAlternativeLink: `Wenn die obige Schaltfläche nicht funktioniert, können Sie diesen Link in die Adressleiste Ihres Browsers kopieren:`,
      htmlCaption: `Wenn Sie ein Problem mit Ihrem Konto haben oder diese Einladung verdächtig finden, kontaktieren Sie uns bitte unter <a href="mailto:{contact}">{contact}</a>.`
    },
    action: {
      subject: `Führen Sie eine Aktion auf Ihrem Konto bei {host} aus.`,
      text: `
Auf dieser Adresse wurde eine Aktion ausgelöst, die eine Bestätigung per E-Mail verlangt. Um diese Aktion zu validieren, kopieren Sie die untenstehende URL in einen Browser. Diese URL ist 15 Minuten lang gültig.

{link}

Wenn Sie auf ein Problem mit Ihrem Konto stoßen oder Sie diese Nachricht verdächtig finden, zögern Sie bitte nicht, uns unter {contact} zu kontaktieren.
      `,
      htmlMsg: `
Auf dieser Adresse wurde eine Aktion ausgelöst, die eine Bestätigung per E-Mail verlangt. Um diese Aktion zu bestätigen, klicken Sie auf die Schaltfläche unten. Der Link ist 15 Minuten lang gültig.
      `,
      htmlButton: `Validieren Sie`,
      htmlAlternativeLink: `Wenn die obige Schaltfläche nicht funktioniert, können Sie diesen Link in die Adressleiste Ihres Browsers kopieren:`,
      htmlCaption: `Wenn Sie auf ein Problem mit Ihrem Konto stoßen oder diese Nachricht verdächtig finden, kontaktieren Sie uns bitte unter <a href="mailto:{contact}">{contact}</a>.`
    }
  }
}
