// WARN: do not use underscore in keys, it is used as delimiter when reading
// messages from environment variables

export default {
  root: {
    title: 'Simple Directory',
    description: 'Vereinfachte Verwaltung Ihrer Benutzer und Organisationen in einer modernen weborientierten Architektur.'
  },
  common: {
    home: 'Startseite',
    logLink: 'Anmelden / Registrieren',
    logout: 'Abmelden',
    login: 'Anmeldung',
    signin: 'Sign up',
    activateAdminMode: 'Aktivierungsmodus admin',
    deactivateAdminMode: 'Admin-Modus deaktivieren',
    documentation: 'Dokumentation',
    administration: 'Verwaltung',
    myAccount: 'Mein Konto',
    myOrganizations: 'Meine Organisationen',
    organization: 'Organisation',
    organizations: 'Organisationen',
    organizationName: 'Organisationsname',
    user: 'Nutzer',
    users: 'Benutzer',
    createOrganization: 'Erstellen einer Organisation',
    dashboard: 'Instrumententafel',
    description: 'Beschreibung',
    id: 'Nutzername',
    name: 'Name',
    save: 'Aufzeichnung',
    members: 'Mitglieder',
    orgStorageMembers: 'Mitglieder im sekundären Speicher',
    role: 'Rolle',
    search: 'Suche',
    confirmOk: 'Ok',
    confirmCancel: 'Abbrechen',
    confirmTitle: 'Möchten Sie diese Operation bestätigen?',
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
    host: 'Website',
    sites: 'Websites',
    updatedAt: 'Aktualisiert am',
    maxCreatedOrgs: 'Maximale Anzahl der zu gründenden Organisationen',
    maxCreatedOrgsShort: 'Max Orgs',
    nbCreatedOrgs: 'Anzahl der erstellten Organisationen :',
    back: 'Zurück',
    next: 'Nächste',
    password: 'Kennwort',
    checkInbox: 'Überprüfen Sie Ihre Mailbox',
    spamWarning: 'Wenn Sie eine E-Mail nicht erhalten haben, überprüfen Sie, ob sie nicht automatisch als Spam klassifiziert wurde.',
    validate: 'Validieren Sie',
    delete: 'Delete',
    department: 'Abteilung',
    departments: 'Abteilungen',
    autoAdmin: 'Mich automatisch als Administrator hinzufügen',
    asAdmin: 'Anmeldung als dieser Benutzer',
    delAsAdmin: 'Zurück zu meiner Administratorsitzung',
    avatar: 'Avatar',
    birthday: 'Geburtstag',
    missingInfo: 'Fehlende Informationen',
    '2FA': 'Zwei-Faktor-Authentifizierung',
    userAccount: 'Persönliches Konto',
    continue: 'Fortsetzen',
    tooLong: 'Text ist zu lang',
    settings: 'Einstellungen',
    emailConfirmed: 'Erstellung abgeschlossen',
    emailNotConfirmed: 'Erstellung nicht abgeschlossen',
    noRole: 'keine Rolle',
    downloadCsv: 'Liste im CSV-Format herunterladen',
    authMode: 'Authentifizierungsmodus',
    authProviders: 'Authentifizierungsanbieter',
    partners: 'Partnerorganisationen',
    contactEmail: 'Kontakt-E-Mail',
    orgName: 'Name der Organisation',
    loginSignin: 'Anmelden / Konto erstellen',
    sort: 'Sortieren',
    all: 'alle',
    creationStep: 'Erstellungsschritt',
    oauthTokens: 'OAuth-Token',
    plannedDeletion: 'Geplante Löschung',
    plannedDeletionShort: 'Löschung',
    owner: 'Besitzer',
    passwordLists: 'Passwörter',
    adminGlobal: 'Globale Verwaltung',
    adminSite: 'Seitenverwaltung',
    no: 'Nein',
    redirectSite: 'Website für die Weiterleitung',
    manageOrg: 'Organisationsverwaltung',
    manageDep: 'Abteilungsverwaltung'
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
      i18nVar: 'Umgebungsvariable',
      i18nVal: 'Wert',
      varKey: 'Schlüssel in der Konfigurationsdatei',
      varName: 'Umgebungsvariable',
      varDesc: 'Beschreibung',
      varDefault: 'Standardwert',
      varDescriptions: {
        publicUrl: '<b>WICHTIG.</b> Die URL, der der Dienst ausgesetzt wird. Zum Beispiel https://koumoul.com/simple-directory',
        admins: '<b>WICHTIG.</b> Die Liste der E-Mail-Adressen der Administratoren des Dienstes.',
        contact: '<b>WICHTIG.</b> Die Kontakt-E-Mail-Adresse für Benutzer des Dienstes.',
        theme: {
          logo: 'Die Logo-URL, die verwendet werden soll, um das Standardlogo des <i>Simple Directory</i> zu ersetzen.',
          dark: 'Verdunkeln Sie das gesamte Erscheinungsbild der Seiten.<br>Beachten Sie, dass die Standardfarben für ein klares Thema besser geeignet sind. Wenn Sie zu dunkel wechseln, müssen Sie auch diese Farben ändern.',
          cssUrl: 'Verknüpfung mit einer Stilvorlage, um die Anpassungsvariablen zu vervollständigen.<br>WARNUNG: die HTML-Struktur kann zwischen 2 Versionen erheblich variieren. Die Beibehaltung dieses Stylesheets wird bei jedem Upgrade zusätzliche Arbeit für Sie bedeuten.',
          cssText: 'Textlicher CSS-Inhalt.<br>WARNUNG: die HTML-Struktur kann zwischen 2 Versionen erheblich variieren. Die Beibehaltung dieses Stylesheets wird bei jedem Upgrade zusätzliche Arbeit für Sie bedeuten.'
        },
        secret: {
          public: '<b>WICHTIG.</b> Der Pfad zum öffentlichen RSA-Verschlüsselungsschlüssel. Siehe die Dokumentation zur Dienstinstallation.',
          private: '<b>WICHTIG.</b> Der Pfad zum privaten RSA-Verschlüsselungsschlüssel. Siehe die Dokumentation zur Dienstinstallation.'
        },
        analytics: 'JSON für die Analysekonfiguration, entspricht dem Konfigurationsteil "Module" der Bibliothek <a href="https://github.com/koumoul-dev/vue-multianalytics#modules">vue-multianalytics</a>',
        storage: {
          type: `<b>WICHTIG.</b> Die Art der Speicherung für die Persistenz von Benutzern und Organisationen.<br>
Der voreingestellte "Datei"-Typ ist schreibgeschützt und eignet sich für Entwicklung/Test oder zur Verwendung einer aus einem anderen System exportierten Benutzersammlung.<br>
Der "Mongo"-Typ hängt vom Zugriff auf eine MongoDB-Datenbank ab, er ist der geeignete Modus für die meisten Installationen in der Produktion.`,
          file: {
            users: 'Nur für storage.type=file. Der Pfad zu der JSON-Datei mit den Benutzerdefinitionen',
            organizations: 'Nur für storage.type=file. Der Pfad zur JSON-Datei mit den Organisationsdefinitionen'
          },
          mongo: {
            url: 'Nur für storage.type=mongo. Die vollständige Verbindungszeichenfolge zur mongodb-Datenbank.'
          }
        },
        mails: {
          transport: '<b>WICHTIG.</b> Ein mit der Bibliothek kompatibles JSON-Mail-Transport-Konfigurationsobjekt <a href="https://nodemailer.com/smtp/">nodemailer</a>.',
          from: '\'<b>WICHTIG.</b> Die Adresse, die als Absender der von der Dienststelle ausgegebenen E-Mails anzugeben ist.'
        },
        listEntitiesMode: `Ermöglicht es Ihnen, den Zugriff auf Listen von Benutzern und Organisationen global einzuschränken.<br>
Peut valoir 'anonym', 'authentifiziert' oder 'admin'.`,
        defaultLoginRedirect: 'Standardumleitung nach Anmeldung. Wenn nicht angegeben, wird der Benutzer zu seinem Profil umgeleitet.',
        onlyCreateInvited: 'Wenn echte Benutzer nicht bei der ersten gesendeten E-Mail erstellt werden. Sie müssen in eine Organisation eingeladen werden.',
        tosUrl: '<b>WICHTIG.</b> Wenn echte Benutzer nicht bei der ersten gesendeten E-Mail erstellt werden. Sie müssen in eine Organisation eingeladen werden.'
      }
    },
    use: {
      link: 'Verwenden Sie'
    }
  },
  pages: {
    admin: {
      users: {
        noCreatedOrgsLimit: 'Benutzer können eine beliebige Anzahl von Organisationen erstellen.',
        createdOrgsLimit: 'Benutzer können {defaultMaxCreatedOrgs} Standardorganisation(en) erstellen.',
        explainLimit: 'Legen Sie einen Wert fest, um die Anzahl der Organisationen zu begrenzen, die dieser Benutzer erstellen kann. -1 für eine beliebige Anzahl. Löschen Sie das Feld, um zum Standardwert zurückzukehren ({defaultMaxCreatedOrgs}).',
        editUserEmailTitle: 'Ändere die E-Mail-Adresse des Benutzers {name}',
        editUserEmailText: 'Warnung! E-Mail ist ein wichtiger Benutzerschlüssel. Durch das Ändern dieser Informationen laufen Sie Gefahr, eine falsche, nicht funktionierende oder inkonsistente Adresse mit anderen Einträgen einzufügen. Diese Funktion wird nur Administratoren angeboten, um die Blockierung eines Benutzers aufzuheben, auf dessen Postfach nicht mehr zugegriffen werden kann.',
        drop2FATitle: 'Zwei-Faktor-Authentifizierung deaktivieren',
        drop2FAText: 'Warnung! Diese Operation deaktiviert die Zwei-Faktor-Authentifizierung für diesen Benutzer.'
      },
      organizations: {
        limitOrganizationTitle: 'Organisatorische Grenzen ändern',
        members: 'mitglied(er)',
        nbMembers: 'Maximale Anzahl von Mitgliedern (0 für keine Begrenzung)'
      },
      sites: {
        createSite: 'Eine neue Website definieren',
        colorWarnings: 'Kontrastwarnungen'
      },
      site: {
        title: 'Website-Konfiguration'
      }
    },
    login: {
      title: 'Identifizieren Sie sich',
      emailLabel: 'Deine E-Mail',
      emailCaption: 'Erfahren Sie mehr über die <a href="https://koumoul.com/blog/passwordless">kennwortlose Authentifizierung</a>',
      success: 'Sie erhalten eine E-Mail an die angegebene Adresse, die einen Link enthält. Bitte öffnen Sie diesen Link, um Ihre Identifikation zu vervollständigen.',
      maildevLink: 'Greifen Sie auf das Entwicklungspostfach zu',
      newPassword: 'Neues Kennwort',
      newPassword2: 'Bestätigen Sie das neue Passwort',
      changePassword: 'Passwort erneuern',
      changePasswordTooltip: 'Wenn Sie Ihr Passwort vergessen haben oder es ändern müssen, erneuern Sie Ihr Passwort.',
      newPasswordMsg: 'Geben Sie das neue Passwort zweimal ein.',
      changePasswordSent: 'Unter {email} wurde eine E-Mail an Sie gesendet. Diese E-Mail enthält einen Link zum Ändern des mit Ihrem Konto verknüpften Passworts.',
      passwordlessMsg1: 'Es reicht aus, eine E-Mail zu verbinden.',
      passwordlessMsg2: 'Senden Sie eine Login-E-Mail.',
      passwordlessConfirmed: 'Unter {email} wurde eine E-Mail an Sie gesendet. Diese E-Mail enthält einen Link zur Verbindung mit unserer Plattform.',
      createUserMsg1: 'Wenn Sie sich noch nicht auf unserer Plattform angemeldet haben, erstellen Sie bitte ein Konto.',
      createUserMsg2: 'Ein Konto erstellen',
      createUserInvit: 'Erstellen Sie ein Konto, um die Einladung in der Organisation {name} anzunehmen',
      createUserOrganization: 'Möchten Sie eine Organisation erstellen?',
      createuserOrganizationHelp: 'Wenn Sie eine Organisation erstellen, können Sie andere Benutzer einladen, Ihnen beizutreten und Ressourcen zu teilen.',
      tosMsg: 'Bevor Sie Ihr Konto erstellen, lesen Sie bitte <a href="{tosUrl}" target="_blank">unsere allgemeinen Nutzungsbedingungenn</a>.',
      tosConfirm: 'Ich bestätige, dass ich die allgemeinen Nutzungsbedingungen für diese Website gelesen habe.',
      createUserConfirm: 'Konto erstellen',
      createUserConfirmed: 'Ihnen wurde eine E-Mail an {email} geschickt. Diese E-Mail enthält einen Link zur Validierung der Erstellung des Kontos.',
      adminMode: 'Bestätigen Sie Ihre Identität, um in den Verwaltungsmodus zu wechseln.',
      oauth: 'Anmeldung mit :',
      error: 'Fehler',
      rememberMe: 'erinnere dich an mich',
      '2FACode': '6-stelliger Code oder Wiederherstellungscode',
      '2FAInfo': 'Geben Sie einen Bestätigungscode ein, um fortzufahren. Sie können diesen Code aus der Bestätigungs-App auf Ihrem Telefon erhalten. Wenn Sie Ihr Gerät verlieren, können Sie den Wiederherstellungscode verwenden, den Sie beim Einrichten der Zwei-Faktor-Authentifizierung heruntergeladen haben.',
      configure2FA: 'Zwei-Faktor-Authentifizierung konfigurieren',
      configure2FAQRCode: 'QR-Code für die Einrichtung der Zwei-Faktor-Authentifizierung',
      configure2FAQRCodeMsg: 'Scannen Sie diesen QR-Code mit einem Authentifizierungs-Tool Ihrer Wahl (wie Authy oder Google Authenticator) und geben Sie den 6-stelligen Code ein, den diese Anwendung anbietet.',
      configure2FACode: '6-stelliger Code',
      recovery2FA: 'Wiederherstellungscode',
      recovery2FAInfo: 'Achtung! Bewahren Sie den Wiederherstellungscode unten an einem sicheren Ort auf. Ohne ihn können Sie Ihr Konto nicht wiederherstellen, wenn Sie das Gerät verlieren, auf dem Sie gerade die Zwei-Faktor-Authentifizierung eingerichtet haben.',
      recovery2FACode: 'Wiederherstellungscode: ',
      recovery2FADownload: 'Laden Sie eine Datei mit dem Wiederherstellungscode herunter',
      recovery2FAContent: 'Wiederherstellungscode für die Zwei-Faktor-Authentifizierung {name}',
      plannedDeletion: 'Geplante Löschung',
      cancelDeletion: 'Löschen des Benutzers abbrechen',
      siteLogo: 'Website-Logo',
      partnerInvitation: 'Partner-Einladung',
      changeHost: 'Konto mit Back-Office verknüpft'
    },
    organization: {
      addMember: 'Laden Sie einen Benutzer zum Beitritt zur Organisation ein',
      disableInvite: 'Diese Organisation hat ihre maximale Mitgliederzahl erreicht.',
      deleteMember: 'Löschen Sie diesen Benutzer aus der Mitgliederliste der Organisation',
      editMember: 'Ändern Sie die Rolle dieses Benutzers in der Organisation',
      memberReadOnly: 'Die Mitgliedschaft dieses Benutzers in der Organisation stammt aus einem Identitätsanbieter und kann hier nicht geändert werden.',
      confirmEditMemberTitle: 'Bearbeiten {name}',
      confirmDeleteMemberTitle: 'Ausschließen {name}',
      confirmDeleteMemberMsg: 'Wollen Sie diesen Benutzer wirklich von der Mitgliederliste der Organisation streichen {name}?',
      deleteMemberSuccess: 'Der Benutzer {name} wurde aus der Organisation ausgeschlossen.',
      inviteEmail: 'E-Mail-Adresse des Benutzers',
      inviteSuccess: 'Eine Einladung wurde an {email} geschickt',
      invitePartnerSuccess: 'Eine Einladung wurde an {email} geschickt',
      memberConflict: 'Dieser Benutzer ist bereits Mitglied',
      departmentLabelTitle: 'Bezeichnung für das Konzept "Abteilung"',
      addDepartment: '{departmentLabel} erstellen',
      editDepartment: 'Bearbeiten {departmentLabel}',
      deleteDepartment: 'Löschen {departmentLabel}',
      confirmEditDepartmentTitle: 'Bearbeiten {name}',
      confirmDeleteDepartmentTitle: '{name} entfernen',
      confirmDeleteDepartmentMsg: 'Möchten Sie {name} wirklich aus Ihrer Organisation entfernen?',
      deleteDepartmentHasMembers: 'Este departamento está atribuído a {count} membro(s) da organização. Não pode ser excluído neste estado.',
      departmentIdInvalid: 'Der Bezeichner darf nur Buchstaben, Zahlen und Leerzeichen enthalten.',
      inviteLink: 'Bei Problemen bei der Kommunikation per E-Mail können Sie den untenstehenden Bestätigungslink auf andere Weise senden. Warnung ! Sie riskieren das Einfügen einer falschen oder nicht funktionierenden E-Mail-Adresse in die Benutzerdatenbank. Diese E-Mail-Adresse kann später mehrere Probleme verursachen: Passwortänderung, Senden von Benachrichtigungen usw.',
      '2FARoles': 'Zwei-Faktor-Authentifizierung.',
      '2FARolesMsg': 'Machen Sie die Zwei-Faktor-Authentifizierung für Benutzer mit diesen Rollen obligatorisch:',
      sendInvitationLink: 'Senden Sie einen anderen Einladungslink',
      addPartner: 'Laden Sie eine Partnerorganisation ein',
      deletePartner: 'Löschen Sie diesen Partner',
      depSortCreation: 'Zuletzt erstellt',
      depSortAlpha: 'Alphabetische Reihenfolge',
      deletePartnerWarning: 'Achtung! Die Berechtigungen, die der Partnerorganisation gewährt wurden, werden durch diese Operation nicht geändert. Sie sollten diese wahrscheinlich selbst ändern.',
      fromCache: 'Letzte Synchronisierung dieser Liste mit dem Identitätsanbieter: {fromNow}.',
      roleLabel: 'Bezeichnung der Rolle "{role}"'
    },
    invitation: {
      title: 'Einladung validiert',
      msgSameUser: 'Ihre Einladung, Mitglied einer Organisation zu werden, wurde angenommen. Sie können Ihr <a href="{profileUrl}">Profil einsehen</a>.',
      msgDifferentUser: 'Diese Einladung, Mitglied einer Organisation zu werden, wurde gut angenommen. Sie können <a href="{loginUrl}">Anmelden</a> mit dem Gastkonto.'
    },
    avatar: {
      load: 'Laden Sie ein neues Avatar',
      prepare: 'Das Bild vorbereiten'
    },
    me: {
      noOrganization: 'Sie sind nicht Mitglied einer Organisation.',
      operations: 'Sensible Operationen',
      deleteMyself: 'Dieses Konto löschen',
      deleteMyselfAlert: 'Wenn Sie Ihr Konto löschen, werden auch die zugehörigen Daten gelöscht und können nicht wiederhergestellt werden.',
      deleteMyselfCheck: 'Markieren Sie dieses Kästchen und klicken Sie auf OK, um das Löschen zu bestätigen.',
      accountChanges: 'Kontowechsel verwalten',
      defaultOrg: 'Aktivieren Sie dieses Konto standardmäßig nach jeder Anmeldung',
      ignorePersonalAccount: 'Aktivieren Sie dieses Kontrollkästchen, wenn Sie dieses Konto nicht außerhalb eines Organisationskontos verwenden möchten',
      sessions: 'Ihre Sitzungen',
      deleteSession: 'Sitzung auf {deviceName} löschen?',
      deleteSessionWarning: 'Das Löschen einer Sitzung kann maximal {duration} dauern, bis es vollständig angewendet wird.',
      settings: 'Ihre Einstellungen'
    },
    colorsPreview: {
      title: 'Vorschau der Farbdarstellung',
      cardTitle: 'Ein Beispiel für eine Karte',
      cardText: 'Sie verwendet die Farbe der "Oberflächen".'
    },
    partnerInvitation: {
      msg1: 'Die Organisation {name} möchte {partnerName} als Partner hinzufügen, mit {email} als Kontaktadresse.',
      msg2: 'Der Name "{partnerName}" ist nur eine Indikation und entspricht nicht unbedingt dem genauen Namen Ihrer Organisation.',
      diffEmail: 'Sie sind mit dem Benutzerkonto {userName} ({userEmail}) angemeldet. Sie können sich mit einem anderen Konto anmelden oder ein neues Konto erstellen, indem Sie auf die Schaltfläche unten klicken.',
      noUser1: 'Sie haben bereits ein Konto? Sie können sich anmelden und werden später auf diese Seite weitergeleitet.',
      noUser2: 'Sie haben noch kein Konto? Sie können eines erstellen und werden später auf diese Seite weitergeleitet.',
      noOrg: 'Sie gehören keiner Organisation an. Sie können eine neue Organisation erstellen und die Einladung im Namen der Organisation akzeptieren.',
      org: 'Sie können diese Einladung im Namen einer Organisation akzeptieren, für die Sie Administrator sind, oder eine neue Organisation erstellen und die Einladung im Namen der Organisation akzeptieren.',
      createOrg: 'eine neue Organisation erstellen',
      newOrgName: 'Name der neuen Organisation',
      create: 'erstellen',
      acceptAs: 'akzeptieren im Namen von {name}'
    },
    changeHost: {
      msg1: 'Das Konto {email} existiert nicht auf {host}, aber es existiert auf {mainHost}.',
      sso1: 'Lösung: Verwenden Sie {mainHost} zum Anmelden',
      sso2: 'Die Anmeldeseite bietet eine Schaltfläche zum Anmelden von {mainHost}, die Sie verwenden können. Sie können auch <a class="text-primary" href="{mainHostLogin}">diesen Link</a> verwenden.',
      solution1: 'Lösung: Konto zu {host} verschieben',
      solution2: 'Wenn Sie diese Lösung wählen, verlieren Sie die Möglichkeit, sich bei {mainHost} anzumelden.',
      confirmMigration: 'Konto zu {host} verschieben und den Zugriff auf {mainHost} verlieren'
    },
    orgStorage: {
      activate: 'Aktivieren Sie den sekundären Benutzerspeicher',
      link: 'Verbindungslink zum Verwenden dieses sekundären Speichers',
      ldap: 'LDAP-Konfiguration'
    }
  },
  errors: {
    badEmail: 'Die E-Mail-Adresse ist leer oder fehlerhaft.',
    badProviderInvitEmail: 'The email address you just used to log in does not match the one from the invitation you received',
    maxCreatedOrgs: 'Der Benutzer kann keine weiteren Organisationen erstellen. Limit erreicht.',
    permissionDenied: 'Nicht ausreichende Berechtigungen.',
    nonEmptyOrganization: 'Sie müssen andere Mitglieder aus dieser Organisation entfernen',
    userUnknown: 'Unbekannter Benutzer.',
    orgaUnknown: 'Unbekannte Organisation.',
    invitationConflict: 'Dieser Benutzer ist bereits Mitglied der Organisation.',
    unknownRole: 'Rolle {role} ist unbekannt.',
    serviceUnavailable: 'Service wegen Wartung nicht verfügbar.',
    badCredentials: 'E-Mail-Adresse oder Passwort ungültig.',
    updatePassword: 'It is necessary to update your password, because it was not updated for a long time.',
    missingToken: 'The id_token parameter is missing.',
    invalidToken: 'Das Token ist ungültig. Vielleicht ist es abgelaufen.',
    differentPasswords: 'The passwords are different',
    noPasswordless: 'Die passwortlose Authentifizierung wird von diesem Dienst nicht akzeptiert.',
    rateLimitAuth: 'Zu viele Versuche in kurzer Zeit. Bitte warten Sie, bevor Sie es erneut versuchen.',
    invalidInvitationToken: 'Der Einladungslink, den Sie erhalten haben, ist ungültig.',
    expiredInvitationToken: 'Der Einladungslink, den Sie erhalten haben, ist abgelaufen. Sie können diese Einladung nicht mehr annehmen.',
    maxNbMembers: 'Die Organisation enthält bereits die maximale Anzahl von Mitgliedern, die durch ihre Quoten zulässig sind.',
    unknownOAuthProvider: 'OAuth-Identifizierung wird nicht unterstützt.',
    unknownSAMLProvider: 'SAML identification not supported.',
    adminModeOnly: 'Funktionalität für Superadministratoren reserviert.',
    '2FANotConfigured': 'Zwei-Faktor-Authentifizierung ist für dieses Konto erforderlich und noch nicht konfiguriert.',
    passwordless2FA: 'Kennwortlose Authentifizierung ist inkompatibel mit der Zwei-Faktor-Authentifizierung, die für dieses Konto erforderlich ist.',
    bad2FAToken: 'Ungültiger oder abgelaufener Bestätigungscode für die Zwei-Faktor-Authentifizierung',
    plannedDeletion: 'Die Löschung des Benutzers {name} und aller zugehörigen Daten ist für den {plannedDeletion} geplant.',
    onlyCreateInvited: 'Sie können kein Konto direkt erstellen. Sie müssen von einer Organisation eingeladen werden.',
    badIDPQuery: 'Anfrage wird vom Identitätsanbieter als ungültig betrachtet.',
    duplicateDep: 'Das neue Abteilungsobjekt ist ein Duplikat',
    passwordEntropy: 'Das Passwort ist nicht stark genug.',
    passwordMinLength: 'Das Passwort muss mindestens {minLength} Zeichen enthalten.',
    passwordMinCharClasses: 'Das Passwort muss mindestens {minCharClasses} verschiedene Arten von Zeichen enthalten (Kleinbuchstaben, Großbuchstaben, Ziffer, Sonderzeichen).',
    forbiddenPassword: 'Dieses Passwort wurde in einer Liste bekannter Passwörter gefunden und kann nicht verwendet werden.',
    samePassword: 'Das neue Passwort muss sich vom alten Passwort unterscheiden.',
  },
  mails: {
    creation: {
      subject: 'Willkommen bei {host}',
      text: `
Für diese E-Mail-Adresse wurde vom {host} ein Antrag auf Einrichtung eines Kontos gestellt. Um das Konto zu aktivieren, müssen Sie die untenstehende URL in einen Browser kopieren. Diese URL ist 15 Minuten lang gültig.
{link}

Wenn Sie ein Problem mit Ihrem Konto haben oder nicht beantragt haben, ein Konto auf {host} einzurichten, kontaktieren Sie uns bitte unter {contact}.
      `,
      htmlMsg: 'Ein Antrag auf Einrichtung eines Kontos wurde gestellt seit <a href="{origin}">{host}</a> für diese E-Mail-Adresse. Zur Bestätigung klicken Sie auf die Schaltfläche unten. Der Link ist 15 Minuten lang gültig.',
      htmlButton: 'Kontoerstellung bestätigen',
      htmlAlternativeLink: 'Wenn die obige Schaltfläche nicht funktioniert, können Sie diesen Link in die Adressleiste Ihres Browsers kopieren:',
      htmlCaption: 'Wenn Sie ein Problem mit Ihrem Konto haben oder wenn Sie nicht beantragt haben, sich unter <a href="{origin}">{host}</a>, zögern Sie nicht, uns zu kontaktieren unter <a href="mailto:{contact}">{contact}</a>.'
    },
    login: {
      subject: 'Identifikation auf {host}',
      text: `
Eine Identifikationsanfrage wurde von {host} gestellt. Kopieren Sie zur Bestätigung die folgende URL in einen Browser. Diese URL ist 15 Minuten gültig.

{link}

Wenn Sie ein Problem mit Ihrem Konto haben oder nicht darum gebeten haben, sich bei {host} anzumelden, zögern Sie bitte nicht, uns unter {contact} zu kontaktieren.
      `,
      htmlMsg: 'Seitdem wurde ein Ausweisantrag gestellt <a href="{origin}">{host}</a>. Um dies zu bestätigen, klicken Sie auf die Schaltfläche unten. Der Link ist 15 Minuten gültig.',
      htmlButton: 'Verbindung zu {host} herstellen',
      htmlAlternativeLink: 'Wenn die obige Schaltfläche nicht funktioniert, können Sie diesen Link in die Adressleiste Ihres Browsers kopieren:',
      htmlCaption: 'Wenn Sie ein Problem mit Ihrem Konto haben oder keine Verbindung zu <a href="{origin}">{host}</a>, hergestellt haben, zögern Sie bitte nicht, uns unter <a href="mailto:{contact}">{contact}</a> zu kontaktieren.'
    },
    noCreation: {
      subject: 'Authentifizierungsfehler ein {host}',
      text: `
Eine Identifikationsanfrage wurde von {host} gestellt, aber abgelehnt, da diese E-Mail-Adresse unbekannt oder nicht validiert ist.

Zögern Sie nicht, uns unter {contact} zu kontaktieren.
      `,
      htmlMsg: 'Seitdem wurde ein Ausweisantrag gestellt <a href="{origin}">{host}</a>, Es wurde jedoch abgelehnt, da diese E-Mail-Adresse unbekannt ist oder nicht validiert wurde.',
      htmlCaption: 'Zögern Sie nicht, uns unter zu kontaktieren <a href="mailto:{contact}">{contact}</a>.'
    },
    conflict: {
      subject: 'Fehler beim Erstellen eines Kontos am {host}',
      text: `
Eine Kontoerstellungsanforderung wurde von {host} gestellt, aber abgelehnt, da diese E-Mail-Adresse bereits einem Konto zugeordnet ist.

führt Sie nicht, uns zu gehören unter {contact}.
      `,
      htmlMsg: 'Ein Antrag auf Einrichtung eines Kontos wurde gestellt seit <a href="{origin}">{host}</a>, aber es wurde abgelehnt, weil diese E-Mail-Adresse bereits mit einem Konto verknüpft ist.',
      htmlCaption: 'führt Sie nicht, uns zu gehören unter <a href="mailto:{contact}">{contact}</a>.'
    },
    invitation: {
      subject: 'Treten Sie der {organization} am {host} bei.',
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
      htmlButton: 'Nehmen Sie die Einladung an',
      htmlAlternativeLink: 'Wenn die obige Schaltfläche nicht funktioniert, können Sie diesen Link in die Adressleiste Ihres Browsers kopieren:',
      htmlCaption: 'Wenn Sie ein Problem mit Ihrem Konto haben oder diese Einladung verdächtig finden, kontaktieren Sie uns bitte unter <a href="mailto:{contact}">{contact}</a>.'
    },
    partnerInvitation: {
      subject: 'Die Organisation {organization} auf {host} möchte {partner} als Partner hinzufügen',
      text: `
Ein Administrator der Organisation {organization} lädt Sie als Kontakt für die Organisation {partner} auf {host} ein. Um diese Einladung anzunehmen, kopieren Sie die untenstehende URL in einen Browser. Diese URL ist 10 Tage lang gültig.
{link}

Wenn Sie ein Problem mit Ihrem Konto haben oder diese Einladung verdächtig finden, kontaktieren Sie uns bitte unter {contact}.
      `,
      htmlMsg: `
Ein Administrator der Organisation {organization} lädt Sie als Kontakt für die Organisation {partner} auf {host} ein. Um diese Einladung anzunehmen, klicken Sie auf die Schaltfläche unten. Der Link ist 10 Tage lang gültig.
      `,
      htmlButton: 'Einladung annehmen',
      htmlAlternativeLink: 'Wenn die obige Schaltfläche nicht funktioniert, können Sie diesen Link in die Adressleiste Ihres Browsers kopieren:',
      htmlCaption: 'Wenn Sie ein Problem mit Ihrem Konto haben oder diese Einladung verdächtig finden, kontaktieren Sie uns bitte unter <a href="mailto:{contact}">{contact}</a>.'
    },
    action: {
      subject: 'Führen Sie eine Aktion auf Ihrem Konto bei {host} aus.',
      text: `
Auf dieser Adresse wurde eine Aktion ausgelöst, die eine Bestätigung per E-Mail verlangt. Um diese Aktion zu validieren, kopieren Sie die untenstehende URL in einen Browser. Diese URL ist 15 Minuten lang gültig.

{link}

Wenn Sie auf ein Problem mit Ihrem Konto stoßen oder Sie diese Nachricht verdächtig finden, zögern Sie bitte nicht, uns unter {contact} zu kontaktieren.
      `,
      htmlMsg: `
Auf dieser Adresse wurde eine Aktion ausgelöst, die eine Bestätigung per E-Mail verlangt. Um diese Aktion zu bestätigen, klicken Sie auf die Schaltfläche unten. Der Link ist 15 Minuten lang gültig.
      `,
      htmlButton: 'Validieren Sie',
      htmlAlternativeLink: 'Wenn die obige Schaltfläche nicht funktioniert, können Sie diesen Link in die Adressleiste Ihres Browsers kopieren:',
      htmlCaption: 'Wenn Sie auf ein Problem mit Ihrem Konto stoßen oder diese Nachricht verdächtig finden, kontaktieren Sie uns bitte unter <a href="mailto:{contact}">{contact}</a>.'
    },
    plannedDeletion: {
      subject: 'Konto-Löschung geplant auf {host}',
      text: `
Der Benutzer {user} und alle damit verbundenen Daten werden am {plannedDeletion} gelöscht. {cause}

Um die Löschung abzubrechen, können Sie sich hier anmelden {link}.

Kontaktieren Sie uns gerne unter {contact}.
      `,
      htmlMsg: 'Der Benutzer {user} und alle damit verbundenen Daten werden am {plannedDeletion} gelöscht. {cause}',
      htmlButton: 'Anmelden, um die Löschung abzubrechen',
      htmlAlternativeLink: 'Wenn die Schaltfläche nicht funktioniert, können Sie diesen Link in die Adressleiste Ihres Browsers kopieren:',
      htmlCaption: 'Wenn Sie ein Problem mit Ihrem Konto haben oder diese Nachricht verdächtig finden, kontaktieren Sie uns bitte unter <a href="mailto:{contact}">{contact}</a>.',
      causeInactivity: 'Diese Operation wurde automatisch ausgelöst, weil dieses Konto seit dem {date} inaktiv ist.'
    }
  },
  notifications: {
    sentInvitationTopic: 'eine Einladung wurde gesendet',
    sentInvitation: 'Eine E-Mail wurde an {email} gesendet mit einer Einladung, der Organisation {orgName} beizutreten.',
    acceptedInvitationTopic: 'eine Einladung wurde angenommen',
    acceptedInvitation: 'Der Benutzer {name} ({email}) ist der Organisation {orgName} beigetreten.',
    userCreated: 'Der Benutzer {name} ({email}) hat sich auf der Website {host} registriert.',
    userCreatedOrg: 'Der Benutzer {name} ({email}) hat sich auf der Website {host} in der Organisation {orgName} registriert.',
    sentPartnerInvitationTopic: 'eine Partner-Einladung wurde gesendet',
    sentPartnerInvitation: 'Eine E-Mail wurde an {email} gesendet mit einer Einladung für die Organisation {partnerName}, der Organisation {orgName} als Partner beizutreten.',
    acceptedPartnerInvitationTopic: 'eine Partner-Einladung wurde angenommen',
    acceptedPartnerInvitation: 'Die Organisation {partnerName} ({email}) ist der Organisation {orgName} als Partner beigetreten.',
    addMemberTopic: 'ein Mitglied wurde hinzugefügt',
    addMember: 'Der Benutzer {name} ({email}) ist der Organisation {orgName} beigetreten.'
  }
}
