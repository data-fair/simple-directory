// WARN: do not use underscore in keys, it is used as delimiter when reading
// messages from environment variables

export default {
  root: {
    title: 'Simple Directory',
    description: 'Einfache Verwaltung von Benutzern und Organisationen für moderne webbasierte Architekturen.'
  },
  common: {
    manageNotifications: 'Benachrichtigungen verwalten',
    home: 'Startseite',
    logLink: 'Anmelden / Registrieren',
    logout: 'Abmelden',
    login: 'Anmelden',
    signin: 'Registrieren',
    activateAdminMode: 'Admin-Modus aktivieren',
    deactivateAdminMode: 'Admin-Modus deaktivieren',
    documentation: 'Dokumentation',
    administration: 'Verwaltung',
    myAccount: 'Persönliche Daten',
    myOrganizations: 'Meine Organisationen',
    organization: 'Organisation',
    organizations: 'Organisationen',
    organizationName: 'Name der Organisation',
    user: 'Benutzer',
    users: 'Benutzer',
    createOrganization: 'Organisation erstellen',
    dashboard: 'Dashboard',
    description: 'Beschreibung',
    id: 'Kennung',
    name: 'Name',
    save: 'Speichern',
    send: 'Senden',
    load: 'Hochladen',
    active: 'Aktiv',
    inactive: 'Inaktiv',
    members: 'Mitglieder',
    orgStorageMembers: 'Mitglieder im sekundären Speicher',
    role: 'Rolle',
    search: 'Suchen',
    noResult: 'Kein Ergebnis',
    confirmOk: 'OK',
    confirmCancel: 'Abbrechen',
    confirmTitle: 'Möchten Sie diesen Vorgang bestätigen?',
    firstName: 'Vorname',
    lastName: 'Nachname',
    email: 'E-Mail-Adresse',
    modificationOk: 'Ihre Änderung wurde gespeichert.',
    invitations: 'Einladungen',
    accept: 'Annehmen',
    reject: 'Ablehnen',
    confirmDeleteTitle: '{name} löschen',
    confirmDeleteMsg: 'Möchten Sie diese Ressource wirklich löschen? Die Daten können nicht wiederhergestellt werden.',
    editTitle: '{name} bearbeiten',
    seeTitle: '{name} ansehen',
    loggedAt: 'Letzte Anmeldung',
    createdAt: 'Erstellt am',
    createdPhrase: 'Erstellt von {name} am {date}',
    host: 'Website',
    sites: 'Websites',
    updatedAt: 'Aktualisiert am',
    maxCreatedOrgs: 'Maximale Anzahl erstellbarer Organisationen',
    maxCreatedOrgsShort: 'Max. Org.',
    unlimited: 'unbegrenzt',
    nbCreatedOrgs: 'Anzahl erstellter Organisationen: {count}',
    maxCreatedOrgsValue: 'Maximale Anzahl erstellbarer Organisationen: {value}',
    back: 'Zurück',
    next: 'Weiter',
    password: 'Passwort',
    showPassword: 'Passwort anzeigen',
    hidePassword: 'Passwort ausblenden',
    passwordShown: 'Ihr Passwort ist sichtbar',
    passwordHidden: 'Ihr Passwort ist ausgeblendet',
    checkInbox: 'Prüfen Sie Ihr Postfach',
    spamWarning: 'Falls Sie keine E-Mail erhalten haben, prüfen Sie, ob sie in Ihrem Postfach als Spam eingestuft wurde.',
    validate: 'Bestätigen',
    delete: 'Löschen',
    department: 'Abteilung',
    departments: 'Abteilungen',
    autoAdmin: 'Mich automatisch als Administrator hinzufügen',
    asAdmin: 'Als dieser Benutzer anmelden',
    transfer: 'Auf eine andere Website übertragen',
    delAsAdmin: 'Zurück zu Ihrer Administratorsitzung',
    avatar: 'Avatar',
    birthday: 'Geburtstag',
    missingInfo: 'Fehlende Angaben',
    '2FA': 'Zwei-Faktor-Authentifizierung',
    userAccount: 'Persönliches Konto',
    continue: 'Weiter',
    tooLong: 'Der Text ist zu lang',
    settings: 'Einstellungen',
    emailConfirmed: 'Erstellung abgeschlossen',
    emailNotConfirmed: 'Erstellung nicht abgeschlossen',
    noRole: 'keine Rolle',
    downloadCsv: 'Liste im CSV-Format herunterladen',
    authMode: 'Authentifizierungsmodus',
    authProviders: 'Authentifizierungsanbieter',
    partners: 'Partnerorganisationen',
    contactEmail: 'Kontakt-E-Mail-Adresse',
    orgName: 'Name der Organisation',
    loginSignin: 'Anmelden / Konto erstellen',
    sort: 'Sortieren',
    all: 'alle',
    creationStep: 'Erstellungsschritt',
    oauthTokens: 'OAuth-Token',
    plannedDeletion: 'Geplante Löschung',
    plannedDeletionShort: 'Löschung',
    owner: 'Eigentümer',
    passwordLists: 'Passwörter',
    adminGlobal: 'Globale Verwaltung',
    adminSite: 'Website-Verwaltung',
    no: 'Nein',
    yes: 'Ja',
    redirectSite: 'Website für die Weiterleitung',
    manageOrg: 'Verwaltung der Organisation',
    manageDep: 'Verwaltung der Abteilung'
  },
  doc: {
    about: {
      link: 'Über'
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
        publicUrl: '<b>WICHTIG.</b> Die URL, unter der der Dienst erreichbar ist. Zum Beispiel https://koumoul.com/simple-directory',
        admins: '<b>WICHTIG.</b> Die Liste der E-Mail-Adressen der Administratoren dieses Dienstes.',
        contact: '<b>WICHTIG.</b> Die Kontakt-E-Mail-Adresse für die Benutzer des Dienstes.',
        theme: {
          logo: 'Die URL eines Logos, das das Standardlogo von Simple Directory ersetzt.',
          dark: 'Stellt das gesamte Erscheinungsbild der Seiten auf ein dunkles Design um.<br>Beachten Sie, dass die Standardfarben besser zu einem hellen Design passen: Wenn Sie auf dunkel umstellen, müssen Sie auch diese Farben anpassen.',
          cssUrl: 'Link zu einem Stylesheet, das die Variablen für das Branding ergänzt.<br>WARNUNG: Die HTML-Struktur kann sich von einer Version zur nächsten ändern. Die Pflege eines externen Stylesheets bedeutet bei jedem Upgrade zusätzlichen Aufwand für Sie.',
          cssText: 'CSS-Inhalt als Text, der die Variablen für das Branding ergänzt.<br>WARNUNG: Die HTML-Struktur kann sich von einer Version zur nächsten ändern. Die Pflege eines externen Stylesheets bedeutet bei jedem Upgrade zusätzlichen Aufwand für Sie.'
        },
        secret: {
          public: '<b>WICHTIG.</b> Der Pfad zum öffentlichen RSA-Signaturschlüssel. Siehe die Installationsdokumentation des Dienstes.',
          private: '<b>WICHTIG.</b> Der Pfad zum privaten RSA-Signaturschlüssel. Siehe die Installationsdokumentation des Dienstes.'
        },
        storage: {
          type: `<b>WICHTIG.</b> Die Speicherart für die Persistenz von Benutzern und Organisationen.<br>
Der Standardtyp „file“ ist schreibgeschützt und eignet sich für Entwicklung und Tests oder für Daten, die aus einem anderen System exportiert wurden.<br>
Der Typ „mongo“ setzt den Zugriff auf eine MongoDB-Instanz voraus; er ist die richtige Wahl für die meisten Produktivinstallationen.`,
          file: {
            users: 'Nur für storage.type=file. Der Pfad zur JSON-Datei mit den Benutzerdefinitionen',
            organizations: 'Nur für storage.type=file. Der Pfad zur JSON-Datei mit den Organisationsdefinitionen'
          },
          mongo: {
            url: 'Nur für storage.type=mongo. Die vollständige Verbindungszeichenfolge zur MongoDB-Datenbank.'
          }
        },
        mails: {
          transport: '<b>WICHTIG.</b> Ein JSON-Konfigurationsobjekt für den E-Mail-Versand, kompatibel mit der Bibliothek <a href="https://nodemailer.com/smtp/">nodemailer</a>.',
          from: '<b>WICHTIG.</b> Die Absenderadresse für die vom Dienst versendeten E-Mails.'
        },
        listEntitiesMode: `Schränkt den Zugriff auf die Listen von Benutzern und Organisationen global ein.<br>
Mögliche Werte: 'anonymous', 'authenticated' oder 'admin'.`,
        defaultLoginRedirect: 'Standardweiterleitung nach der Anmeldung. Ohne Angabe wird der Benutzer zu seinem Profil weitergeleitet.',
        onlyCreateInvited: 'Wenn aktiviert, werden Benutzer nicht beim Versand der ersten E-Mail angelegt. Sie müssen in eine Organisation eingeladen werden.',
        tosUrl: '<b>WICHTIG.</b> Die URL Ihrer Nutzungsbedingungen. Wenn dieser Parameter leer ist oder nicht auf eine gültige Webseite verweist, riskieren Sie, Ihren Pflichten gegenüber Ihren Benutzern nicht nachzukommen.'
      }
    },
    use: {
      link: 'Verwendung'
    }
  },
  pages: {
    admin: {
      users: {
        noCreatedOrgsLimit: 'Benutzer können beliebig viele Organisationen erstellen.',
        createdOrgsLimit: 'Benutzer können standardmäßig {defaultMaxCreatedOrgs} Organisation erstellen. | Benutzer können standardmäßig {defaultMaxCreatedOrgs} Organisationen erstellen.',
        explainLimit: 'Legen Sie einen Wert fest, um die Anzahl der Organisationen zu begrenzen, die dieser Benutzer erstellen kann. -1 für eine unbegrenzte Anzahl. Leeren Sie das Feld, um zum Standardwert ({defaultMaxCreatedOrgs}) zurückzukehren.',
        editUserEmailTitle: 'E-Mail-Adresse des Benutzers {name} ändern',
        editUserEmailText: 'Warnung! Die E-Mail-Adresse ist ein wichtiger Schlüssel des Benutzers: Wenn Sie sie ändern, riskieren Sie, eine falsche, nicht funktionierende oder mit anderen Einträgen inkonsistente Adresse einzutragen. Diese Funktion steht nur Administratoren zur Verfügung, um einen Benutzer zu entsperren, dessen Postfach nicht mehr erreichbar ist.',
        drop2FATitle: 'Zwei-Faktor-Authentifizierung des Benutzers {name} zurücksetzen',
        transferTitle: 'Benutzer {name} auf eine andere Website übertragen',
        transferText: 'Der Benutzer wird der ausgewählten Website zugeordnet. Seine SSO-Identitäten werden zurückgesetzt, seine Mitgliedschaften in Organisationen bleiben erhalten. Superadministrator-Konten können nicht übertragen werden.',
        transferTargetSite: 'Zielwebsite',
        transferMainSite: 'Hauptwebsite',
        drop2FAExplain: 'Warnung! Dieser Vorgang ist dafür vorgesehen, einen Benutzer zu entsperren, der sowohl sein Gerät als auch seinen Wiederherstellungscode für die Zwei-Faktor-Authentifizierung verloren hat. Bevor Sie fortfahren, wird dringend empfohlen, die Identität der anfragenden Person auf geeignete Weise zu überprüfen (zum Beispiel durch Rücksprache mit einem Kollegen aus derselben Organisation).'
      },
      organizations: {
        limitOrganizationTitle: 'Limits der Organisation bearbeiten',
        members: 'Mitglied | Mitglieder',
        nbMembers: 'Maximale Anzahl von Mitgliedern (0 für unbegrenzt)'
      },
      sites: {
        createSite: 'Neue Website definieren',
        loginOnSite: 'Auf der Website anmelden',
        colorWarnings: 'Kontrastwarnungen',
        mainSite: 'Hauptwebsite'
      },
      passwordLists: {
        help1: 'Sie können Passwortlisten aus CSV-Dateien hochladen. Diese allgemein bekannten Passwörter werden dann abgelehnt, wenn Benutzer versuchen, sie zu verwenden.',
        help2: 'Passwortlisten finden Sie im Internet, zum Beispiel im Projekt {secLists} oder im Projekt {richelieu} für eine französische Liste.',
        newFile: 'Neue Passwortdatei (ein Passwort pro Zeile)',
        subtitle: '{state} - {date} - {count} Passwort | {state} - {date} - {count} Passwörter',
        confirmDelete: 'Diese Passwortliste löschen?'
      },
      site: {
        title: 'Website-Konfiguration',
        oidcHelp: 'Geben Sie diese Login-Callback-URL ({url}) an den Identitätsanbieter weiter und legen Sie die Scopes "openid", "profile", "email" fest.',
        samlHelp: 'Füllen Sie das Feld unten mit den XML-Metadaten des Identitätsanbieters aus und geben Sie ihm im Gegenzug diesen {link}.',
        samlHelpLink: 'Link',
        mainSiteExplanation: 'Diese Website entspricht der Hauptdomain dieses Dienstes. Ihr Datenbankdokument steuert nur die Darstellung, und zwar nur für die in MAIN_SITE_FROM_DB aufgeführten Kategorien. Authentifizierung, Identitätsanbieter und der Kontobereich stammen immer aus den Umgebungsvariablen.'
      }
    },
    contact: {
      title: 'Kontakt',
      from: 'Ihre E-Mail-Adresse',
      subject: 'Betreff',
      text: 'Ihre Anfrage',
      sent: 'Ihre Anfrage wurde gesendet'
    },
    login: {
      title: 'Anmeldung',
      emailLabel: 'Ihre E-Mail-Adresse',
      success: 'Sie erhalten eine E-Mail an die angegebene Adresse. Bitte öffnen Sie den Link in dieser E-Mail, um Ihre Anmeldung abzuschließen.',
      maildevLink: 'Entwicklungspostfach öffnen',
      newPassword: 'Neues Passwort',
      newPassword2: 'Neues Passwort bestätigen',
      changePassword: 'Passwort erneuern',
      changePasswordTooltip: 'Wenn Sie Ihr Passwort vergessen haben oder es ändern müssen, erneuern Sie es.',
      newPasswordMsg: 'Geben Sie das neue Passwort zweimal ein.',
      changePasswordSent: 'Eine E-Mail wurde an die Adresse {email} gesendet. Sie enthält einen Link, mit dem Sie das Passwort Ihres Kontos ändern können.',
      passwordlessMsg1: 'Zum Anmelden genügt eine E-Mail.',
      passwordlessMsg2: 'Anmelde-E-Mail senden.',
      passwordlessConfirmed: 'Eine E-Mail wurde an die Adresse {email} gesendet. Sie enthält einen Link, mit dem Sie sich auf der Plattform anmelden können.',
      createUserMsg1: 'Wenn Sie sich noch nie auf unserer Plattform angemeldet haben, erstellen Sie bitte ein Konto.',
      createUserMsg2: 'Konto erstellen',
      createUserInvit: 'Erstellen Sie ein Konto, um die Einladung in die Organisation {name} anzunehmen',
      createUserOrganization: 'Möchten Sie eine Organisation erstellen?',
      createUserOrganizationHelp: 'Wenn Sie eine Organisation erstellen, können Sie andere Benutzer einladen, ihr beizutreten, und Ressourcen mit ihnen teilen.',
      tosMsg: 'Bevor Sie ein Konto erstellen, lesen Sie bitte <a href="{tosUrl}" target="_blank">unsere Nutzungsbedingungen</a>.',
      tosConfirm: 'Ich bestätige, dass ich die Nutzungsbedingungen dieser Website gelesen habe.',
      createUserConfirm: 'Konto erstellen',
      createUserConfirmed: 'Eine E-Mail wurde an die Adresse {email} gesendet. Sie enthält einen Link, mit dem Sie die Erstellung Ihres Kontos bestätigen können.',
      adminMode: 'Bestätigen Sie Ihre Identität, um in den Admin-Modus zu wechseln.',
      adminModePromptTitle: 'Admin-Modus',
      adminModePromptMsg: 'Ihr Konto ist ein Superadministrator-Konto. Möchten Sie den Admin-Modus für diese Sitzung aktivieren?',
      adminModePromptAccept: 'Admin-Modus',
      adminModePromptDecline: 'Normale Sitzung',
      oauth: 'Anmelden mit:',
      error: 'Fehler',
      rememberMe: 'Angemeldet bleiben',
      '2FACode': '6-stelliger Code oder Wiederherstellungscode',
      '2FAInfo': 'Geben Sie einen Bestätigungscode ein, um fortzufahren. Sie erhalten diesen Code über die Authentifizierungs-App auf Ihrem Telefon. Wenn Sie Ihr Gerät verlieren, können Sie den Wiederherstellungscode verwenden, den Sie beim Einrichten der Zwei-Faktor-Authentifizierung heruntergeladen haben.',
      configure2FA: 'Zwei-Faktor-Authentifizierung einrichten',
      configure2FAQRCode: 'QR-Code zum Einrichten der Zwei-Faktor-Authentifizierung',
      configure2FAQRCodeMsg: 'Scannen Sie diesen QR-Code mit einer Authentifizierungs-App Ihrer Wahl (zum Beispiel Authy oder Google Authenticator) und geben Sie dann den 6-stelligen Code ein, den diese App anzeigt.',
      configure2FACode: '6-stelliger Code',
      recovery2FA: 'Wiederherstellungscode',
      recovery2FAInfo: 'Achtung! Bewahren Sie den folgenden Wiederherstellungscode an einem sicheren Ort auf. Ohne ihn können Sie Ihr Konto nicht wiederherstellen, wenn Sie das Gerät verlieren, auf dem Sie gerade die Zwei-Faktor-Authentifizierung eingerichtet haben.',
      recovery2FACode: 'Wiederherstellungscode: ',
      recovery2FADownload: 'Datei mit dem Wiederherstellungscode herunterladen',
      recovery2FAContent: 'Wiederherstellungscode für die Zwei-Faktor-Authentifizierung {name}',
      plannedDeletion: 'Geplante Löschung',
      cancelDeletion: 'Löschung des Benutzers abbrechen',
      siteLogo: 'Website-Logo',
      partnerInvitation: 'Partnereinladung',
      changeHost: 'Mit dem Backoffice verknüpftes Konto'
    },
    siteAdmin: {
      account: 'Konto',
      '2FAActive': 'Zwei-Faktor-Authentifizierung aktiv',
      plannedDeletion: 'Löschung geplant am {date}',
      cancelDeletion: 'Geplante Löschung von {name} abbrechen',
      revokeSessions: '{name} von allen Sitzungen abmelden',
      confirmRevokeSessionsMsg: 'Alle Sitzungen dieses Benutzers werden beendet. Bereits geöffnete Seiten bleiben einige Minuten nutzbar, bis ihr Sitzungstoken erneuert werden muss.',
      confirmDeleteMsg: 'Das Konto {email} wird endgültig gelöscht und aus allen Organisationen entfernt, denen es angehört.'
    },
    oauthConsent: {
      title: '{client} möchte auf Ihr Konto zugreifen',
      willBeAble: 'Diese Anwendung kann:',
      redirectHost: 'Sie werden anschließend zu {host} weitergeleitet.',
      account: 'Verwendetes Konto',
      personalAccount: 'Persönliches Konto',
      organizationAccount: 'Organisation',
      allow: 'Erlauben',
      deny: 'Ablehnen',
      broadScope: 'Weitreichender Zugriff',
      unverifiedTitle: 'Nicht verifizierte Anwendung',
      unverifiedCimd: '{client} ist keine verifizierte Anwendung. Sie hat sich mit der Adresse {url} identifiziert; niemand hat sie geprüft.',
      unverifiedDcr: '{client} ist keine verifizierte Anwendung. Sie wurde automatisch registriert; niemand hat ihre Identität geprüft.',
      resourceMcp: 'Sie fordert Zugriff auf den MCP-Server dieser Plattform an.',
      resourceApi: 'Sie fordert Zugriff auf die API dieser Plattform an.',
      noOrganization: 'Sie sind Administrator keiner Organisation, die diese Anwendung autorisieren kann.',
      organization: 'Organisation',
      nhi: 'Identität der Anwendung',
      nhiHint: 'Die Dienstkonten der Organisation, verwaltet von ihren Administratoren auf der Seite der Organisation.',
      noNhi: 'Diese Organisation hat kein Dienstkonto, das diese Anwendung verwenden kann (dessen Bereiche mindestens eine der angeforderten Berechtigungen abdecken). Dienstkonten werden von den Administratoren auf der Seite der Organisation verwaltet.',
      manageNhis: 'Dienstkonten verwalten',
      permissions: 'Erteilte Berechtigungen',
      lifetime: 'Dauer der Autorisierung',
      lifetime1d: '1 Tag',
      lifetime7d: '7 Tage',
      lifetime30d: '30 Tage',
      lifetime90d: '90 Tage',
      lifetime1y: '1 Jahr',
      errorTitle: 'Autorisierung nicht möglich',
      errors: {
        interactionExpired: 'Die Autorisierungsanfrage ist abgelaufen oder wurde bereits bearbeitet. Kehren Sie zur Anwendung zurück und versuchen Sie es erneut.',
        unauthorized: 'Ihre Sitzung ist abgelaufen oder Sie sind nicht angemeldet. Melden Sie sich erneut an und beginnen Sie von der Anwendung aus neu.',
        forbidden: 'Ihre Sitzung kann diese Autorisierung nicht erteilen.',
        generic: 'Die Autorisierungsanfrage ist fehlgeschlagen (Code: {code}).'
      }
    },
    organization: {
      addMember: 'Einen Benutzer einladen, dieser Organisation beizutreten',
      disableInvite: 'Diese Organisation hat bereits die maximale Anzahl von Mitgliedern erreicht.',
      deleteMember: 'Diesen Benutzer aus der Mitgliederliste entfernen',
      editMember: 'Rolle dieses Benutzers in der Organisation ändern',
      memberReadOnly: 'Die Mitgliedschaft dieses Benutzers in der Organisation stammt von einem Identitätsanbieter und kann hier nicht geändert werden.',
      confirmEditMemberTitle: '{name} bearbeiten',
      confirmDeleteMemberTitle: '{name} ausschließen',
      confirmDeleteMemberMsg: 'Möchten Sie diesen Benutzer wirklich aus der Mitgliederliste der Organisation {org} entfernen?',
      deleteMemberSelfWarning: 'Dies ist Ihre eigene Mitgliedschaft: Sie können den Zugriff auf diese Organisation und ihre Ressourcen verlieren und diese Änderung nicht selbst rückgängig machen.',
      editMemberSelfWarning: 'Sie ändern Ihre eigene Rolle: Sie können Ihre Verwaltungsrechte für diese Organisation verlieren und diese Änderung nicht selbst rückgängig machen.',
      deleteMemberLastAdmin: 'Sie sind der letzte Administrator dieser Organisation: Ernennen Sie zuerst einen anderen Administrator, bevor Sie sie verlassen.',
      deleteMemberLastMember: 'Sie sind das letzte Mitglied dieser Organisation und können sie nicht verlassen. Wenn sie nicht mehr genutzt wird, muss sie gelöscht werden.',
      editMemberLastAdmin: 'Sie sind der letzte Administrator dieser Organisation: Ernennen Sie zuerst einen anderen Administrator, bevor Sie Ihre Rolle ändern.',
      deleteMemberSuccess: 'Der Benutzer {name} wurde aus der Organisation ausgeschlossen.',
      inviteEmail: 'E-Mail-Adresse des Benutzers',
      inviteSuccess: 'Eine Einladung wurde an die Adresse {email} gesendet',
      invitePartnerSuccess: 'Eine Einladung wurde an die Adresse {email} gesendet',
      memberConflict: 'Dieser Benutzer ist bereits Mitglied',
      departmentLabelTitle: 'Bezeichnung für das Konzept „Abteilung“',
      departmentLabelHelp: 'Leer lassen, um „{defaultDepartmentLabel}“ anzuzeigen. Ausfüllen, um eine andere Bezeichnung wie „Bereich“, „Agentur“ usw. zu verwenden.',
      addDepartment: '{departmentLabel} erstellen',
      editDepartment: '{departmentLabel} bearbeiten',
      deleteDepartment: '{departmentLabel} löschen',
      confirmEditDepartmentTitle: '{name} bearbeiten',
      confirmDeleteDepartmentTitle: '{name} löschen',
      confirmDeleteDepartmentMsg: 'Möchten Sie {name} wirklich aus Ihrer Organisation löschen?',
      deleteDepartmentHasMembers: 'Diese Abteilung ist {count} Mitglied der Organisation zugewiesen. Sie kann in diesem Zustand nicht gelöscht werden. | Diese Abteilung ist {count} Mitgliedern der Organisation zugewiesen. Sie kann in diesem Zustand nicht gelöscht werden.',
      departmentIdInvalid: 'Die Kennung darf nur Buchstaben, Ziffern und Leerzeichen enthalten.',
      inviteLink: 'Falls es Probleme mit der Kommunikation per E-Mail gibt, können Sie den untenstehenden Bestätigungslink auf anderem Weg übermitteln. Warnung! Sie riskieren, eine falsche oder nicht funktionierende E-Mail-Adresse in die Benutzerdatenbank einzutragen. Diese E-Mail-Adresse kann später mehrere Probleme verursachen: Passwortänderung, Versand von Benachrichtigungen usw.',
      '2FARoles': 'Zwei-Faktor-Authentifizierung.',
      '2FARolesMsg': 'Zwei-Faktor-Authentifizierung für Benutzer mit diesen Rollen verpflichtend machen.',
      sendInvitationLink: 'Einen anderen Einladungslink senden',
      addPartner: 'Eine Partnerorganisation einladen',
      deletePartner: 'Diesen Partner löschen',
      depSortCreation: 'Zuletzt erstellt',
      depSortAlpha: 'Alphabetische Reihenfolge',
      deletePartnerWarning: 'Die Berechtigungen, die dieser Organisation für Ihre Ressourcen gewährt wurden, werden ihr entzogen.',
      partnerInvitationExpired: 'Einladung abgelaufen',
      partnersQuotaHelp: 'Ausstehende Einladungen zählen zum Kontingent, außer den abgelaufenen.',
      partnersQuotaPending: '{count} ausstehende Einladung belegt einen Platz: Löschen Sie sie, um ihn freizugeben, oder warten Sie, bis sie abläuft. | {count} ausstehende Einladungen belegen einen Platz: Löschen Sie eine, um ihn freizugeben, oder warten Sie, bis sie abläuft.',
      fromCache: 'Letzte Synchronisierung dieser Liste mit dem Identitätsanbieter: {fromNow}.',
      roleLabel: 'Bezeichnung für die Rolle „{role}“',
      infoTitle: 'Informationen',
      siteUsersTitle: 'Konten der Website',
      siteUsersHelp: 'Auf dieser Website, der Hauptwebsite der Organisation, erstellte Konten. Als Administrator der Organisation können Sie ihre Zwei-Faktor-Authentifizierung zurücksetzen, eine geplante Löschung abbrechen, ihre Sitzungen beenden oder sie löschen.',
      nhisTitle: 'Dienstkonten (nicht-menschliche Identitäten)',
      nhisHelp: 'Dienstkonten sind die nicht-menschlichen Identitäten der Organisation. Sie authentifizieren sich mit einem Token, das von einem vertrauenswürdigen Identitätsanbieter ausgestellt wurde (zum Beispiel einem Kubernetes-Cluster), oder dienen als Identität der OAuth-Anwendungen (zum Beispiel eines KI-Agenten), die ein Administrator mit ihnen verbindet. Sie haben keine E-Mail-Adresse und ihre Sitzungen sind kurzlebig.',
      addNhi: 'Dienstkonto erstellen',
      editNhi: 'Dienstkonto bearbeiten',
      deleteNhi: 'Dienstkonto löschen',
      confirmDeleteNhiTitle: 'Dienstkonto {name} löschen',
      confirmDeleteNhiMsg: 'Möchten Sie dieses Dienstkonto wirklich löschen? Laufende Tokens funktionieren nach ihrem Ablauf nicht mehr.',
      nhiIssuer: 'Token-Aussteller',
      nhiSubject: 'Subjekt',
      nhiKeyBindingHint: 'Aussteller und Subjekt leer lassen für ein Dienstkonto, das nur von OAuth-Anwendungen verwendet wird.',
      nhiOauthOnly: 'Nur OAuth-Verbindungen',
      nhiConnections: 'OAuth-Verbindungen',
      nhiConnectionsCount: '{count} Verbindung | {count} Verbindungen',
      nhiConnectionLastUsed: 'zuletzt verwendet am {date}',
      nhiConnectionNeverUsed: 'nie verwendet',
      nhiConnectionExpires: 'läuft ab am {date}',
      revokeNhiConnections: 'Verbindungen widerrufen',
      revokeNhiConnectionsTitle: 'Verbindungen von {name} widerrufen',
      revokeNhiConnectionsWarning: 'Der Client kann nicht mehr als dieses Dienstkonto handeln. Bereits ausgestellte Zugriffstoken bleiben bis zu {duration} gültig.',
      nhiAllowedIps: 'Erlaubte Adressen (optional)',
      nhiAllowedIpsHint: 'Adressen oder CIDR-Subnetze, von denen der Token-Austausch akzeptiert wird, zum Beispiel 203.0.113.5 oder 10.4.0.0/16. Leer lassen, um jede Adresse zu akzeptieren.',
      nhiIpBinding: 'Sitzung an die Adresse binden, von der sie erhalten wurde',
      nhiIpBindingHint: 'Ein entwendetes Token wird von anderen Adressen aus unbrauchbar. Aktivieren Sie dies nur, wenn dieses Dienstkonto immer von einer stabilen Adresse aus aufruft: Eine wechselnde Ausgangsadresse (NAT-Pool, Dual-Stack) würde seine Sitzungen unterbrechen.',
      nhiScopes: 'Berechtigungsbereiche (optional)',
      nhiScopesHint: 'Die Berechtigungen dieses Dienstkontos, zum Beispiel datasets:read oder datasets. Leer lassen für ein uneingeschränktes Konto, das mit allen Rechten seiner Rolle handelt.',
      nhiUnrestricted: 'Uneingeschränkter Zugriff (alle Rechte seiner Rolle)',
      nhiJwks: 'JWKS (optional, falls der Anbieter nicht öffentlich erreichbar ist)',
      nhiClientId: 'Client-Kennung (client_id)',
      nhiJwksInvalid: 'Ungültiges JSON für den JWKS: {message}'
    },
    invitation: {
      title: 'Einladung bestätigt',
      msgSameUser: 'Ihre Einladung, Mitglied einer Organisation zu werden, wurde bestätigt. Sie können <a href="{profileUrl}">Ihr Profil</a> aufrufen.',
      msgDifferentUser: 'Diese Einladung, Mitglied einer Organisation zu werden, wurde bestätigt. Sie können sich mit dem eingeladenen Konto <a href="{loginUrl}">anmelden</a>.'
    },
    avatar: {
      changeUser: 'Avatar Ihres Kontos ändern',
      changeOrganization: 'Avatar der Organisation ändern',
      changeDepartment: 'Avatar von „{departmentName}“ ändern',
      reset: 'Standard-Avatar wiederherstellen'
    },
    me: {
      emailNotEditable: 'Diese Adresse kann nicht geändert werden.',
      noOrganization: 'Sie sind nicht Mitglied einer Organisation.',
      operations: 'Sensible Vorgänge',
      deleteMyself: 'Dieses Konto löschen',
      deleteMyselfAlert: 'Wenn Sie Ihr Konto löschen, haben Sie {plannedDeletionDelay} Tage Zeit, den Vorgang abzubrechen. Danach werden alle zugehörigen Daten gelöscht und können nicht wiederhergestellt werden.',
      deleteMyselfCheck: 'Aktivieren Sie dieses Kästchen und klicken Sie auf OK, um die Löschung des Benutzers {name} und aller seiner Daten zu bestätigen.',
      accountChanges: 'Kontowechsel',
      defaultOrg: 'Dieses Konto nach jeder Anmeldung standardmäßig aktivieren',
      ignorePersonalAccount: 'Aktivieren Sie dieses Kästchen, wenn Sie diese Plattform nicht außerhalb eines Organisationskontos nutzen möchten',
      sessions: 'Ihre Sitzungen',
      deleteSession: 'Sitzung auf {deviceName} löschen?',
      deleteSessionWarning: 'Es kann bis zu {duration} dauern, bis das Löschen einer Sitzung vollständig wirksam ist.',
      settings: 'Ihre Einstellungen',
      connectedApplications: 'Verbundene Anwendungen',
      revokeApplication: 'Zugriff widerrufen',
      revokeApplicationTitle: 'Zugriff von {name} widerrufen?',
      revokeApplicationWarning: 'Die Anwendung kann Ihr Konto nicht mehr nutzen. Bereits ausgestellte Zugriffstoken bleiben bis zu {duration} gültig.',
      applicationGrantedOn: 'Autorisiert am {date}',
      applicationLastUsed: 'zuletzt verwendet am {date}',
      applicationNeverUsed: 'nie verwendet',
      applicationExpires: 'läuft ab am {date}',
      applicationPersonalAccount: 'Persönliches Konto'
    },
    colorsPreview: {
      title: 'Vorschau der Farbdarstellung',
      cardTitle: 'Eine Beispielkarte',
      cardText: 'Sie verwendet die Farbe „surface“.'
    },
    partnerInvitation: {
      msg1: 'Die Organisation {name} möchte {partnerName} als Partner hinzufügen, mit {email} als Kontaktadresse.',
      msg2: 'Der Name „{partnerName}“ dient nur der Orientierung und entspricht nicht unbedingt dem genauen Namen Ihrer Organisation.',
      diffEmail: 'Sie sind mit dem Benutzerkonto {userName} ({userEmail}) angemeldet. Sie können sich mit einem anderen Konto anmelden oder über die Schaltfläche unten ein neues Konto erstellen.',
      noUser1: 'Sie haben bereits ein Konto? Melden Sie sich an, Sie werden anschließend auf diese Seite zurückgeleitet.',
      noUser2: 'Sie haben noch kein Konto? Erstellen Sie eines, Sie werden anschließend auf diese Seite zurückgeleitet.',
      noOrg: 'Sie sind nicht Mitglied einer Organisation. Sie können eine neue Organisation erstellen und die Einladung in deren Namen annehmen.',
      org: 'Sie können diese Einladung im Namen einer Organisation annehmen, die Sie verwalten, oder eine neue Organisation erstellen und die Einladung in deren Namen annehmen.',
      createOrg: 'Neue Organisation erstellen',
      newOrgName: 'Name der neuen Organisation',
      create: 'Erstellen',
      acceptAs: 'Im Namen von {name} annehmen'
    },
    changeHost: {
      msg1: 'Das Konto {email} existiert nicht auf {host}, aber auf {mainHost}.',
      sso1: 'Lösung: Melden Sie sich über {mainHost} an',
      sso2: 'Die Anmeldeseite bietet eine Schaltfläche, um sich über {mainHost} anzumelden. Sie können auch <a class="text-primary" href="{mainHostLogin}">diesen Link</a> verwenden.',
      solution1: 'Lösung: Konto nach {host} verschieben',
      solution2: 'Wenn Sie diese Lösung wählen, können Sie sich nicht mehr bei {mainHost} anmelden.',
      confirmMigration: 'Konto nach {host} verschieben und den Zugriff auf {mainHost} verlieren'
    },
    orgStorage: {
      activate: 'Sekundären Benutzerspeicher aktivieren',
      link: 'Anmeldelink für diesen sekundären Speicher',
      ldap: 'LDAP-Konfiguration'
    }
  },
  errors: {
    badEmail: 'Die E-Mail-Adresse ist leer oder ungültig.',
    badProviderInvitEmail: 'Die E-Mail-Adresse, mit der Sie sich gerade angemeldet haben, stimmt nicht mit der Adresse der erhaltenen Einladung überein',
    maxCreatedOrgs: 'Der Benutzer kann keine weiteren Organisationen erstellen. Limit erreicht.',
    permissionDenied: 'Unzureichende Berechtigungen.',
    nonEmptyOrganization: 'Sie müssen zuerst die anderen Mitglieder aus dieser Organisation entfernen',
    userUnknown: 'Unbekannter Benutzer.',
    orgaUnknown: 'Unbekannte Organisation.',
    invitationConflict: 'Dieser Benutzer ist bereits Mitglied der Organisation.',
    unknownRole: 'Die Rolle {role} ist unbekannt.',
    serviceUnavailable: 'Dienst wegen Wartungsarbeiten nicht verfügbar.',
    badCredentials: 'Ungültige E-Mail-Adresse oder ungültiges Passwort.',
    updatePassword: 'Sie müssen Ihr Passwort aktualisieren, da es gemäß unseren Sicherheitsrichtlinien zu lange nicht geändert wurde.',
    missingToken: 'Der Parameter id_token fehlt.',
    invalidToken: 'Das Token ist ungültig. Möglicherweise ist es abgelaufen.',
    differentPasswords: 'Die Passwörter stimmen nicht überein',
    noPasswordless: 'Die passwortlose Authentifizierung wird von diesem Dienst nicht akzeptiert.',
    rateLimitAuth: 'Zu viele Versuche in kurzer Zeit. Bitte warten Sie, bevor Sie es erneut versuchen.',
    invalidInvitationToken: 'Der Einladungslink, den Sie erhalten haben, ist ungültig.',
    expiredInvitationToken: 'Der Einladungslink, den Sie erhalten haben, ist abgelaufen. Sie können diese Einladung nicht mehr annehmen.',
    maxNbMembers: 'Die Organisation hat bereits die maximale Anzahl von Mitgliedern erreicht, die ihr Kontingent erlaubt.',
    maxNbDepartments: 'Die Organisation hat bereits die maximale Anzahl von Abteilungen erreicht, die ihr Kontingent erlaubt.',
    maxNbPartners: 'Die Organisation hat bereits die maximale Anzahl von Partnern erreicht, die ihr Kontingent erlaubt, nicht abgelaufene ausstehende Einladungen eingeschlossen.',
    unknownOAuthProvider: 'OAuth-Authentifizierung wird nicht unterstützt.',
    unknownSAMLProvider: 'SAML-Authentifizierung wird nicht unterstützt.',
    adminModeOnly: 'Funktion nur für Superadministratoren verfügbar.',
    adminChangeHostBlocked: 'Superadministratoren können ihr Konto nicht auf eine sekundäre Website übertragen. Melden Sie sich über die Hauptwebsite an.',
    emailNotConfirmed: 'Ihre E-Mail-Adresse wurde noch nicht bestätigt. Ein neuer Bestätigungslink wurde Ihnen soeben zugesandt; öffnen Sie ihn, um Ihr Konto zu aktivieren.',
    '2FANotConfigured': 'Die Zwei-Faktor-Authentifizierung ist für dieses Konto erforderlich, aber noch nicht eingerichtet.',
    passwordless2FA: 'Die passwortlose Authentifizierung ist nicht mit der Zwei-Faktor-Authentifizierung vereinbar, die für dieses Konto erforderlich ist.',
    bad2FAToken: 'Ungültiger oder abgelaufener Bestätigungscode für die Zwei-Faktor-Authentifizierung',
    plannedDeletion: 'Die Löschung des Benutzers {name} und aller zugehörigen Daten ist für den {plannedDeletion} geplant.',
    onlyCreateInvited: 'Sie können kein Konto direkt erstellen. Sie müssen von einer Organisation eingeladen werden.',
    badIDPQuery: 'Die Anfrage wurde vom Identitätsanbieter als ungültig eingestuft.',
    badIDPResponse: 'Ungültige Antwort des Identitätsanbieters, bitte melden Sie sich erneut an.',
    duplicateDep: 'Die neue Abteilung ist ein Duplikat',
    passwordEntropy: 'Das Passwort ist nicht stark genug.',
    passwordMinLength: 'Das Passwort muss mindestens {minLength} Zeichen enthalten.',
    passwordMinCharClasses: 'Das Passwort muss mindestens {minCharClasses} verschiedene Zeichenarten enthalten (Kleinbuchstabe, Großbuchstabe, Ziffer, Sonderzeichen).',
    forbiddenPassword: 'Dieses Passwort wurde in einer Liste bekannter Passwörter gefunden und kann nicht verwendet werden.',
    samePassword: 'Das neue Passwort muss sich vom alten Passwort unterscheiden.',
    conflict2FA: 'Die Zwei-Faktor-Authentifizierung ist für dieses Konto bereits eingerichtet.',
    oauthNoEmail: 'Anmeldung abgelehnt: Der Identitätsanbieter hat keine E-Mail-Adresse übermittelt.',
    oauthEmailNotVerified: 'Anmeldung abgelehnt: Der Identitätsanbieter meldet diese E-Mail-Adresse nicht als verifiziert.',
    githubNoVerifiedEmail: 'Anmeldung abgelehnt: Im GitHub-Konto wurde keine verifizierte primäre E-Mail-Adresse gefunden.',
    facebookDisabled: 'Die Anmeldung mit Facebook ist deaktiviert: Facebook gibt nicht an, ob die E-Mail-Adresse verifiziert wurde.',
    partnerInvitationMismatch: 'Diese Anfrage entspricht nicht der gesendeten Einladung.',
    partnerConflict: 'Diese Organisation ist bereits Partner.',
    noPendingPartnerInvitation: 'Es ist keine Einladung ausstehend.',
    memberOfParentOrg: 'Dieser Benutzer ist Mitglied der übergeordneten Organisation und kann keiner Abteilung hinzugefügt werden.',
    memberOfDepartment: 'Dieser Benutzer ist Mitglied einer Abteilung und kann der übergeordneten Organisation nicht hinzugefügt werden.',
    departmentUnknown: 'Unbekannte Abteilung.',
    unknownOrgRole: 'Die Rolle {role} ist in der Organisation {org} unbekannt.',
    missingDepartmentAttribute: 'Der Identitätsanbieter hat das erforderliche Abteilungsattribut nicht übermittelt.',
    otherCoreIdProvider: 'Dieser Benutzer ist bereits mit einem anderen Haupt-Identitätsanbieter verknüpft.',
    authOnlyOtherSiteChain: 'Die Website {host} kann nicht als Referenz für die Authentifizierung verwendet werden: Sie ist ebenfalls so konfiguriert, dass die Authentifizierung nur auf einer anderen Website erfolgt.',
    spamSuspected: 'Nachricht abgelehnt: Die Aktivität ähnelt der eines Spam-Bots.',
    rateLimitMessages: 'Zu viele Nachrichten in kurzer Zeit. Bitte warten Sie, bevor Sie es erneut versuchen.'
  },
  mails: {
    // the message forwarded by the contact form
    contact: {
      intro: 'Nachricht über das Kontaktformular von {site}, gesendet von {from}'
    },
    creation: {
      subject: 'Willkommen bei {host}',
      text: `
Über {host} wurde die Erstellung eines Kontos beantragt. Um das Konto zu aktivieren, kopieren Sie die folgende URL in die Adressleiste Ihres Browsers. Diese URL ist 15 Minuten lang gültig.

{link}

Wenn Sie ein Problem mit Ihrem Konto haben oder kein Konto auf {host} beantragt haben, kontaktieren Sie uns gerne unter {contact}.
      `,
      htmlMsg: 'Über <a href="{origin}">{host}</a> wurde die Erstellung eines Kontos beantragt. Um das Konto zu aktivieren, klicken Sie auf die Schaltfläche unten. Der Link ist 15 Minuten lang gültig.',
      htmlButton: 'Kontoerstellung bestätigen',
      htmlAlternativeLink: 'Wenn die Schaltfläche nicht funktioniert, können Sie diesen Link in die Adressleiste Ihres Browsers kopieren:',
      htmlCaption: 'Wenn Sie ein Problem mit Ihrem Konto haben oder kein Konto auf <a href="{origin}">{host}</a> beantragt haben, kontaktieren Sie uns gerne unter <a href="mailto:{contact}">{contact}</a>.'
    },
    login: {
      subject: 'Anmeldung bei {host}',
      text: `
Über {host} wurde eine Anmeldung angefordert. Um sie zu bestätigen, kopieren Sie die folgende URL in die Adressleiste Ihres Browsers. Diese URL ist 15 Minuten lang gültig.

{link}

Wenn Sie ein Problem mit Ihrem Konto haben oder diese Anmeldung bei {host} nicht angefordert haben, kontaktieren Sie uns gerne unter {contact}.
      `,
      htmlMsg: 'Über <a href="{origin}">{host}</a> wurde eine Anmeldung angefordert. Um sie zu bestätigen, klicken Sie auf die Schaltfläche unten. Der Link ist 15 Minuten lang gültig.',
      htmlButton: 'Bei {host} anmelden',
      htmlAlternativeLink: 'Wenn die Schaltfläche nicht funktioniert, können Sie diesen Link in die Adressleiste Ihres Browsers kopieren:',
      htmlCaption: 'Wenn Sie ein Problem mit Ihrem Konto haben oder diese Anmeldung bei <a href="{origin}">{host}</a> nicht angefordert haben, kontaktieren Sie uns gerne unter <a href="mailto:{contact}">{contact}</a>.'
    },
    noCreation: {
      subject: 'Authentifizierung bei {host} fehlgeschlagen',
      text: `
Über {host} wurde eine Anmeldung angefordert, aber abgelehnt, da diese E-Mail-Adresse unbekannt ist oder noch nicht bestätigt wurde.

Kontaktieren Sie uns gerne unter {contact}.
      `,
      htmlMsg: 'Über <a href="{origin}">{host}</a> wurde eine Anmeldung angefordert, aber abgelehnt, da diese E-Mail-Adresse unbekannt ist oder noch nicht bestätigt wurde.',
      htmlCaption: 'Kontaktieren Sie uns gerne unter <a href="mailto:{contact}">{contact}</a>.'
    },
    conflict: {
      subject: 'Kontoerstellung auf {host} fehlgeschlagen',
      text: `
Über {host} wurde die Erstellung eines Kontos beantragt, aber abgelehnt, da diese E-Mail-Adresse bereits mit einem Konto verknüpft ist.

Kontaktieren Sie uns gerne unter {contact}.
      `,
      htmlMsg: 'Über <a href="{origin}">{host}</a> wurde die Erstellung eines Kontos beantragt, aber abgelehnt, da diese E-Mail-Adresse bereits mit einem Konto verknüpft ist.',
      htmlCaption: 'Kontaktieren Sie uns gerne unter <a href="mailto:{contact}">{contact}</a>.'
    },
    invitation: {
      subject: 'Treten Sie der Organisation {organization} auf {host} bei',
      text: `
Ein Administrator der Organisation {organization} hat Sie eingeladen, ihr beizutreten. Um diese Einladung anzunehmen, kopieren Sie die folgende URL in die Adressleiste Ihres Browsers. Diese URL ist 10 Tage lang gültig.

{link}

Wenn Sie ein Problem mit Ihrem Konto haben oder diese Einladung verdächtig finden, kontaktieren Sie uns gerne unter {contact}.
      `,
      htmlMsg: `
Ein Administrator der Organisation {organization} hat Sie eingeladen, ihr beizutreten. Um diese Einladung anzunehmen, klicken Sie auf die Schaltfläche unten. Der Link ist 10 Tage lang gültig.
      `,
      htmlButton: 'Einladung annehmen',
      htmlAlternativeLink: 'Wenn die Schaltfläche nicht funktioniert, können Sie diesen Link in die Adressleiste Ihres Browsers kopieren:',
      htmlCaption: 'Wenn Sie ein Problem mit Ihrem Konto haben oder diese Einladung verdächtig finden, kontaktieren Sie uns gerne unter <a href="mailto:{contact}">{contact}</a>.'
    },
    invitationSecondary: {
      subject: 'Treten Sie der Organisation {organization} auf {host} bei',
      text: `
Ein Administrator der Organisation {organization} hat Sie eingeladen, ihr auf {host} beizutreten, um auf {secondaryHost} zuzugreifen. Um diese Einladung anzunehmen, kopieren Sie die folgende URL in die Adressleiste Ihres Browsers. Diese URL ist 10 Tage lang gültig.

{link}

Wenn Sie ein Problem mit Ihrem Konto haben oder diese Einladung verdächtig finden, kontaktieren Sie uns gerne unter {contact}.
      `,
      htmlMsg: `
Ein Administrator der Organisation {organization} hat Sie eingeladen, ihr auf {host} beizutreten, um auf <b>{secondaryHost}</b> zuzugreifen. Um diese Einladung anzunehmen, klicken Sie auf die Schaltfläche unten. Der Link ist 10 Tage lang gültig.
      `,
      htmlButton: 'Einladung annehmen',
      htmlAlternativeLink: 'Wenn die Schaltfläche nicht funktioniert, können Sie diesen Link in die Adressleiste Ihres Browsers kopieren:',
      htmlCaption: 'Wenn Sie ein Problem mit Ihrem Konto haben oder diese Einladung verdächtig finden, kontaktieren Sie uns gerne unter <a href="mailto:{contact}">{contact}</a>.'
    },
    partnerInvitation: {
      subject: 'Die Organisation {organization} auf {host} möchte {partner} als Partner hinzufügen',
      text: `
Ein Administrator der Organisation {organization} lädt Sie als Kontaktperson der Organisation {partner} ein, ihr auf {host} beizutreten. Um diese Einladung anzunehmen, kopieren Sie die folgende URL in die Adressleiste Ihres Browsers. Diese URL ist 10 Tage lang gültig.

{link}

Wenn Sie ein Problem mit Ihrem Konto haben oder diese Einladung verdächtig finden, kontaktieren Sie uns bitte unter {contact}.
      `,
      htmlMsg: `
Ein Administrator der Organisation {organization} lädt Sie als Kontaktperson der Organisation {partner} ein, ihr auf {host} beizutreten. Um diese Einladung anzunehmen, klicken Sie auf die Schaltfläche unten. Der Link ist 10 Tage lang gültig.
      `,
      htmlButton: 'Einladung annehmen',
      htmlAlternativeLink: 'Wenn die Schaltfläche oben nicht funktioniert, können Sie diesen Link in die Adressleiste Ihres Browsers kopieren:',
      htmlCaption: 'Wenn Sie ein Problem mit Ihrem Konto haben oder diese Einladung verdächtig finden, kontaktieren Sie uns bitte unter <a href="mailto:{contact}">{contact}</a>.'
    },
    action: {
      subject: 'Aktion für Ihr Konto auf {host} ausführen',
      text: `
Für diese Adresse wurde eine Aktion ausgelöst, die eine Bestätigung per E-Mail erfordert. Um diese Aktion zu bestätigen, kopieren Sie die folgende URL in die Adressleiste Ihres Browsers. Diese URL ist 15 Minuten lang gültig.

{link}

Wenn Sie ein Problem mit Ihrem Konto haben oder diese Nachricht verdächtig finden, kontaktieren Sie uns gerne unter {contact}.
      `,
      htmlMsg: `
Für diese Adresse wurde eine Aktion ausgelöst, die eine Bestätigung per E-Mail erfordert. Um diese Aktion zu bestätigen, klicken Sie auf die Schaltfläche unten. Der Link ist 15 Minuten lang gültig.
      `,
      htmlButton: 'Bestätigen',
      htmlAlternativeLink: 'Wenn die Schaltfläche nicht funktioniert, können Sie diesen Link in die Adressleiste Ihres Browsers kopieren:',
      htmlCaption: 'Wenn Sie ein Problem mit Ihrem Konto haben oder diese Nachricht verdächtig finden, kontaktieren Sie uns gerne unter <a href="mailto:{contact}">{contact}</a>.'
    },
    plannedDeletion: {
      subject: 'Geplante Löschung Ihres Kontos auf {host}',
      text: `
Der Benutzer {user} und alle zugehörigen Daten werden am {plannedDeletion} endgültig gelöscht. {cause}

Um die Löschung abzubrechen, können Sie sich über diesen Link anmelden: {link}.

Kontaktieren Sie uns gerne unter {contact}.
      `,
      htmlMsg: 'Der Benutzer {user} und alle zugehörigen Daten werden am {plannedDeletion} endgültig gelöscht. {cause}',
      htmlButton: 'Anmelden, um die Löschung abzubrechen',
      htmlAlternativeLink: 'Wenn die Schaltfläche nicht funktioniert, können Sie diesen Link in die Adressleiste Ihres Browsers kopieren:',
      htmlCaption: 'Kontaktieren Sie uns gerne unter <a href="mailto:{contact}">{contact}</a>.',
      causeInactivity: 'Dieser Vorgang wurde automatisch ausgelöst, weil dieses Konto seit dem {date} inaktiv ist.'
    }
  },
  notifications: {
    sentInvitationTopic: 'eine Einladung wurde gesendet',
    sentInvitation: 'Eine E-Mail mit einer Einladung, der Organisation {orgName} beizutreten, wurde an {email} gesendet.',
    acceptedInvitationTopic: 'eine Einladung wurde angenommen',
    acceptedInvitation: 'Der Benutzer {name} ({email}) ist der Organisation {orgName} beigetreten.',
    userCreated: 'Der Benutzer {name} ({email}) hat sich auf der Website {host} registriert.',
    userCreatedOrg: 'Der Benutzer {name} ({email}) hat sich auf der Website {host} in der Organisation {orgName} registriert.',
    sentPartnerInvitationTopic: 'eine Partnereinladung wurde gesendet',
    sentPartnerInvitation: 'Eine E-Mail mit einer Einladung für die Organisation {partnerName}, der Organisation {orgName} als Partner beizutreten, wurde an {email} gesendet.',
    acceptedPartnerInvitationTopic: 'eine Partnereinladung wurde angenommen',
    acceptedPartnerInvitation: 'Die Organisation {partnerName} ({email}) ist der Organisation {orgName} als Partner beigetreten.',
    addMemberTopic: 'ein Mitglied wurde hinzugefügt',
    addMember: 'Der Benutzer {name} ({email}) ist der Organisation {orgName} beigetreten.'
  },
  // server-side only (not in publicMessages): reported through
  // mainSiteWarnings on the sites API and by the boot check
  mainSite: {
    ignoredField: 'Das Feld „{field}“ wird auf der Hauptwebsite ignoriert: Diese Konfiguration stammt aus den Umgebungsvariablen.',
    ignoredCategory: 'Der gespeicherte Wert für „{category}“ wird ignoriert: MAIN_SITE_FROM_DB enthält diese Kategorie nicht.'
  },
  // server-side only: simple-directory's own scopes, merged with the platform scopes
  scopes: {
    organizations: 'Alle Organisationsbereiche',
    'organizations:read': 'Organisationen, ihre Rollen und Mitglieder lesen',
    'all:read': 'Alles lesen, was die Rolle erlaubt, in allen Diensten',
    'all:write': 'Alles lesen und bearbeiten, was die Rolle erlaubt, in allen Diensten',
    'all:admin': 'Alle Rechte, die die Rolle erlaubt, in allen Diensten'
  }
}
