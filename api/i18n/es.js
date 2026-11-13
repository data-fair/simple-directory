// WARN: do not use underscore in keys, it is used as delimiter when reading
// messages from environment variables

export default {
  root: {
    title: 'Simple Directory',
    description: 'Gestión sencilla de usuarios y organizaciones para arquitecturas web modernas.'
  },
  common: {
    manageNotifications: 'Gestionar las notificaciones',
    home: 'Inicio',
    logLink: 'Iniciar sesión / Registrarse',
    logout: 'Cerrar sesión',
    login: 'Iniciar sesión',
    signin: 'Registrarse',
    activateAdminMode: 'Activar el modo de administración',
    deactivateAdminMode: 'Desactivar el modo de administración',
    documentation: 'Documentación',
    administration: 'Administración',
    myAccount: 'Información personal',
    myOrganizations: 'Mis organizaciones',
    organization: 'Organización',
    organizations: 'Organizaciones',
    organizationName: 'Nombre de la organización',
    user: 'Usuario',
    users: 'Usuarios',
    createOrganization: 'Crear una organización',
    dashboard: 'Panel',
    description: 'Descripción',
    id: 'Identificador',
    name: 'Nombre',
    save: 'Guardar',
    send: 'Enviar',
    load: 'Subir',
    active: 'Activo',
    inactive: 'Inactivo',
    members: 'Miembros',
    orgStorageMembers: 'Miembros en el almacenamiento secundario',
    role: 'Rol',
    search: 'Buscar',
    noResult: 'Sin resultados',
    confirmOk: 'Aceptar',
    confirmCancel: 'Cancelar',
    confirmTitle: '¿Desea confirmar esta operación?',
    firstName: 'Nombre',
    lastName: 'Apellidos',
    email: 'Correo electrónico',
    modificationOk: 'Se ha guardado su cambio.',
    invitations: 'Invitaciones',
    accept: 'Aceptar',
    reject: 'Rechazar',
    confirmDeleteTitle: 'Eliminar {name}',
    confirmDeleteMsg: '¿Está seguro de que desea eliminar este recurso? Los datos no se podrán recuperar.',
    editTitle: 'Editar {name}',
    seeTitle: 'Ver {name}',
    loggedAt: 'Último inicio de sesión',
    createdAt: 'Creado el',
    createdPhrase: 'Creado por {name} el {date}',
    host: 'Sitio',
    sites: 'Sitios',
    updatedAt: 'Actualizado el',
    maxCreatedOrgs: 'Número máximo de organizaciones que se pueden crear',
    maxCreatedOrgsShort: 'Máx. org.',
    unlimited: 'ilimitado',
    nbCreatedOrgs: 'Número de organizaciones creadas: {count}',
    maxCreatedOrgsValue: 'Número máximo de organizaciones que se pueden crear: {value}',
    back: 'Atrás',
    next: 'Siguiente',
    password: 'Contraseña',
    showPassword: 'Mostrar la contraseña',
    hidePassword: 'Ocultar la contraseña',
    passwordShown: 'Su contraseña está visible',
    passwordHidden: 'Su contraseña está oculta',
    checkInbox: 'Revise su correo',
    spamWarning: 'Si no ha recibido ningún correo electrónico, compruebe que no se haya clasificado automáticamente como spam.',
    validate: 'Validar',
    delete: 'Eliminar',
    department: 'Departamento',
    departments: 'Departamentos',
    autoAdmin: 'Añadirme automáticamente como administrador',
    asAdmin: 'Iniciar sesión como este usuario',
    transfer: 'Transferir a otro sitio',
    delAsAdmin: 'Volver a mi sesión de administrador',
    avatar: 'Avatar',
    birthday: 'Fecha de nacimiento',
    missingInfo: 'Falta información',
    '2FA': 'Autenticación de dos factores',
    userAccount: 'Cuenta personal',
    continue: 'Continuar',
    tooLong: 'El texto es demasiado largo',
    settings: 'configuración',
    emailConfirmed: 'Creación finalizada',
    emailNotConfirmed: 'Creación no finalizada',
    noRole: 'sin rol',
    downloadCsv: 'Descargar la lista en formato CSV',
    authMode: 'Modo de autenticación',
    authProviders: 'Proveedores de autenticación',
    partners: 'Organizaciones socias',
    contactEmail: 'Correo electrónico de contacto',
    orgName: 'Nombre de la organización',
    loginSignin: 'Iniciar sesión / crear una cuenta',
    sort: 'Ordenar',
    all: 'todos',
    creationStep: 'Paso de creación',
    oauthTokens: 'Tokens OAuth',
    plannedDeletion: 'Eliminación programada',
    plannedDeletionShort: 'Eliminación',
    owner: 'Propietario',
    passwordLists: 'Contraseñas',
    adminGlobal: 'Administración global',
    adminSite: 'Administración del sitio',
    no: 'No',
    yes: 'Sí',
    redirectSite: 'Sitio de redirección',
    manageOrg: 'Gestión de la organización',
    manageDep: 'Gestión del departamento'
  },
  doc: {
    about: {
      link: 'Acerca de'
    },
    install: {
      link: 'Instalación'
    },
    config: {
      link: 'Configuración',
      i18nKey: 'Clave en el archivo I18N',
      i18nVar: 'Variable de entorno',
      i18nVal: 'Valor',
      varKey: 'Clave en el archivo de configuración',
      varName: 'Variable de entorno',
      varDesc: 'Descripción',
      varDefault: 'Valor por defecto',
      varDescriptions: {
        publicUrl: '<b>IMPORTANTE.</b> La URL en la que se expondrá el servicio. Por ejemplo https://koumoul.com/simple-directory',
        admins: '<b>IMPORTANTE.</b> La lista de direcciones de correo electrónico de los administradores del servicio.',
        contact: '<b>IMPORTANTE.</b> La dirección de correo electrónico de contacto para los usuarios del servicio.',
        theme: {
          logo: 'La URL del logotipo que sustituirá al logotipo por defecto de <i>Simple Directory</i>.',
          dark: 'Aplicar una apariencia oscura a todas las páginas.<br>Tenga en cuenta que los colores por defecto están pensados para un tema claro. Si cambia al tema oscuro, también tendrá que modificar estos colores.',
          cssUrl: 'Enlace a una hoja de estilos que complementa las variables de personalización.<br>ATENCIÓN: la estructura HTML puede cambiar considerablemente de una versión a otra. Mantener esta hoja de estilos le supondrá trabajo adicional en cada actualización.',
          cssText: 'Contenido CSS en texto.<br>ATENCIÓN: la estructura HTML puede cambiar considerablemente de una versión a otra. Mantener esta hoja de estilos le supondrá trabajo adicional en cada actualización.'
        },
        secret: {
          public: '<b>IMPORTANTE.</b> La ruta de la clave pública de firma RSA. Consulte la documentación de instalación del servicio.',
          private: '<b>IMPORTANTE.</b> La ruta de la clave privada de firma RSA. Consulte la documentación de instalación del servicio.'
        },
        storage: {
          type: `<b>IMPORTANTE.</b> El tipo de almacenamiento para la persistencia de usuarios y organizaciones.<br>
El tipo "file", por defecto, es de solo lectura y está pensado para desarrollo/pruebas o para usar una colección de usuarios exportada de otro sistema.<br>
El tipo "mongo" requiere acceso a una base de datos MongoDB: es el modo adecuado para la mayoría de las instalaciones en producción.`,
          file: {
            users: 'Solo para storage.type=file. La ruta del archivo JSON que contiene las definiciones de usuarios',
            organizations: 'Solo para storage.type=file. La ruta del archivo JSON que contiene las definiciones de organizaciones'
          },
          mongo: {
            url: 'Solo para storage.type=mongo. La cadena de conexión completa a la base de datos MongoDB.'
          }
        },
        mails: {
          transport: '<b>IMPORTANTE.</b> Un objeto JSON de configuración del transporte de correo, compatible con la biblioteca <a href="https://nodemailer.com/smtp/">nodemailer</a>.',
          from: '<b>IMPORTANTE.</b> La dirección que figurará como remitente de los correos electrónicos enviados por el servicio.'
        },
        listEntitiesMode: `Permite restringir de forma global el acceso a las listas de usuarios y organizaciones.<br>
Puede valer 'anonymous', 'authenticated' o 'admin'.`,
        defaultLoginRedirect: 'Redirección por defecto tras iniciar sesión. Si no se especifica, el usuario será redirigido a su perfil.',
        onlyCreateInvited: 'Si es verdadero, los usuarios no se crearán al enviar el primer correo electrónico. Deben ser invitados a una organización.',
        tosUrl: '<b>IMPORTANTE.</b> Una URL a sus condiciones generales de uso. Si este parámetro no está definido o no apunta a una página web válida, corre el riesgo de no cumplir sus obligaciones con sus usuarios.'
      }
    },
    use: {
      link: 'Uso'
    }
  },
  pages: {
    admin: {
      users: {
        noCreatedOrgsLimit: 'Los usuarios pueden crear un número ilimitado de organizaciones.',
        createdOrgsLimit: 'Los usuarios pueden crear {defaultMaxCreatedOrgs} organización por defecto. | Los usuarios pueden crear {defaultMaxCreatedOrgs} organizaciones por defecto.',
        explainLimit: 'Defina un valor para limitar el número de organizaciones que este usuario puede crear. -1 para un número ilimitado. Vacíe el campo para volver al valor por defecto ({defaultMaxCreatedOrgs}).',
        editUserEmailTitle: 'Cambiar la dirección de correo electrónico del usuario {name}',
        editUserEmailText: '¡Atención! El correo electrónico es un identificador importante del usuario: al modificarlo, corre el riesgo de introducir una dirección incorrecta, que no funcione o que sea incoherente con otros datos. Esta función solo se ofrece a los administradores para desbloquear a un usuario cuyo buzón ha dejado de ser accesible.',
        drop2FATitle: 'Restablecer la autenticación de dos factores del usuario {name}',
        transferTitle: 'Transferir el usuario {name} a otro sitio',
        transferText: 'El usuario quedará vinculado al sitio seleccionado. Sus identidades SSO se restablecen y conserva su pertenencia a las organizaciones. Las cuentas de superadministrador no se pueden transferir.',
        transferTargetSite: 'Sitio de destino',
        transferMainSite: 'Sitio principal',
        drop2FAExplain: '¡Atención! Esta operación está reservada para desbloquear a un usuario que ha perdido tanto su dispositivo como su código de recuperación de la autenticación de dos factores. Antes de continuar, se recomienda encarecidamente verificar de algún modo la identidad de la persona que realiza la solicitud (por ejemplo, contactando con un compañero de la misma organización).'
      },
      organizations: {
        limitOrganizationTitle: 'Modificar los límites de la organización',
        members: 'miembro | miembros',
        nbMembers: 'Número máximo de miembros (0 para sin límite)'
      },
      sites: {
        createSite: 'Definir un nuevo sitio',
        loginOnSite: 'Iniciar sesión en el sitio',
        colorWarnings: 'Advertencias de contraste',
        mainSite: 'Sitio principal'
      },
      passwordLists: {
        help1: 'Puede subir listas de contraseñas a partir de archivos CSV. Estas contraseñas demasiado conocidas se rechazarán si los usuarios intentan utilizarlas.',
        help2: 'Puede encontrar archivos de listas de contraseñas en internet, por ejemplo en el proyecto {secLists} o en el proyecto {richelieu} para una lista en francés.',
        newFile: 'Nuevo archivo de contraseñas (una contraseña por línea)',
        subtitle: '{state} - {date} - {count} contraseña | {state} - {date} - {count} contraseñas',
        confirmDelete: '¿Eliminar esta lista de contraseñas?'
      },
      site: {
        title: 'Configuración del sitio',
        oidcHelp: 'Proporcione esta URL de retorno de inicio de sesión ({url}) al proveedor de identidad y defina los scopes "openid", "profile", "email".',
        samlHelp: 'Rellene el campo siguiente con los metadatos en formato XML proporcionados por el proveedor de identidad y facilítele a cambio este {link}.',
        samlHelpLink: 'enlace',
        mainSiteExplanation: 'Este sitio corresponde al dominio principal de este servicio. Su documento en la base de datos solo controla la presentación, y únicamente para las categorías indicadas en MAIN_SITE_FROM_DB. La autenticación, los proveedores de identidad y el ámbito de las cuentas proceden siempre de las variables de entorno.'
      }
    },
    contact: {
      title: 'Contacto',
      from: 'Su dirección de correo electrónico',
      subject: 'Asunto',
      text: 'Su solicitud',
      sent: 'Su solicitud se ha enviado'
    },
    login: {
      title: 'Identifíquese',
      emailLabel: 'Su dirección de correo electrónico',
      success: 'Recibirá un correo electrónico en la dirección indicada. Abra el enlace que contiene para completar su inicio de sesión.',
      maildevLink: 'Abrir el buzón de desarrollo',
      newPassword: 'Nueva contraseña',
      newPassword2: 'Confirmar la nueva contraseña',
      changePassword: 'Renovar la contraseña',
      changePasswordTooltip: 'Si ha olvidado su contraseña o necesita cambiarla, renuévela.',
      newPasswordMsg: 'Introduzca la nueva contraseña dos veces.',
      changePasswordSent: 'Se ha enviado un correo electrónico a la dirección {email}. Este correo contiene un enlace para cambiar la contraseña de su cuenta.',
      passwordlessMsg1: 'Para iniciar sesión, basta con un correo electrónico.',
      passwordlessMsg2: 'Enviar un correo electrónico de inicio de sesión.',
      passwordlessConfirmed: 'Se ha enviado un correo electrónico a la dirección {email}. Este correo contiene un enlace para iniciar sesión en la plataforma.',
      createUserMsg1: 'Si nunca ha iniciado sesión en nuestra plataforma, cree una cuenta.',
      createUserMsg2: 'Crear una cuenta',
      createUserInvit: 'Cree una cuenta para aceptar la invitación a la organización {name}',
      createUserOrganization: '¿Desea crear una organización?',
      createUserOrganizationHelp: 'Si crea una organización, podrá invitar a otros usuarios a unirse a ella y compartir recursos.',
      tosMsg: 'Antes de crear su cuenta, lea <a href="{tosUrl}" target="_blank">nuestras condiciones generales de uso</a>.',
      tosConfirm: 'Confirmo que he leído las condiciones generales de uso de este sitio.',
      createUserConfirm: 'Crear la cuenta',
      createUserConfirmed: 'Se ha enviado un correo electrónico a la dirección {email}. Este correo contiene un enlace para validar la creación de su cuenta.',
      adminMode: 'Confirme su identidad para pasar al modo de administración.',
      adminModePromptTitle: 'Modo de administración',
      adminModePromptMsg: 'Su cuenta es una cuenta de superadministrador. ¿Desea activar el modo de administración para esta sesión?',
      adminModePromptAccept: 'Modo de administración',
      adminModePromptDecline: 'Sesión normal',
      oauth: 'Iniciar sesión con:',
      error: 'Error',
      rememberMe: 'Recordarme',
      '2FACode': 'código de 6 dígitos o código de recuperación',
      '2FAInfo': 'Introduzca un código de verificación para continuar. Puede obtener este código en la aplicación de verificación de su teléfono. Si pierde su dispositivo, puede usar el código de recuperación que descargó al configurar la autenticación de dos factores.',
      configure2FA: 'Configurar la autenticación de dos factores',
      configure2FAQRCode: 'Código QR de configuración de la autenticación de dos factores',
      configure2FAQRCodeMsg: 'Escanee este código QR con la herramienta de autenticación que prefiera (como Authy o Google Authenticator) y, a continuación, introduzca el código de 6 dígitos que le proporcione esta aplicación.',
      configure2FACode: 'código de 6 dígitos',
      recovery2FA: 'Código de recuperación',
      recovery2FAInfo: '¡Atención! Guarde el siguiente código de recuperación en un lugar seguro. Sin él, no podrá recuperar su cuenta si pierde el dispositivo en el que acaba de configurar la autenticación de dos factores.',
      recovery2FACode: 'Código de recuperación: ',
      recovery2FADownload: 'Descargar un archivo que contiene el código de recuperación',
      recovery2FAContent: 'Código de recuperación de la autenticación de dos factores {name}',
      plannedDeletion: 'Eliminación programada',
      cancelDeletion: 'Cancelar la eliminación del usuario',
      siteLogo: 'Logotipo del sitio',
      partnerInvitation: 'Invitación de socio',
      changeHost: 'Cuenta asociada al back-office'
    },
    siteAdmin: {
      account: 'Cuenta',
      '2FAActive': 'Autenticación de dos factores activa',
      plannedDeletion: 'Eliminación programada el {date}',
      cancelDeletion: 'Cancelar la eliminación programada de {name}',
      revokeSessions: 'Cerrar todas las sesiones de {name}',
      confirmRevokeSessionsMsg: 'Se cerrarán todas las sesiones de este usuario. Las páginas ya abiertas siguen siendo utilizables unos minutos, hasta que su token de sesión deba renovarse.',
      confirmDeleteMsg: 'La cuenta {email} se eliminará definitivamente y se retirará de todas las organizaciones a las que pertenece.'
    },
    oauthConsent: {
      title: '{client} quiere acceder a su cuenta',
      willBeAble: 'Esta aplicación podrá:',
      redirectHost: 'Después será redirigido a {host}.',
      account: 'Cuenta utilizada',
      personalAccount: 'Cuenta personal',
      organizationAccount: 'Organización',
      allow: 'Permitir',
      deny: 'Denegar',
      broadScope: 'Acceso amplio',
      unverifiedTitle: 'Aplicación no verificada',
      unverifiedCimd: '{client} no es una aplicación verificada. Se identificó con la dirección {url}; nadie la ha comprobado.',
      unverifiedDcr: '{client} no es una aplicación verificada. Se registró automáticamente; nadie ha comprobado su identidad.',
      resourceMcp: 'Solicita acceso al servidor MCP de esta plataforma.',
      resourceApi: 'Solicita acceso a la API de esta plataforma.',
      noOrganization: 'No es administrador de ninguna organización que pueda autorizar esta aplicación.',
      organization: 'Organización',
      nhi: 'Identidad de la aplicación',
      nhiHint: 'Las cuentas de servicio de la organización, gestionadas por sus administradores en la página de la organización.',
      noNhi: 'Esta organización no tiene ninguna cuenta de servicio que esta aplicación pueda usar (cuyos ámbitos cubran al menos uno de los permisos solicitados). Los administradores gestionan las cuentas de servicio en la página de la organización.',
      manageNhis: 'Gestionar las cuentas de servicio',
      permissions: 'Permisos concedidos',
      lifetime: 'Duración de la autorización',
      lifetime1d: '1 día',
      lifetime7d: '7 días',
      lifetime30d: '30 días',
      lifetime90d: '90 días',
      lifetime1y: '1 año',
      errorTitle: 'Autorización imposible',
      errors: {
        interactionExpired: 'La solicitud de autorización ha caducado o ya se ha tramitado. Vuelva a la aplicación e inténtelo de nuevo.',
        unauthorized: 'Su sesión ha caducado o no ha iniciado sesión. Vuelva a iniciar sesión y empiece de nuevo desde la aplicación.',
        forbidden: 'Su sesión no puede conceder esta autorización.',
        generic: 'La solicitud de autorización ha fallado (código: {code}).'
      }
    },
    organization: {
      addMember: 'Invitar a un usuario a unirse a la organización',
      disableInvite: 'Esta organización ya ha alcanzado su número máximo de miembros.',
      deleteMember: 'Retirar a este usuario de la lista de miembros de la organización',
      editMember: 'Cambiar el rol de este usuario en la organización',
      memberReadOnly: 'La pertenencia de este usuario a la organización procede de un proveedor de identidad y no se puede modificar aquí.',
      confirmEditMemberTitle: 'Modificar {name}',
      confirmDeleteMemberTitle: 'Excluir a {name}',
      confirmDeleteMemberMsg: '¿Está seguro de que desea retirar a este usuario de la lista de miembros de la organización {org}?',
      deleteMemberSelfWarning: 'Se trata de su propia pertenencia: puede perder el acceso a esta organización y a sus recursos, sin poder deshacer usted mismo este cambio.',
      editMemberSelfWarning: 'Está modificando su propio rol: puede perder sus derechos de administración sobre esta organización, sin poder deshacer usted mismo este cambio.',
      deleteMemberLastAdmin: 'Es el último administrador de esta organización: nombre primero a otro administrador antes de abandonarla.',
      deleteMemberLastMember: 'Es el último miembro de esta organización y no puede abandonarla. Si ya no se utiliza, debe eliminarse.',
      editMemberLastAdmin: 'Es el último administrador de esta organización: nombre primero a otro administrador antes de cambiar su rol.',
      deleteMemberSuccess: 'El usuario {name} ha sido excluido de la organización.',
      inviteEmail: 'Dirección de correo electrónico del usuario',
      inviteSuccess: 'Se ha enviado una invitación a la dirección {email}',
      invitePartnerSuccess: 'Se ha enviado una invitación a la dirección {email}',
      memberConflict: 'Este usuario ya es miembro',
      departmentLabelTitle: 'Etiqueta para el concepto "departamento"',
      departmentLabelHelp: 'Déjelo vacío para mostrar "{defaultDepartmentLabel}". Rellénelo para utilizar otro término, como "servicio", "agencia", etc.',
      addDepartment: 'Crear {departmentLabel}',
      editDepartment: 'Editar {departmentLabel}',
      deleteDepartment: 'Eliminar {departmentLabel}',
      confirmEditDepartmentTitle: 'Editar {name}',
      confirmDeleteDepartmentTitle: 'Eliminar {name}',
      confirmDeleteDepartmentMsg: '¿Está seguro de que desea eliminar {name} de su organización?',
      deleteDepartmentHasMembers: 'Este departamento está asignado a {count} miembro de la organización. No puede eliminarlo en este estado. | Este departamento está asignado a {count} miembros de la organización. No puede eliminarlo en este estado.',
      departmentIdInvalid: 'El identificador solo puede contener letras, dígitos y espacios.',
      inviteLink: 'Si hay algún problema con el envío por correo electrónico, puede enviar el siguiente enlace de confirmación por otro medio. ¡Atención! Corre el riesgo de introducir una dirección de correo electrónico incorrecta o que no funcione en la base de datos de usuarios. Esta dirección puede causar varios problemas más adelante: cambio de contraseña, envío de alertas, etc.',
      '2FARoles': 'Autenticación de dos factores.',
      '2FARolesMsg': 'Hacer obligatoria la autenticación de dos factores para los usuarios con estos roles.',
      sendInvitationLink: 'Enviar otro enlace de invitación',
      addPartner: 'Invitar a una organización socia',
      deletePartner: 'Eliminar este socio',
      depSortCreation: 'Creación más reciente',
      depSortAlpha: 'Orden alfabético',
      deletePartnerWarning: 'Se retirarán los permisos concedidos a esta organización sobre sus recursos.',
      partnerInvitationExpired: 'invitación caducada',
      partnersQuotaHelp: 'Las invitaciones pendientes cuentan en la cuota, salvo las caducadas.',
      partnersQuotaPending: '{count} invitación pendiente ocupa una plaza: elimínela para liberarla o espere a que caduque. | {count} invitaciones pendientes ocupan una plaza: elimine una para liberarla o espere a que caduque.',
      fromCache: 'Última sincronización de esta lista con el proveedor de identidad: {fromNow}.',
      roleLabel: 'Etiqueta del rol "{role}"',
      infoTitle: 'Información',
      siteUsersTitle: 'Cuentas del sitio',
      siteUsersHelp: 'Cuentas creadas en este sitio, el sitio principal de la organización. Como administrador de la organización, puede restablecer su autenticación de dos factores, cancelar una eliminación programada, cerrar sus sesiones o eliminarlas.',
      nhisTitle: 'Cuentas de servicio (identidades no humanas)',
      nhisHelp: 'Las cuentas de servicio son las identidades no humanas de la organización. Se autentican con un token emitido por un proveedor de identidad de confianza (por ejemplo, un clúster de Kubernetes) o sirven de identidad a las aplicaciones OAuth (por ejemplo, un agente de IA) que un administrador les conecta. No tienen correo electrónico y sus sesiones son de corta duración.',
      addNhi: 'Crear una cuenta de servicio',
      editNhi: 'Editar la cuenta de servicio',
      deleteNhi: 'Eliminar la cuenta de servicio',
      confirmDeleteNhiTitle: 'Eliminar la cuenta de servicio {name}',
      confirmDeleteNhiMsg: '¿Está seguro de que desea eliminar esta cuenta de servicio? Los tokens en curso dejarán de funcionar cuando caduquen.',
      nhiIssuer: 'Emisor del token',
      nhiSubject: 'Sujeto',
      nhiKeyBindingHint: 'Deje vacíos el emisor y el sujeto para una cuenta de servicio usada solo por aplicaciones OAuth.',
      nhiOauthOnly: 'Solo conexiones OAuth',
      nhiConnections: 'Conexiones OAuth',
      nhiConnectionsCount: '{count} conexión | {count} conexiones',
      nhiConnectionLastUsed: 'último uso el {date}',
      nhiConnectionNeverUsed: 'nunca utilizada',
      nhiConnectionExpires: 'caduca el {date}',
      revokeNhiConnections: 'Revocar las conexiones',
      revokeNhiConnectionsTitle: 'Revocar las conexiones de {name}',
      revokeNhiConnectionsWarning: 'El cliente ya no podrá actuar con esta cuenta de servicio. Los tokens de acceso ya emitidos siguen siendo válidos durante un máximo de {duration}.',
      nhiAllowedIps: 'Direcciones permitidas (opcional)',
      nhiAllowedIpsHint: 'Direcciones o subredes CIDR desde las que se acepta el intercambio de token, por ejemplo 203.0.113.5 o 10.4.0.0/16. Déjelo vacío para aceptar cualquier dirección.',
      nhiIpBinding: 'Vincular la sesión a la dirección desde la que se obtuvo',
      nhiIpBindingHint: 'Un token filtrado queda inutilizable desde cualquier otro lugar. Actívelo solo si esta cuenta de servicio llama siempre desde una dirección estable: una dirección de salida cambiante (grupo NAT, doble pila) rompería sus sesiones.',
      nhiScopes: 'Ámbitos (opcional)',
      nhiScopesHint: 'Los permisos de esta cuenta de servicio, por ejemplo datasets:read o datasets. Déjelo vacío para una cuenta sin restricciones que actúa con todos los derechos de su rol.',
      nhiUnrestricted: 'Acceso sin restricciones (todos los derechos de su rol)',
      nhiJwks: 'JWKS (opcional, si el proveedor no es accesible públicamente)',
      nhiClientId: 'Identificador de cliente (client_id)',
      nhiJwksInvalid: 'JSON no válido para el JWKS: {message}'
    },
    invitation: {
      title: 'Invitación validada',
      msgSameUser: 'Se ha validado su invitación para ser miembro de una organización. Puede consultar <a href="{profileUrl}">su perfil</a>.',
      msgDifferentUser: 'Se ha validado esta invitación para ser miembro de una organización. Puede <a href="{loginUrl}">iniciar sesión</a> con la cuenta invitada.'
    },
    avatar: {
      changeUser: 'Cambiar el avatar de su cuenta',
      changeOrganization: 'Cambiar el avatar de la organización',
      changeDepartment: 'Cambiar el avatar de "{departmentName}"',
      reset: 'Restablecer el avatar por defecto'
    },
    me: {
      emailNotEditable: 'Esta dirección no se puede modificar.',
      noOrganization: 'No es miembro de ninguna organización.',
      operations: 'Operaciones sensibles',
      deleteMyself: 'Eliminar esta cuenta',
      deleteMyselfAlert: 'Si elimina su cuenta de usuario, dispondrá de un plazo de {plannedDeletionDelay} días para cancelar la operación; transcurrido ese plazo, todos los datos asociados se eliminarán y no se podrán recuperar.',
      deleteMyselfCheck: 'Marque esta casilla y haga clic en Aceptar para confirmar la eliminación del usuario {name} y de todos sus datos.',
      accountChanges: 'Cambio de cuenta',
      defaultOrg: 'Activar esta cuenta por defecto después de cada inicio de sesión',
      ignorePersonalAccount: 'Marque esta casilla si no desea utilizar esta plataforma fuera de una cuenta de organización',
      sessions: 'Sus sesiones',
      deleteSession: '¿Eliminar la sesión en {deviceName}?',
      deleteSessionWarning: 'La eliminación de la sesión puede tardar hasta {duration} en aplicarse por completo.',
      settings: 'Su configuración',
      connectedApplications: 'Aplicaciones conectadas',
      revokeApplication: 'Revocar el acceso',
      revokeApplicationTitle: '¿Revocar el acceso de {name}?',
      revokeApplicationWarning: 'La aplicación ya no podrá usar su cuenta. Los tokens de acceso ya emitidos siguen siendo válidos durante un máximo de {duration}.',
      applicationGrantedOn: 'Autorizada el {date}',
      applicationLastUsed: 'último uso el {date}',
      applicationNeverUsed: 'nunca utilizada',
      applicationExpires: 'caduca el {date}',
      applicationPersonalAccount: 'Cuenta personal'
    },
    colorsPreview: {
      title: 'Vista previa de los colores',
      cardTitle: 'Un ejemplo de tarjeta',
      cardText: 'Utiliza el color de las "superficies".'
    },
    partnerInvitation: {
      msg1: 'La organización {name} desea añadir a {partnerName} como socio, con {email} como dirección de contacto.',
      msg2: 'El nombre "{partnerName}" es orientativo y no corresponde necesariamente al nombre exacto de su organización.',
      diffEmail: 'Ha iniciado sesión con la cuenta de usuario {userName} ({userEmail}). Puede iniciar sesión con otra cuenta o crear una nueva haciendo clic en el botón de abajo.',
      noUser1: '¿Ya tiene una cuenta? Puede iniciar sesión y después será redirigido a esta página.',
      noUser2: '¿Aún no tiene una cuenta? Puede crear una y después será redirigido a esta página.',
      noOrg: 'No pertenece a ninguna organización. Puede crear una nueva organización y aceptar la invitación en su nombre.',
      org: 'Puede aceptar esta invitación en nombre de una organización de la que sea administrador, o bien crear una nueva organización y aceptar la invitación en su nombre.',
      createOrg: 'Crear una nueva organización',
      newOrgName: 'Nombre de la nueva organización',
      create: 'Crear',
      acceptAs: 'Aceptar en nombre de {name}'
    },
    changeHost: {
      msg1: 'La cuenta {email} no existe en {host}, pero sí existe en {mainHost}.',
      sso1: 'Solución: usar {mainHost} para iniciar sesión',
      sso2: 'La página de inicio de sesión ofrece un botón para iniciar sesión desde {mainHost} que puede usar. También puede usar <a class="text-primary" href="{mainHostLogin}">este enlace</a>.',
      solution1: 'Solución: trasladar la cuenta a {host}',
      solution2: 'Si elige esta solución, perderá la posibilidad de iniciar sesión en {mainHost}.',
      confirmMigration: 'Trasladar la cuenta a {host} y perder el acceso a {mainHost}'
    },
    orgStorage: {
      activate: 'Activar el almacenamiento secundario de usuarios',
      link: 'Enlace de conexión para usar este almacenamiento secundario',
      ldap: 'Configuración LDAP'
    }
  },
  errors: {
    badEmail: 'La dirección de correo electrónico está vacía o mal formada.',
    badProviderInvitEmail: 'La dirección de correo electrónico con la que acaba de iniciar sesión no coincide con la de la invitación que recibió',
    maxCreatedOrgs: 'El usuario no puede crear más organizaciones. Se ha alcanzado el límite.',
    permissionDenied: 'Permisos insuficientes.',
    nonEmptyOrganization: 'Debe retirar a los demás miembros de esta organización.',
    userUnknown: 'Usuario desconocido.',
    orgaUnknown: 'Organización desconocida.',
    invitationConflict: 'Este usuario ya es miembro de la organización.',
    unknownRole: 'El rol {role} es desconocido.',
    serviceUnavailable: 'Servicio no disponible por mantenimiento.',
    badCredentials: 'Dirección de correo electrónico o contraseña no válida.',
    updatePassword: 'Debe actualizar su contraseña, porque no se ha cambiado desde hace demasiado tiempo, de acuerdo con nuestras políticas de seguridad.',
    missingToken: 'Falta el parámetro id_token.',
    invalidToken: 'El token no es válido. Puede que haya caducado.',
    differentPasswords: 'Las contraseñas no coinciden',
    noPasswordless: 'Este servicio no acepta la autenticación sin contraseña.',
    rateLimitAuth: 'Demasiados intentos en poco tiempo. Espere antes de volver a intentarlo.',
    invalidInvitationToken: 'El enlace de invitación que recibió no es válido.',
    expiredInvitationToken: 'El enlace de invitación que recibió ha caducado; ya no puede aceptar esta invitación.',
    maxNbMembers: 'La organización ya tiene el número máximo de miembros permitido por sus cuotas.',
    maxNbDepartments: 'La organización ya tiene el número máximo de departamentos permitido por sus cuotas.',
    maxNbPartners: 'La organización ya tiene el número máximo de socios permitido por sus cuotas, incluidas las invitaciones pendientes no caducadas.',
    unknownOAuthProvider: 'La autenticación OAuth no es compatible.',
    unknownSAMLProvider: 'La autenticación SAML no es compatible.',
    adminModeOnly: 'Funcionalidad reservada a los superadministradores.',
    adminChangeHostBlocked: 'Los superadministradores no pueden transferir su cuenta a un sitio secundario. Inicie sesión desde el sitio principal.',
    emailNotConfirmed: 'Su dirección de correo electrónico aún no se ha confirmado. Se le acaba de enviar un nuevo enlace de confirmación; ábralo para activar su cuenta.',
    '2FANotConfigured': 'La autenticación de dos factores es obligatoria para esta cuenta y aún no está configurada.',
    passwordless2FA: 'La autenticación sin contraseña es incompatible con la autenticación de dos factores obligatoria para esta cuenta.',
    bad2FAToken: 'Código de verificación de la autenticación de dos factores no válido o caducado',
    plannedDeletion: 'La eliminación del usuario {name} y de todos sus datos está programada para el {plannedDeletion}.',
    onlyCreateInvited: 'No puede crear una cuenta directamente. Debe recibir una invitación de una organización.',
    badIDPQuery: 'Solicitud considerada no válida por el proveedor de identidad.',
    badIDPResponse: 'Respuesta no válida del proveedor de identidad; vuelva a intentar iniciar sesión.',
    duplicateDep: 'El nuevo departamento es un duplicado',
    passwordEntropy: 'La contraseña no es lo suficientemente segura.',
    passwordMinLength: 'La contraseña debe contener al menos {minLength} caracteres.',
    passwordMinCharClasses: 'La contraseña debe contener al menos {minCharClasses} tipos de caracteres diferentes (minúsculas, mayúsculas, dígitos, caracteres especiales).',
    forbiddenPassword: 'Esta contraseña figura en una lista de contraseñas conocidas y no se puede utilizar.',
    samePassword: 'La nueva contraseña debe ser diferente de la anterior.',
    conflict2FA: 'La autenticación de dos factores ya está configurada para esta cuenta.',
    oauthNoEmail: 'Inicio de sesión rechazado: el proveedor de identidad no ha enviado ninguna dirección de correo electrónico.',
    oauthEmailNotVerified: 'Inicio de sesión rechazado: el proveedor de identidad no indica esta dirección de correo electrónico como verificada.',
    githubNoVerifiedEmail: 'Inicio de sesión rechazado: no se ha encontrado ninguna dirección de correo electrónico principal verificada en la cuenta de GitHub.',
    facebookDisabled: 'El inicio de sesión con Facebook está desactivado: Facebook no indica si la dirección de correo electrónico ha sido verificada.',
    partnerInvitationMismatch: 'Esta solicitud no corresponde a la invitación enviada.',
    partnerConflict: 'Esta organización ya es socia.',
    noPendingPartnerInvitation: 'No hay ninguna invitación pendiente de validación.',
    memberOfParentOrg: 'Este usuario es miembro de la organización principal, no se puede añadir a un departamento.',
    memberOfDepartment: 'Este usuario es miembro de un departamento, no se puede añadir a la organización principal.',
    departmentUnknown: 'Departamento desconocido.',
    unknownOrgRole: 'El rol {role} es desconocido en la organización {org}.',
    missingDepartmentAttribute: 'El proveedor de identidad no ha enviado el atributo de departamento, que es obligatorio.',
    otherCoreIdProvider: 'Este usuario ya está vinculado a otro proveedor de identidad principal.',
    authOnlyOtherSiteChain: 'No se puede usar el sitio {host} como referencia para la autenticación: también está configurado para autenticarse únicamente en otro sitio.',
    spamSuspected: 'Mensaje rechazado: la actividad se parece a la de un robot de spam.',
    rateLimitMessages: 'Demasiados mensajes en poco tiempo. Espere antes de volver a intentarlo.'
  },
  mails: {
    // the message forwarded by the contact form
    contact: {
      intro: 'Mensaje enviado a través del formulario de contacto de {site} por {from}'
    },
    creation: {
      subject: 'Bienvenido a {host}',
      text: `
Se ha realizado una solicitud de creación de cuenta desde {host} para esta dirección de correo electrónico. Para activar la cuenta, debe copiar la siguiente URL en un navegador. Esta URL es válida durante 15 minutos.

{link}

Si tiene algún problema con su cuenta o no ha solicitado crear una cuenta en {host}, no dude en contactarnos en {contact}.
      `,
      htmlMsg: 'Se ha realizado una solicitud de creación de cuenta desde <a href="{origin}">{host}</a> para esta dirección de correo electrónico. Para confirmarla, haga clic en el botón de abajo. El enlace es válido durante 15 minutos.',
      htmlButton: 'Validar la creación de la cuenta',
      htmlAlternativeLink: 'Si el botón de arriba no funciona, puede copiar este enlace en la barra de direcciones de su navegador:',
      htmlCaption: 'Si tiene algún problema con su cuenta o no ha solicitado crear una cuenta en <a href="{origin}">{host}</a>, no dude en contactarnos en <a href="mailto:{contact}">{contact}</a>.'
    },
    login: {
      subject: 'Inicio de sesión en {host}',
      text: `
Se ha realizado una solicitud de inicio de sesión desde {host}. Para confirmarla, copie la siguiente URL en un navegador. Esta URL es válida durante 15 minutos.

{link}

Si tiene algún problema con su cuenta o no ha solicitado iniciar sesión en {host}, no dude en contactarnos en {contact}.
      `,
      htmlMsg: 'Se ha realizado una solicitud de inicio de sesión desde <a href="{origin}">{host}</a>. Para confirmarla, haga clic en el botón de abajo. El enlace es válido durante 15 minutos.',
      htmlButton: 'Iniciar sesión en {host}',
      htmlAlternativeLink: 'Si el botón de arriba no funciona, puede copiar este enlace en la barra de direcciones de su navegador:',
      htmlCaption: 'Si tiene algún problema con su cuenta o no ha solicitado iniciar sesión en <a href="{origin}">{host}</a>, no dude en contactarnos en <a href="mailto:{contact}">{contact}</a>.'
    },
    noCreation: {
      subject: 'Error de autenticación en {host}',
      text: `
Se ha realizado una solicitud de inicio de sesión desde {host}, pero se ha rechazado porque esta dirección de correo electrónico es desconocida o no ha sido validada.

No dude en contactarnos en {contact}.
      `,
      htmlMsg: 'Se ha realizado una solicitud de inicio de sesión desde <a href="{origin}">{host}</a>, pero se ha rechazado porque esta dirección de correo electrónico es desconocida o no ha sido validada.',
      htmlCaption: 'No dude en contactarnos en <a href="mailto:{contact}">{contact}</a>.'
    },
    conflict: {
      subject: 'No se ha podido crear la cuenta en {host}',
      text: `
Se ha realizado una solicitud de creación de cuenta desde {host}, pero se ha rechazado porque esta dirección de correo electrónico ya está asociada a una cuenta.

No dude en contactarnos en {contact}.
      `,
      htmlMsg: 'Se ha realizado una solicitud de creación de cuenta desde <a href="{origin}">{host}</a>, pero se ha rechazado porque esta dirección de correo electrónico ya está asociada a una cuenta.',
      htmlCaption: 'No dude en contactarnos en <a href="mailto:{contact}">{contact}</a>.'
    },
    invitation: {
      subject: 'Únase a la organización {organization} en {host}',
      text: `
Un administrador de la organización {organization} le ha invitado a unirse a ella. Para aceptar esta invitación, copie la siguiente URL en un navegador. Esta URL es válida durante 10 días.

{link}

Si tiene algún problema con su cuenta o esta invitación le parece sospechosa, no dude en contactarnos en {contact}.
      `,
      htmlMsg: `
Un administrador de la organización {organization} le ha invitado a unirse a ella. Para aceptar esta invitación, haga clic en el botón de abajo. El enlace es válido durante 10 días.
      `,
      htmlButton: 'Aceptar la invitación',
      htmlAlternativeLink: 'Si el botón de arriba no funciona, puede copiar este enlace en la barra de direcciones de su navegador:',
      htmlCaption: 'Si tiene algún problema con su cuenta o esta invitación le parece sospechosa, no dude en contactarnos en <a href="mailto:{contact}">{contact}</a>.'
    },
    invitationSecondary: {
      subject: 'Únase a la organización {organization} en {host}',
      text: `
Un administrador de la organización {organization} le ha invitado a unirse a ella en {host} para acceder a {secondaryHost}. Para aceptar esta invitación, copie la siguiente URL en un navegador. Esta URL es válida durante 10 días.

{link}

Si tiene algún problema con su cuenta o esta invitación le parece sospechosa, no dude en contactarnos en {contact}.
      `,
      htmlMsg: `
Un administrador de la organización {organization} le ha invitado a unirse a ella en {host} para acceder a <b>{secondaryHost}</b>. Para aceptar esta invitación, haga clic en el botón de abajo. El enlace es válido durante 10 días.
      `,
      htmlButton: 'Aceptar la invitación',
      htmlAlternativeLink: 'Si el botón de arriba no funciona, puede copiar este enlace en la barra de direcciones de su navegador:',
      htmlCaption: 'Si tiene algún problema con su cuenta o esta invitación le parece sospechosa, no dude en contactarnos en <a href="mailto:{contact}">{contact}</a>.'
    },
    partnerInvitation: {
      subject: 'La organización {organization} de {host} desea añadir a {partner} como socio',
      text: `
Un administrador de la organización {organization} le invita, como contacto de la organización {partner}, a unirse a ella en {host}. Para aceptar esta invitación, copie la siguiente URL en su navegador. Esta URL es válida durante 10 días.

{link}

Si tiene algún problema con su cuenta o esta invitación le parece sospechosa, no dude en contactarnos en {contact}.
      `,
      htmlMsg: `
Un administrador de la organización {organization} le invita, como contacto de la organización {partner}, a unirse a ella en {host}. Para aceptar esta invitación, haga clic en el botón de abajo. El enlace es válido durante 10 días.
      `,
      htmlButton: 'Aceptar la invitación',
      htmlAlternativeLink: 'Si el botón de arriba no funciona, puede copiar este enlace en la barra de direcciones de su navegador:',
      htmlCaption: 'Si tiene algún problema con su cuenta o esta invitación le parece sospechosa, no dude en contactarnos en <a href="mailto:{contact}">{contact}</a>.'
    },
    action: {
      subject: 'Realice una acción en su cuenta de {host}',
      text: `
Se ha iniciado una acción que requiere confirmación por correo electrónico en esta dirección. Para confirmar esta acción, copie la siguiente URL en un navegador. Esta URL es válida durante 15 minutos.

{link}

Si tiene algún problema con su cuenta o este mensaje le parece sospechoso, no dude en contactarnos en {contact}.
      `,
      htmlMsg: `
Se ha iniciado una acción que requiere confirmación por correo electrónico en esta dirección. Para confirmar esta acción, haga clic en el botón de abajo. El enlace es válido durante 15 minutos.
      `,
      htmlButton: 'Confirmar',
      htmlAlternativeLink: 'Si el botón de arriba no funciona, puede copiar este enlace en la barra de direcciones de su navegador:',
      htmlCaption: 'Si tiene algún problema con su cuenta o este mensaje le parece sospechoso, no dude en contactarnos en <a href="mailto:{contact}">{contact}</a>.'
    },
    plannedDeletion: {
      subject: 'Eliminación de cuenta programada en {host}',
      text: `
El usuario {user} y todos sus datos asociados se eliminarán definitivamente el {plannedDeletion}. {cause}

Para cancelar la eliminación, puede iniciar sesión con este enlace: {link}.

No dude en contactarnos en {contact}.
      `,
      htmlMsg: 'El usuario {user} y todos sus datos asociados se eliminarán definitivamente el {plannedDeletion}. {cause}',
      htmlButton: 'Iniciar sesión para cancelar la eliminación',
      htmlAlternativeLink: 'Si el botón de arriba no funciona, puede copiar este enlace en la barra de direcciones de su navegador:',
      htmlCaption: 'No dude en contactarnos en <a href="mailto:{contact}">{contact}</a>.',
      causeInactivity: 'Esta operación se ha iniciado automáticamente porque esta cuenta está inactiva desde el {date}.'
    }
  },
  notifications: {
    sentInvitationTopic: 'se ha enviado una invitación',
    sentInvitation: 'Se ha enviado un correo electrónico a {email} con una invitación para unirse a la organización {orgName}.',
    acceptedInvitationTopic: 'se ha aceptado una invitación',
    acceptedInvitation: 'El usuario {name} ({email}) se ha unido a la organización {orgName}.',
    userCreated: 'El usuario {name} ({email}) se ha registrado en el sitio {host}.',
    userCreatedOrg: 'El usuario {name} ({email}) se ha registrado en el sitio {host} en la organización {orgName}.',
    sentPartnerInvitationTopic: 'se ha enviado una invitación de socio',
    sentPartnerInvitation: 'Se ha enviado un correo electrónico a {email} con una invitación para que la organización {partnerName} se una a la organización {orgName} como socio.',
    acceptedPartnerInvitationTopic: 'se ha aceptado una invitación de socio',
    acceptedPartnerInvitation: 'La organización {partnerName} ({email}) se ha unido a la organización {orgName} como socio.',
    addMemberTopic: 'se ha añadido un miembro',
    addMember: 'El usuario {name} ({email}) se ha unido a la organización {orgName}.'
  },
  // server-side only (not in publicMessages): reported through
  // mainSiteWarnings on the sites API and by the boot check
  mainSite: {
    ignoredField: 'El campo "{field}" se ignora en el sitio principal: esta configuración procede de las variables de entorno.',
    ignoredCategory: 'El valor guardado para "{category}" se ignora: MAIN_SITE_FROM_DB no contiene esta categoría.'
  },
  // server-side only: simple-directory's own scopes, merged with the platform scopes
  scopes: {
    organizations: 'Todos los ámbitos de organizaciones',
    'organizations:read': 'Leer las organizaciones, sus roles y sus miembros',
    'all:read': 'Leer todo lo que permite el rol, en todos los servicios',
    'all:write': 'Leer y modificar todo lo que permite el rol, en todos los servicios',
    'all:admin': 'Todos los derechos que permite el rol, en todos los servicios'
  }
}
